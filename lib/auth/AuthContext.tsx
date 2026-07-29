"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { authApi, setAccessToken, setUnauthorizedHandler, type AuthUser } from "@/lib/api";

const STORAGE_USER_KEY = "currentUser";

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function saveUserToStorage(user: AuthUser) {
  try {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
  } catch {
    // storage unavailable
  }
}

function removeUserFromStorage() {
  try {
    localStorage.removeItem(STORAGE_USER_KEY);
  } catch {
    // storage unavailable
  }
}

function getUserFromStorage(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAccessToken(null);
      setAccessTokenState(null);
      setUser(null);
      removeUserFromStorage();
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function tryRefresh() {
      try {
        const result = await authApi.refresh();
        if (!cancelled && result) {
          setAccessToken(result.access_token);
          setAccessTokenState(result.access_token);
          if (result.user) {
            setUser(result.user);
            saveUserToStorage(result.user);
          }
        }
      } catch {
        if (!cancelled) {
          setAccessToken(null);
          setAccessTokenState(null);
          setUser(null);
          removeUserFromStorage();
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    const stored = getUserFromStorage();
    if (stored) {
      setUser(stored);
    }
    tryRefresh();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login({ email, password });
    setAccessToken(result.access_token);
    setAccessTokenState(result.access_token);
    setUser(result.user);
    saveUserToStorage(result.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    setAccessToken(null);
    setAccessTokenState(null);
    setUser(null);
    removeUserFromStorage();
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
