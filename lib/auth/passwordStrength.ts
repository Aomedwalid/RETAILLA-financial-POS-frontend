export type StrengthLevel = "none" | "weak" | "fair" | "good" | "strong";

export interface PasswordStrengthResult {
  level: StrengthLevel;
  score: number;
  label: string;
}

export function getPasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return { level: "none", score: 0, label: "No password" };
  }

  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 1) return { level: "weak", score, label: "Weak" };
  if (score === 2) return { level: "fair", score, label: "Fair" };
  if (score === 3) return { level: "good", score, label: "Good" };
  return { level: "strong", score, label: "Strong" };
}
