// Ponto único de troca entre mock e real para o canal de progresso.
// Componentes importam APENAS deste arquivo (`@/api/events`).

import { USE_MOCKS } from "@/api/client";
import { realSubscribeProgress } from "@/api/events.real";
import { mockSubscribeProgress } from "@/api/mock/events.mock";
import { ACTIVE_SSE_SCENARIO, type SseScenario } from "@/mocks/scenarios";

export type {
  SubscribeStatus,
  SubscribeHandlers,
  Unsubscribe,
} from "@/api/events.real";

export const subscribeProgress = USE_MOCKS
  ? mockSubscribeProgress
  : realSubscribeProgress;

// Expõe metadados de mock para a página de sandbox (/dev/sse) sem forçar
// telas a importar de `@/mocks/*`. Em modo real, retorna null.
export function getActiveMockScenario(): SseScenario | null {
  return USE_MOCKS ? ACTIVE_SSE_SCENARIO : null;
}

