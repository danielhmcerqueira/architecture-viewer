import type { ProgressEvent, SseEventName } from "@/types/architecture";

// Sequência fixa em timers. NÃO simula processamento — apenas emite os
// nomes esperados para exercitar a UI de progresso. O caminho lento
// intercala mensagens de verificação para exercitar UI de longa duração.

const FAST: Array<{ name: SseEventName; delay: number; message?: string }> = [
  { name: "INPUT_RECEIVED", delay: 200, message: "Texto recebido." },
  { name: "STRUCTURING_STARTED", delay: 500, message: "Estruturando arquitetura." },
  { name: "MCP_VERIFICATION_STARTED", delay: 900, message: "Verificando tecnologias." },
  { name: "STRUCTURING_COMPLETED", delay: 1400, message: "Estrutura pronta." },
  { name: "READY_FOR_REVIEW", delay: 1600, message: "Aguardando revisão humana." },
];

const DIAGRAM: Array<{ name: SseEventName; delay: number; message?: string }> = [
  { name: "DIAGRAM_GENERATION_STARTED", delay: 300, message: "Montando diagrama." },
  { name: "COMPLETED", delay: 1200, message: "Arquivo pronto para download." },
];

export type MockScenario = "structuring" | "diagram" | "slow";

function scenarioSteps(scenario: MockScenario) {
  if (scenario === "diagram") return DIAGRAM;
  if (scenario === "slow") {
    return FAST.map((s, i) => ({ ...s, delay: s.delay + i * 1200 }));
  }
  return FAST;
}

// Escolhe cenário por projeto — reinicia a cada assinatura.
const projectScenario = new Map<string, MockScenario>();
export function setMockScenario(projectId: string, scenario: MockScenario) {
  projectScenario.set(projectId, scenario);
}

export function mockSubscribeProgress(
  projectId: string,
  onEvent: (evt: ProgressEvent) => void,
): () => void {
  const scenario = projectScenario.get(projectId) ?? "structuring";
  const steps = scenarioSteps(scenario);
  const timers: ReturnType<typeof setTimeout>[] = [];
  let cancelled = false;

  for (const step of steps) {
    const t = setTimeout(() => {
      if (cancelled) return;
      onEvent({ name: step.name, message: step.message, at: new Date().toISOString() });
    }, step.delay);
    timers.push(t);
  }

  return () => {
    cancelled = true;
    for (const t of timers) clearTimeout(t);
  };
}
