// Sandbox de desenvolvimento para o hook `useProgressEvents`. Serve para
// conferir a ordem dos eventos e o cleanup ao desmontar. Em build de
// produção a rota apenas informa que está desabilitada.

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { useProgressEvents } from "@/hooks/useProgressEvents";
import { getActiveMockScenario() } from "@/api/events";

export const Route = createFileRoute("/dev/sse")({
  head: () => ({
    meta: [
      { title: "Dev · SSE" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DevSsePage,
});

function DevSsePage() {
  if (!import.meta.env.DEV) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Dev · SSE</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sandbox disponível apenas em desenvolvimento.
        </p>
      </div>
    );
  }
  return <DevSseSandbox />;
}

function DevSseSandbox() {
  const [mounted, setMounted] = useState(true);
  const [runId, setRunId] = useState(0);
  const projectId = mounted ? `dev-${runId}` : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dev · SSE</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cenário ativo:{" "}
          <span className="font-mono">{getActiveMockScenario()}</span> — altere em{" "}
          <span className="font-mono">src/mocks/scenarios.ts</span>.
        </p>
      </header>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setMounted(true);
            setRunId((n) => n + 1);
          }}
        >
          Reiniciar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setMounted((v) => !v)}
        >
          {mounted ? "Desmontar hook" : "Remontar hook"}
        </Button>
      </div>

      {mounted ? (
        <SseInspector key={runId} projectId={projectId!} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Hook desmontado. Timers e conexão devem ter sido limpos.
        </p>
      )}
    </div>
  );
}

function SseInspector({ projectId }: { projectId: string }) {
  const { events, lastEvent, status } = useProgressEvents(projectId);
  return (
    <div className="space-y-3 rounded-md border border-border bg-card p-4">
      <div className="flex items-center justify-between text-sm">
        <span>
          Projeto: <span className="font-mono">{projectId}</span>
        </span>
        <span>
          Status: <span className="font-mono">{status}</span>
        </span>
      </div>
      <div className="text-xs text-muted-foreground">
        Último evento:{" "}
        <span className="font-mono">{lastEvent?.name ?? "—"}</span>
      </div>
      <ol className="space-y-1 font-mono text-xs">
        {events.length === 0 ? (
          <li className="text-muted-foreground">Aguardando eventos…</li>
        ) : (
          events.map((e, i) => (
            <li key={i}>
              {String(i + 1).padStart(2, "0")}. {e.name}
              {e.message ? ` — ${e.message}` : ""}{" "}
              <span className="text-muted-foreground">({e.at})</span>
            </li>
          ))
        )}
      </ol>
    </div>
  );
}
