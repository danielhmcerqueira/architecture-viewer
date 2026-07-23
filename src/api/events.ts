// Ponto único de troca entre mock e real para o canal de progresso.
// Componentes importam APENAS deste arquivo (`@/api/events`).

import { USE_MOCKS } from "@/api/client";
import { realSubscribeProgress } from "@/api/events.real";
import { mockSubscribeProgress } from "@/api/mock/events.mock";

export type {
  SubscribeStatus,
  SubscribeHandlers,
  Unsubscribe,
} from "@/api/events.real";

export const subscribeProgress = USE_MOCKS
  ? mockSubscribeProgress
  : realSubscribeProgress;
