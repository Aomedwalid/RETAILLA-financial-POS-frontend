export interface ValidationErrors {
  [field: string]: string;
}

type TFunction = (key: string, options?: Record<string, unknown>) => string;

export function validateProductForm(data: {
  name: string;
  price: string;
  cost: string;
  category_id: string;
  stock_quantity?: string;
  variantsEnabled?: boolean;
  variants?: { stock_quantity: string; attributes: Record<string, string> }[];
}, t: TFunction): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.name.trim()) errors.name = t("validation.productNameRequired");
  if (!data.price || parseFloat(data.price) <= 0) errors.price = t("validation.pricePositive");
  if (!data.cost || parseFloat(data.cost) < 0) errors.cost = t("validation.costRequired");
  if (data.price && data.cost && parseFloat(data.cost) > parseFloat(data.price)) errors.cost = t("validation.costExceedsPrice");

  if (data.variantsEnabled && data.variants && data.variants.length > 0) {
    if (data.variants.length > 100) {
      errors.variants = t("validation.maxVariants");
      return errors;
    }

    const firstKeys = Object.keys(data.variants[0].attributes).map((k) => k.trim().toLowerCase()).sort();

    data.variants.forEach((v, i) => {
      const keys = Object.keys(v.attributes).map((k) => k.trim().toLowerCase()).sort();
      if (keys.length !== firstKeys.length || !keys.every((k, j) => k === firstKeys[j])) {
        errors[`variants.${i}.keys`] = t("validation.variantAttributesMatch", { index: i + 1 });
      }
    });

    const seen = new Set<string>();
    data.variants.forEach((v, i) => {
      const normalized: Record<string, string> = {};
      for (const [k, val] of Object.entries(v.attributes)) {
        normalized[k.trim().toLowerCase()] = val.trim().toLowerCase();
      }
      const sig = JSON.stringify(Object.entries(normalized).sort());
      if (seen.has(sig)) {
        errors[`variants.${i}.duplicate`] = t("validation.variantDuplicate", { index: i + 1 });
      }
      seen.add(sig);
    });

    if (data.variants.length === 0) {
      errors.variants = t("validation.variantRequired");
    }
  }

  return errors;
}

export function validateStockAdjustment(quantity: string, t: TFunction): string | null {
  if (!quantity) return t("validation.quantityRequired");
  const q = parseInt(quantity, 10);
  if (isNaN(q) || q <= 0) return t("validation.quantityPositive");
  return null;
}
