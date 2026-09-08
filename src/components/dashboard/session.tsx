"use client";

import { useEffect, useState } from "react";

export type SessionUser = { id: string; name: string; email: string; role: string };

export async function api<T = Record<string, unknown>>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { ...(options?.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...options?.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const fields = data.issues?.fieldErrors as Record<string, string[]> | undefined;
    const details = fields ? Object.entries(fields).filter(([, errors]) => errors.length).map(([key, errors]) => `${key}: ${errors.join(' ')}`).join(' · ') : '';
    throw new Error(details || (typeof data.error === "string" ? data.error : data.error?.message || data.message || `Request failed (${response.status}). Please try again.`));
  }
  return data as T;
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; api<{ user: SessionUser | null }>("/api/auth/me")
    .then(data => { if (active) setUser(data.user); })
    .catch(reason => { if (active) setError(reason.message); })
    .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return { user, loading, error };
}

export const money = (amount: number | string = 0) => `Rs. ${Number(amount).toLocaleString("en-NP", { maximumFractionDigits: 0 })}`;
export const dateLabel = (date?: string) => date ? new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
