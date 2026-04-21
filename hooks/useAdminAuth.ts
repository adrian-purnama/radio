"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api-client";

type AuthState = {
  loading: boolean;
  authenticated: boolean;
  admin: { id: string; email: string } | null;
};

export function useAdminAuth() {
  const [state, setState] = useState<AuthState>({
    loading: true,
    authenticated: false,
    admin: null,
  });

  async function refreshAuth() {
    try {
      const data = await apiFetch<{
        authenticated: boolean;
        admin: { id: string; email: string };
      }>("/api/auth/me");
      setState({ loading: false, authenticated: data.authenticated, admin: data.admin });
    } catch {
      setState({ loading: false, authenticated: false, admin: null });
    }
  }

  useEffect(() => {
    let active = true;

    apiFetch<{
      authenticated: boolean;
      admin: { id: string; email: string };
    }>("/api/auth/me")
      .then((data) => {
        if (!active) {
          return;
        }
        setState({ loading: false, authenticated: data.authenticated, admin: data.admin });
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setState({ loading: false, authenticated: false, admin: null });
      });

    return () => {
      active = false;
    };
  }, []);

  async function login(email: string, password: string) {
    await apiFetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    await refreshAuth();
  }

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setState({ loading: false, authenticated: false, admin: null });
  }

  return {
    ...state,
    login,
    logout,
    refreshAuth,
  };
}
