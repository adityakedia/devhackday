import type { CatalogItem, JourneyAction, JourneyResponse, Mode, Narrative } from "../worker/journey/types";

// Headless API contract: the frontend owns rendering, action ordering and AI debounce.
async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, body === undefined ? undefined : {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new JourneyApiError(response.status, result.error ?? "Journey request failed.");
  return result as T;
}

export class JourneyApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "JourneyApiError";
  }
}

function path(id: string, operation?: string) {
  return `/api/journeys/${encodeURIComponent(id)}${operation ? `/${operation}` : ""}`;
}

export const journeyApi = {
  catalog: () => request<{ items: CatalogItem[] }>("/api/catalog"),
  create: (mode: Mode) => request<JourneyResponse>("/api/journeys", { mode }),
  get: (id: string) => request<JourneyResponse>(path(id)),
  action: (id: string, revision: number, action: JourneyAction) =>
    request<JourneyResponse>(path(id, "actions"), { revision, action }),
  interpret: (id: string, revision: number, engine: "metadata" | "ai") =>
    request<JourneyResponse>(path(id, "interpret"), { revision, engine }),
  surprise: (id: string, revision: number) =>
    request<{ revision: number; item: CatalogItem | null; explanation: string; prompt: string }>(path(id, "surprise"), { revision }),
  narrative: (id: string, revision: number, engine: "metadata" | "ai") =>
    request<Narrative>(path(id, "narrative"), { revision, engine }),
  save: (id: string, revision: number, name: string, narrative: string) =>
    request<JourneyResponse>(path(id, "save"), { revision, name, narrative }),
  restore: (id: string, revision: number, savedStateId: string) =>
    request<JourneyResponse>(path(id, "restore"), { revision, savedStateId }),
};
