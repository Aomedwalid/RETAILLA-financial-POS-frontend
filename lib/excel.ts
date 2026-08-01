import type * as XLSX from "xlsx";

export type ExcelCellValue = string | number | Date | null | undefined;
export type ExcelCellType = "text" | "number" | "currency" | "date";

export interface ExcelColumnDescriptor {
  header: string;
  type?: ExcelCellType;
  width?: number;
}

export interface ExcelColumn<T> extends ExcelColumnDescriptor {
  value: (row: T) => ExcelCellValue;
}

const DATE_FORMAT = "yyyy-mm-dd hh:mm";
const CURRENCY_FORMAT = "#,##0.00";
const MIN_COLUMN_WIDTH = 10;
const MAX_COLUMN_WIDTH = 60;
const WIDTH_PADDING_RATIO = 1.1;
const WIDTH_EXTRA = 2;
const AUTO_WIDTH_SAMPLE_ROWS = 1000;
const ARABIC_GLYPH_FACTOR = 1.8;

function toExcelDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function makeCell(value: ExcelCellValue, type: ExcelCellType | undefined): XLSX.CellObject {
  if (value === null || value === undefined) return { t: "s", v: "" };

  if (type === "date") {
    const date = typeof value === "string" || value instanceof Date ? toExcelDate(value) : null;
    return date ? { t: "d", v: date, z: DATE_FORMAT } : { t: "s", v: String(value) };
  }

  if (type === "number" || type === "currency") {
    const number = typeof value === "number" ? value : parseFloat(String(value));
    if (!isNaN(number)) {
      return type === "currency" ? { t: "n", v: number, z: CURRENCY_FORMAT } : { t: "n", v: number };
    }
  }

  if (typeof value === "number") return { t: "n", v: value };
  return { t: "s", v: String(value) };
}

function displayWidth(value: ExcelCellValue): number {
  if (value === null || value === undefined) return 0;
  if (value instanceof Date) return DATE_FORMAT.length;
  let width = 0;
  for (const char of String(value)) {
    width += char.charCodeAt(0) > 127 ? ARABIC_GLYPH_FACTOR : 1;
  }
  return width;
}

function clampColumnWidth(characterCount: number): number {
  const width = Math.ceil(characterCount * WIDTH_PADDING_RATIO + WIDTH_EXTRA);
  return Math.min(Math.max(width, MIN_COLUMN_WIDTH), MAX_COLUMN_WIDTH);
}

export async function buildWorkbook(
  columns: ExcelColumnDescriptor[],
  rows: ExcelCellValue[][],
  sheetName = "Data"
): Promise<ArrayBuffer> {
  const XLSX = await import("xlsx");

  const worksheet: XLSX.WorkSheet = {};
  const lastRow = rows.length;
  const lastColumn = columns.length - 1;
  worksheet["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: lastRow, c: lastColumn },
  });

  columns.forEach((column, index) => {
    worksheet[XLSX.utils.encode_cell({ r: 0, c: index })] = { t: "s", v: column.header };
  });

  rows.forEach((row, rowIndex) => {
    columns.forEach((column, columnIndex) => {
      worksheet[XLSX.utils.encode_cell({ r: rowIndex + 1, c: columnIndex })] = makeCell(
        row[columnIndex],
        column.type
      );
    });
  });

  worksheet["!cols"] = columns.map((column, index) => {
    if (column.width) return { wch: column.width };
    let widest = displayWidth(column.header);
    const sample = Math.min(rows.length, AUTO_WIDTH_SAMPLE_ROWS);
    for (let row = 0; row < sample; row++) {
      widest = Math.max(widest, displayWidth(rows[row][index]));
    }
    return { wch: clampColumnWidth(widest) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
}

export function buildFileName(baseName: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${baseName}_${year}-${month}-${day}.xlsx`;
}

export function downloadBlob(data: ArrayBuffer, fileName: string): void {
  const blob = new Blob([data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
