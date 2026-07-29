"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authApi, ApiError } from "@/lib/api";
import AuthTextField from "@/components/auth/AuthTextField";
import AuthPasswordField from "@/components/auth/AuthPasswordField";
import { getPasswordStrength } from "@/lib/auth/passwordStrength";
import { useTranslation } from "react-i18next";

const strengthColors: Record<string, string> = {
  weak: "bg-error",
  fair: "bg-[#d99c00]",
  good: "bg-secondary",
  strong: "bg-primary",
};

function validatePassword(password: string, t: (key: string) => string): string | null {
  if (password.length < 9) return t("validation.passwordMin");
  if (!/[a-zA-Z]/.test(password)) return t("validation.passwordLetter");
  if (!/\d/.test(password)) return t("validation.passwordNumber");
  return null;
}

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlToken = searchParams.get("token") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState(urlToken);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(password);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!token.trim()) { setError(t("validation.tokenRequired")); return; }
    if (!email.trim()) { setError(t("validation.email")); return; }
    if (!password) { setError(t("validation.password")); return; }
    if (password !== confirmPassword) { setError(t("validation.passwordsDoNotMatch")); return; }

    const passwordError = validatePassword(password, t);
    if (passwordError) { setError(passwordError); return; }

    setLoading(true);
    try {
      await authApi.registerWithToken({ token: token.trim(), email: email.trim(), password });
      router.replace("/login?registered=true");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.validationErrors?.[0]?.message || err.message);
      } else {
        setError(t("common.somethingWentWrong"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-surface-dim">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
            <Image src="/logo.png" alt="Logo" width={56} height={56} className="object-contain" priority />
            <span className="text-lg font-semibold text-on-surface tracking-tight">{t("app.name")}</span>
          </div>

          <h2 className="text-headline-md font-headline-md text-on-surface mb-1">{t("auth.createAccount")}</h2>
          <p className="text-sm text-on-surface-variant mb-8">{t("auth.registerDescription")}</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <AuthTextField
              label={t("auth.inviteToken")}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={t("auth.tokenPlaceholder")}
              autoFocus={!urlToken}
            />

            <AuthTextField
              label={t("auth.email")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.emailPlaceholder")}
              autoComplete="email"
              autoFocus={!!urlToken}
            />

            <div>
              <AuthPasswordField
                label={t("auth.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.passwordPlaceholder")}
                autoComplete="new-password"
              />
              {password && (
                <div className="mt-2.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          i <= strength.score ? strengthColors[strength.level] : "bg-surface-container-highest"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs mt-1 font-medium ${
                    strength.level === "weak" ? "text-error" :
                    strength.level === "fair" ? "text-[#d99c00]" :
                    strength.level === "good" ? "text-secondary" :
                    "text-primary"
                  }`}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            <AuthPasswordField
              label={t("auth.password")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("auth.passwordPlaceholder")}
              autoComplete="new-password"
            />

            {error && (
              <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-primary text-on-primary font-medium text-sm hover:brightness-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>}
              {loading ? t("auth.creatingAccount") : t("auth.createAccount")}
            </button>
          </form>

          <p className="text-sm text-on-surface-variant text-center mt-8">
            {t("auth.alreadyHaveAccount")}{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              {t("auth.signIn")}
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#0f1923] to-[#1a1f2e] relative overflow-hidden p-16 flex-col justify-between">
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_20%_50%,rgba(172,199,255,0.4),transparent_60%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-12">
            <Image src="/logo.png" alt="Logo" width={56} height={56} className="object-contain" priority />
            <span className="text-lg font-semibold text-on-surface tracking-tight">{t("app.name")}</span>
          </div>

          <h1 className="text-display-lg-mobile lg:text-display-lg font-display-lg text-on-surface leading-tight mb-4">
            {t("auth.yourAccount")}
            <br />
            <span className="text-primary">{t("auth.startsHere")}</span>
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-md leading-relaxed">
            {t("auth.registerDescription")}
          </p>

          <div className="mt-12 flex flex-col gap-5">
            {[
              { icon: "check_circle", title: t("auth.instantAccess"), desc: t("auth.instantAccessDesc") },
              { icon: "security", title: t("auth.secureByDefault"), desc: t("auth.secureByDefaultDesc") },
              { icon: "rocket_launch", title: t("auth.multiTenantReady"), desc: t("auth.multiTenantReadyDesc") },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-primary text-lg">{item.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-on-surface">{item.title}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-on-surface-variant">
          &copy; {new Date().getFullYear()} {t("app.copyright")}
        </p>
      </div>
    </div>
  );
}
