// Implementação REAL do canal de progresso. Usa EventSource nativo, que
// já cuida de reconexão automática. Não implementamos Last-Event-ID nem
// retry manual — se o backend precisar disso, cabe a ele.

import { API_BASE_URL } from "@/config";
import type { ProgressEvent, SseEventName } from "@/types/architecture";

export type SubscribeStatus = "connecting" | "open" | "error" | "closed";

export interface SubscribeHandlers {
  onEvent: (event: ProgressEvent) => void;
  onStatus?: (status: SubscribeStatus) => void;
}

export type Unsubscribe = () => void;

const KNOWN_EVENTS: readonly SseEventName[] = [
  "INPUT_RECEIVED",
  "STRUCTURING_STARTED",
  "MCP_VERIFICATION_STARTED",
  "STRUCTURING_COMPLETED",
  "READY_FOR_REVIEW",
  "REVISION_APPLIED",
  "APPROVED",
  "DIAGRAM_GENERATION_STARTED",
  "COMPLETED",
  "FAILED",
];

function parsePayload(raw: string, name: SseEventName): ProgressEvent {
  try {
    const parsed = JSON.parse(raw) as Partial<ProgressEvent>;
    return {
      name,
      message: parsed.message,
      at: parsed.at ?? new Date().toISOString(),
    };
  } catch {
    return { name, at: new Date().toISOString() };
  }
}

export function realSubscribeProgress(
  projectId: string,
  handlers: SubscribeHandlers,
  _opts?: { channel?: "structuring" | "diagram" },
): Unsubscribe {
  // O backend emite todos os eventos por um único stream; o parâmetro de
  // canal existe apenas para paridade com o mock e é ignorado aqui.
  void _opts;
  const url = `${API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}/events`;
  const source = new EventSource(url);

  handlers.onStatus?.("connecting");
  source.onopen = () => handlers.onStatus?.("open");
  source.onerror = () => handlers.onStatus?.("error");

  const attach = (name: SseEventName) => {
    source.addEventListener(name, (ev) => {
      const raw = (ev as MessageEvent).data ?? "";
      handlers.onEvent(parsePayload(String(raw), name));
    });
  };
  for (const name of KNOWN_EVENTS) attach(name);

  return () => {
    source.close();
    handlers.onStatus?.("closed");
  };
}
