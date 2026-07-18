import type { ApiResponse } from "../types/models";

export const API_BASE_URL = "http://localhost:5000";

let tokenGetter: (() => Promise<string>) | null = null;

export function setTokenGetter(getter: () => Promise<string>) {
  tokenGetter = getter;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function getTokenWithTimeout(timeoutMs = 8000): Promise<string> {
  if (!tokenGetter) throw new ApiError(401, "Not authenticated.");
  return Promise.race([
    tokenGetter(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new ApiError(408, "Authentication timed out. Please refresh and log in again.")), timeoutMs)
    ),
  ]);
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  
  // Set Content-Type only if it is not FormData (which requires dynamic browser boundary configuration)
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (tokenGetter) {
    const token = await getTokenWithTimeout();
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (res.status === 401) throw new ApiError(401, "Unauthorized. Please log in again.");
  if (res.status === 404) throw new ApiError(404, "Not found.");
  
  let body: ApiResponse<T>;
  try { 
    body = (await res.json()) as ApiResponse<T>; 
  }
  catch { 
    throw new ApiError(res.status, `Unexpected response (status ${res.status}).`); 
  }
  
  if (!res.ok || !body.success) { 
    throw new ApiError(res.status, body.error || `Request failed (status ${res.status}).`); 
  }
  return body.data as T;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "POST", body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined) }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PATCH", body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined) }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PUT", body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined) }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};
