import { useEffect, useState } from "react";
import { subscribeProgress } from "@/api";
import type { ProgressEvent } from "@/types/architecture";

export interface UseProgressEventsState {
  events: ProgressEvent[];
  lastEvent: ProgressEvent | null;
  isTerminal: boolean;
}

export function useProgressEvents(projectId: string | undefined, enabled = true): UseProgressEventsState {
  const [events, setEvents] = useState<ProgressEvent[]>([]);

  useEffect(() => {
    if (!enabled || !projectId) return;
    setEvents([]);
    const unsubscribe = subscribeProgress(projectId, (evt) => {
      setEvents((prev) => [...prev, evt]);
    });
    return unsubscribe;
  }, [projectId, enabled]);

  const lastEvent = events.length ? events[events.length - 1] : null;
  const isTerminal =
    !!lastEvent && (lastEvent.name === "COMPLETED" || lastEvent.name === "FAILED");
  return { events, lastEvent, isTerminal };
}
