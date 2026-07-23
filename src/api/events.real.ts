import { API_BASE_URL } from "@/config";
import type { ProgressEvent, SseEventName } from "@/types/architecture";

export function realSubscribeProgress(
  projectId: string,
  onEvent: (evt: ProgressEvent) => void,
): () => void {
  const es = new EventSource(`${API_BASE_URL}/api/projects/${projectId}/events`);
  es.onmessage = (msg) => {
    try {
      const data = JSON.parse(msg.data) as { name: SseEventName; message?: string; at?: string };
      onEvent({ name: data.name, message: data.message, at: data.at ?? new Date().toISOString() });
    } catch {
      /* ignora payloads malformados */
    }
  };
  return () => es.close();
}
