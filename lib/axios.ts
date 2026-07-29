"use client";

import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let _accessToken: string | null = null;
let _refreshPromise: Promise<string | null> | null = null;
let _unauthorizedHandler: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

export function setUnauthorizedHandler(handler: () => void) {
  _unauthorizedHandler = handler;
}

const http = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

async function attemptRefresh(): Promise<string | null> {
  if (!_refreshPromise) {
    _refreshPromise = (async () => {
      try {
        const res = await axios.post(`${BASE_URL}/api/auth/refresh`, {}, {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        });
        const newToken: string | undefined = res.data?.data?.access_token;
        if (newToken) {
          _accessToken = newToken;
          return newToken;
        }
        _accessToken = null;
        return null;
      } catch {
        _accessToken = null;
        return null;
      } finally {
        _refreshPromise = null;
      }
    })();
  }
  return _refreshPromise;
}

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && _accessToken && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await attemptRefresh();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return http(originalRequest);
      }
      _unauthorizedHandler?.();
    }
    return Promise.reject(error);
  }
);

export default http;
