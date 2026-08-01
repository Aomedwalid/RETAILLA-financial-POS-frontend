"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = "success", duration = 4000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed top-20 right-6 z-[200] animate-slide-in-right">
      <div
        className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-sm ${
          type === "success"
            ? "bg-secondary/10 border-secondary/20 text-secondary"
            : "bg-error/10 border-error/20 text-error"
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">
          {type === "success" ? "check_circle" : "error"}
        </span>
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>
  );
}
