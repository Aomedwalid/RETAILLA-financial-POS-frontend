"use client";

import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://llina-store.onrender.com";
const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000;

let _timer: ReturnType<typeof setTimeout> | null = null;
let _lastActivityTime: number = Date.now();
let _isActive: boolean = false;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isVisible(): boolean {
  return isBrowser() && document.visibilityState === "visible";
}

function isOnline(): boolean {
  return isBrowser() && navigator.onLine === true;
}

function shouldRun(): boolean {
  return isVisible() && isOnline();
}

function clearTimer(): void {
  if (_timer !== null) {
    clearTimeout(_timer);
    _timer = null;
  }
}

function sendKeepAlive(): void {
  if (!shouldRun()) return;

  const timeSinceLastActivity = Date.now() - _lastActivityTime;
  if (timeSinceLastActivity < INACTIVITY_TIMEOUT_MS) {
    scheduleTimer();
    return;
  }

  axios
    .get(BASE_URL, { timeout: 10000 })
    .then(() => {
      _lastActivityTime = Date.now();
      scheduleTimer();
    })
    .catch(() => {
      scheduleTimer();
    });
}

function scheduleTimer(): void {
  clearTimer();
  if (!shouldRun()) return;

  const timeSinceLastActivity = Date.now() - _lastActivityTime;
  const remaining = Math.max(INACTIVITY_TIMEOUT_MS - timeSinceLastActivity, 1000);

  _timer = setTimeout(sendKeepAlive, remaining);
}

function handleVisibilityChange(): void {
  if (isVisible()) {
    _lastActivityTime = Date.now();
    scheduleTimer();
  } else {
    clearTimer();
  }
}

function handleOnline(): void {
  if (isVisible()) {
    _lastActivityTime = Date.now();
    scheduleTimer();
  }
}

function handleOffline(): void {
  clearTimer();
}

export function recordActivity(): void {
  _lastActivityTime = Date.now();
}

export function startKeepAlive(): void {
  if (!isBrowser() || _isActive) return;

  _isActive = true;
  _lastActivityTime = Date.now();

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  scheduleTimer();
}

export function stopKeepAlive(): void {
  if (!isBrowser() || !_isActive) return;

  _isActive = false;
  clearTimer();

  document.removeEventListener("visibilitychange", handleVisibilityChange);
  window.removeEventListener("online", handleOnline);
  window.removeEventListener("offline", handleOffline);
}
