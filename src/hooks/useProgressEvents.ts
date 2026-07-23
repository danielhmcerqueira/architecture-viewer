// Hook fino em cima de `subscribeProgress`. RECEBE e REPASSA — nada de
// interpretar payload, tomar decisão ou disparar outra chamada.

import { useEffect, useRef, useState } from "react";

import { subscribeProgress, type SubscribeStatus } from "@/api/events";
import type { ProgressEvent } from "@/types/architecture";

export interface UseProgressEventsResult {
  events: ProgressEvent[];
  lastEvent: ProgressEvent | null;
  status: SubscribeStatus;
}

export function useProgressEvents(
  projectId: string | undefined,
): UseProgressEventsResult {
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [status, setStatus] = useState<SubscribeStatus>("connecting");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!projectId) return;
    setEvents([]);
    setStatus("connecting");

    const unsubscribe = subscribeProgress(projectId, {
      onEvent: (ev) => {
        if (!mounted.current) return;
        setEvents((prev) => [...prev, ev]);
      },
      onStatus: (s) => {
        if (!mounted.current) return;
        setStatus(s);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [projectId]);

  return {
    events,
    lastEvent: events.length > 0 ? events[events.length - 1] : null,
    status,
  };
}
