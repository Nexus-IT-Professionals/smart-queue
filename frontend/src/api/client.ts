// Minimal fetch wrapper for the FastAPI backend under /api.
// Reserved API wrapper for future server-backed features. Demo role selection
// never grants backend access. Only the public health check is called today.

export class ApiError extends Error {
  public status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!res.ok) {
    throw new ApiError(res.status, `${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export type Health = { status: string };

export function getHealth(signal?: AbortSignal): Promise<Health> {
  return api<Health>("/health", { signal, credentials: "omit" });
}
