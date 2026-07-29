"use client";

import { useEffect, type RefObject } from "react";

export default function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  isActive: boolean,
  onClose: () => void
) {
  useEffect(() => {
    if (!isActive) return;

    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isActive, onClose, ref]);
}
