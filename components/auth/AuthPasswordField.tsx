"use client";

import { InputHTMLAttributes, useState } from "react";

interface AuthPasswordFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function AuthPasswordField({ label, error, className = "", id, ...props }: AuthPasswordFieldProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-on-surface-variant">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={show ? "text" : "password"}
          className={`w-full h-11 px-3.5 pr-11 rounded-lg border bg-surface-container-high text-on-surface placeholder:text-on-surface-variant/40 outline-none transition-colors duration-200
            ${error ? "border-error" : "border-outline/30 focus:border-primary"}
            ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
          tabIndex={-1}
        >
          <span className="material-symbols-outlined text-lg">
            {show ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
      {error && <p className="text-xs text-error mt-0.5">{error}</p>}
    </div>
  );
}
