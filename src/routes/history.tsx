import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Histórico — Arquiteto" },
      { name: "description", content: "Projetos anteriores estruturados." },
    ],
  }),
  component: HistoryPlaceholder,
});

function HistoryPlaceholder() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Histórico</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Esta tela será construída em um bloco posterior.
      </p>
    </div>
  );
}
