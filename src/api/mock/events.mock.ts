// Implementação MOCK do canal de progresso. Mesma assinatura da real, para
// alternar sem tocar em componentes. Segue um roteiro fixo por timers —
// nunca inspeciona os dados.

import { ACTIVE_SSE_SCENARIO, type SseScenario } from "@/mocks/scenarios";
import type { ProgressEvent, SseEventName } from "@/types/architecture";
import type {
  SubscribeHandlers,
  Unsubscribe,
} from "@/api/events.real";

interface Step {
  name: SseEventName;
  delayMs: number;
  message?: string;
}

const BASE_SEQUENCE: SseEventName[] = [
  "INPUT_RECEIVED",
  "STRUCTURING_STARTED",
  "MCP_VERIFICATION_STARTED",
  "STRUCTURING_COMPLETED",
  "READY_FOR_REVIEW",
];

function buildScenario(scenario: SseScenario): {
  steps: Step[];
  crash?: number; // ms até "queda de conexão"
} {
  switch (scenario) {
    case "fast": {
      return {
        steps: BASE_SEQUENCE.map((name) => ({ name, delayMs: 900 })),
      };
    }
    case "slow": {
      // Mesmo roteiro, mas com paradas longas em STRUCTURING_STARTED e
      // MCP_VERIFICATION_STARTED — serve para verificar que a UI transmite
      // "está processando" e não "travou".
      return {
        steps: [
          { name: "INPUT_RECEIVED", delayMs: 900 },
          { name: "STRUCTURING_STARTED", delayMs: 8000 },
          { name: "MCP_VERIFICATION_STARTED", delayMs: 6000 },
          { name: "STRUCTURING_COMPLETED", delayMs: 900 },
          { name: "READY_FOR_REVIEW", delayMs: 900 },
        ],
      };
    }
    case "failed": {
      return {
        steps: [
          { name: "INPUT_RECEIVED", delayMs: 900 },
          { name: "STRUCTURING_STARTED", delayMs: 900 },
          { name: "MCP_VERIFICATION_STARTED", delayMs: 900 },
          { name: "FAILED", delayMs: 1500, message: "Cenário mock: falha em MCP." },
        ],
      };
    }
    case "error": {
      // "Queda de conexão" simulada — emite alguns eventos e depois
      // interrompe o canal sinalizando erro.
      return {
        steps: [
          { name: "INPUT_RECEIVED", delayMs: 900 },
          { name: "STRUCTURING_STARTED", delayMs: 900 },
        ],
        crash: 900 + 900 + 1200,
      };
    }
  }
}

export function mockSubscribeProgress(
  _projectId: string,
  handlers: SubscribeHandlers,
): Unsubscribe {
  const { steps, crash } = buildScenario(ACTIVE_SSE_SCENARIO);
  const timers: ReturnType<typeof setTimeout>[] = [];
  let cancelled = false;

  handlers.onStatus?.("connecting");
  timers.push(
    setTimeout(() => {
      if (!cancelled) handlers.onStatus?.("open");
    }, 200),
  );

  let acc = 300;
  for (const step of steps) {
    acc += step.delayMs;
    const at = acc;
    timers.push(
      setTimeout(() => {
        if (cancelled) return;
        const event: ProgressEvent = {
          name: step.name,
          message: step.message,
          at: new Date().toISOString(),
        };
        handlers.onEvent(event);
      }, at),
    );
  }

  if (crash !== undefined) {
    timers.push(
      setTimeout(() => {
        if (cancelled) return;
        handlers.onStatus?.("error");
      }, crash),
    );
  }

  return () => {
    cancelled = true;
    for (const t of timers) clearTimeout(t);
    handlers.onStatus?.("closed");
  };
}
