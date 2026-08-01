"use client";

import { useEffect, useRef, useState } from "react";

type Formatter = (n: number) => string;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export default function AnimatedNumber({
  value,
  format,
  duration = 800,
}: {
  value: number;
  format: Formatter;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const latestRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const delta = value - from;
    if (Math.abs(delta) < 0.001) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const current = from + delta * easeOutCubic(progress);
      latestRef.current = current;
      setDisplay(current);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      fromRef.current = latestRef.current;
    };
  }, [value, duration]);

  return <>{format(display)}</>;
}
