// src/utils/adminAuth.ts

const STORAGE_KEY = "rau_admin_key";

export function setAdminKey(key: string) {
  localStorage.setItem(STORAGE_KEY, key);
}

export function getAdminKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function clearAdminKey() {
  localStorage.removeItem(STORAGE_KEY);
}
