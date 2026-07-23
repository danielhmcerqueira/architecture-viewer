// Cenários do mock de SSE. Fixture de teste — o mock NUNCA decide nada
// com base nos dados; apenas segue o roteiro escolhido aqui.

export type SseScenario = "fast" | "slow" | "failed" | "error";

// Cenário ativo em ambiente de desenvolvimento. Troque à mão para exercitar
// as variantes na página /dev/sse.
export const ACTIVE_SSE_SCENARIO: SseScenario = "fast";
