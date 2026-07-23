import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/project/$id/review")({
  head: () => ({
    meta: [
      { title: "Revisão — Arquiteto" },
      { name: "description", content: "Revisão da arquitetura estruturada." },
    ],
  }),
  component: ReviewPlaceholder,
});

function ReviewPlaceholder() {
  const { id } = Route.useParams();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Revisão</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Projeto <span className="font-mono">{id}</span>. Esta tela será
        construída em um bloco posterior.
      </p>
    </div>
  );
}
