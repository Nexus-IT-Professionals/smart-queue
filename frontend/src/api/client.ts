// Minimal fetch wrapper for the FastAPI backend under /api.
// credentials: 'include' sends the server-side session cookie; authorization
// is always decided by the API, never by client state.

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!res.ok) {
    throw new ApiError(res.status, `${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export type Health = { status: string };

export function getHealth(signal?: AbortSignal): Promise<Health> {
  return api<Health>("/health", { signal });
}
