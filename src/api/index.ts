// Único ponto de troca entre mock e API real. Componentes SEMPRE importam
// daqui — nunca de src/api/mock/* nem de src/mocks/*.

import { USE_MOCK } from "@/config";
import { realProjectsApi } from "./projects.real";
import { realSubscribeProgress } from "./events.real";
import { mockProjectsApi } from "./mock/projects.mock";
import { mockSubscribeProgress } from "./mock/events.mock";

export const projectsApi = USE_MOCK ? mockProjectsApi : realProjectsApi;
export const subscribeProgress = USE_MOCK ? mockSubscribeProgress : realSubscribeProgress;

export { setMockScenario } from "./mock/events.mock";
export { ApiError } from "./client";
