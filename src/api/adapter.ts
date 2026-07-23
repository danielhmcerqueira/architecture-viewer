// =============================================================================
// Camada de adaptação de dados — ponto ÚNICO de troca entre mock e backend real.
// =============================================================================
//
// Para DESLIGAR os mocks e passar a usar a API real do backend Python (ADK):
//
//   1. Defina as variáveis de ambiente ANTES de rodar `bun run build`
//      (VITE_* é resolvido em BUILD TIME, não em runtime):
//
//          VITE_USE_MOCK=0
//          VITE_API_BASE_URL=https://api.seu-dominio.tld
//
//   2. Suba o backend expondo os endpoints listados no README.md
//      (POST /projects, GET /projects, GET /projects/:id/architecture,
//      PATCH /projects/:id/architecture, POST /projects/:id/approve,
//      POST /projects/:id/diagram, GET /projects/:id/diagram/download,
//      GET /projects/:id/events — SSE).
//
//   3. Rode o build; nenhum código de tela precisa ser alterado.
//
// Como funciona por dentro:
//   - `USE_MOCKS` (em src/api/client.ts) é `import.meta.env.VITE_USE_MOCK !== "0"`.
//   - Enquanto USE_MOCKS = true, cada função devolve o mock estático com um
//     atraso simulado. Quando false, cada função faz `fetch` contra
//     `${API_BASE_URL}${path}` usando `apiFetch`.
//   - O canal SSE segue o mesmo padrão em `src/api/events.ts`.
//
// COMPONENTES / ROTAS devem importar APENAS deste arquivo (ou de
// `@/api/projects` e `@/api/events`, que também fazem parte da fachada).
// Nunca importe de `@/mocks/*` ou `@/api/mock/*` fora desta camada.
// =============================================================================

export { projects } from "@/api/projects";
export { subscribeProgress } from "@/api/events";
export type {
  SubscribeStatus,
  SubscribeHandlers,
  Unsubscribe,
} from "@/api/events";
export type {
  CreateProjectInput,
  CreateProjectResponse,
  DiagramInfo,
} from "@/api/client";
