"use client";

import { InputHTMLAttributes } from "react";

interface AuthTextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function AuthTextField({ label, error, className = "", id, ...props }: AuthTextFieldProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-on-surface-variant">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full h-11 px-3.5 rounded-lg border bg-surface-container-high text-on-surface placeholder:text-on-surface-variant/40 outline-none transition-colors duration-200
          ${error ? "border-error" : "border-outline/30 focus:border-primary"}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-error mt-0.5">{error}</p>}
    </div>
  );
}
