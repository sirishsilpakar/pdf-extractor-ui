let BACKEND_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
export let API_BASE = `${BACKEND_URL}/api/v1`;
export let SSE_URL = `${BACKEND_URL}/api/events`;
export let BATCH_SSE_URL = `${BACKEND_URL}/api/events/batch`;

export function setBackendPort(port: number | string) {
  BACKEND_URL = `http://localhost:${port}`;
  API_BASE = `${BACKEND_URL}/api/v1`;
  SSE_URL = `${BACKEND_URL}/api/events`;
  BATCH_SSE_URL = `${BACKEND_URL}/api/events/batch`;
}

export async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, options);
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail || res.statusText);
  }
  return res.json();
}
