"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { apiFetch, ApiError } from "./api";
import { setTokens, getTokens } from "./tokens";

type User = { id: number; username: string; firstName: string; lastName: string };

type AuthValue = {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  async function login(username: string, password: string) {
    const res = await fetch("https://dummyjson.com/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, expiresInMins: 1 }),
    });

    if (!res.ok) throw new ApiError(res.status, "Wrong username or password");

    const data = await res.json();
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    setUser({
      id: data.id,
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
    });
  }

  function logout() {
    setTokens(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
