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

/** Best-effort local-only relay; the public-demo build never invokes it. */
export function publishLocalDemoEvent(input: {
  kind: "cancelled" | "updated";
  appointmentDate: string;
  appointmentTime: string;
  eventId: string;
  correlationId: string;
}): Promise<void> {
  return api<void>("/local-demo/events", {
    method: "POST",
    credentials: "omit",
    body: JSON.stringify({
      kind: input.kind,
      appointment_date: input.appointmentDate,
      appointment_time: input.appointmentTime,
      event_id: input.eventId,
      correlation_id: input.correlationId,
    }),
  });
}
