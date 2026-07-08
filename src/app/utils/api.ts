export const API_BASE = "http://localhost:3001/api";
export function getApiBase() { return API_BASE; }

export async function fetchJson<T>(url: string, token: string | null, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data as T;
}

export default { API_BASE, fetchJson };
