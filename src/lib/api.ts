const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
export const API_BASE = `${BACKEND_URL}/api/v1`;
export const SSE_URL = `${BACKEND_URL}/api/events`;
export const BATCH_SSE_URL = `${BACKEND_URL}/api/events/batch`;

export async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, options);
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail || res.statusText);
  }
  return res.json();
}
