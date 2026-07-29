export interface ValidationErrors {
  [field: string]: string;
}

const EGYPT_MOBILE_PREFIXES = ["010", "011", "012", "015"];

export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-]/g, "");
  if (cleaned.startsWith("+20")) cleaned = "0" + cleaned.slice(3);
  else if (cleaned.startsWith("20") && cleaned.length > 11) cleaned = "0" + cleaned.slice(2);
  return cleaned;
}

export function validateCustomerForm(data: {
  name: string;
  email: string;
  phone?: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.name.trim()) errors.name = "Customer name is required";

  if (data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Invalid email format";
  }

  const phoneErr = validatePhone(data.phone ?? "");
  if (phoneErr) errors.phone = phoneErr;

  return errors;
}

export function validatePhone(phone: string): string | null {
  if (!phone.trim()) return null;

  if (!/^[\d\s\-+]+$/.test(phone)) {
    return "Phone number contains invalid characters.";
  }

  const normalized = normalizePhone(phone);
  const digits = normalized.replace(/\D/g, "");

  if (!/^\d+$/.test(normalized)) {
    return "Phone number contains invalid characters.";
  }

  if (digits.length !== 11) {
    return "Phone number must contain exactly 11 digits.";
  }

  const prefix = digits.slice(0, 3);
  if (!EGYPT_MOBILE_PREFIXES.includes(prefix)) {
    return "Phone number must start with 010, 011, 012, or 015.";
  }

  return null;
}

export function validateDebtAmount(amount: string): string | null {
  if (!amount) return "Amount is required";
  const n = parseFloat(amount);
  if (isNaN(n) || n <= 0) return "Amount must be a positive number";
  return null;
}

export function validatePoints(points: string, available: number): string | null {
  if (!points) return "Points are required";
  const n = parseInt(points, 10);
  if (isNaN(n) || n <= 0) return "Points must be a positive integer";
  if (n > available) return "Not enough points available";
  return null;
}
