import { API_BASE_URL } from "@/config";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      /* noop */
    }
    throw new ApiError(`Requisição falhou (${res.status})`, res.status, body);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function apiFetchBlob(path: string, init: RequestInit = {}): Promise<Blob> {
  const res = await fetch(`${API_BASE_URL}${path}`, init);
  if (!res.ok) throw new ApiError(`Requisição falhou (${res.status})`, res.status);
  return await res.blob();
}
