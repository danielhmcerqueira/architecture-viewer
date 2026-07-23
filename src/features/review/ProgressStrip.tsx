import { useProgressEvents } from "@/hooks/useProgressEvents";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LABELS: Record<string, string> = {
  INPUT_RECEIVED: "Texto recebido",
  STRUCTURING_STARTED: "Estruturando arquitetura",
  MCP_VERIFICATION_STARTED: "Verificando tecnologias",
  STRUCTURING_COMPLETED: "Estrutura concluída",
  READY_FOR_REVIEW: "Aguardando revisão",
  REVISION_APPLIED: "Revisão aplicada",
  APPROVED: "Aprovado",
  DIAGRAM_GENERATION_STARTED: "Gerando diagrama",
  COMPLETED: "Concluído",
  FAILED: "Falhou",
};

export function ProgressStrip({ projectId }: { projectId: string }) {
  const { events, lastEvent } = useProgressEvents(projectId);

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3 py-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Progresso
        </span>
        {lastEvent ? (
          <Badge variant={lastEvent.name === "FAILED" ? "destructive" : "secondary"}>
            {LABELS[lastEvent.name] ?? lastEvent.name}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">Sem eventos.</span>
        )}
        {lastEvent?.message && (
          <span className="text-xs text-muted-foreground">{lastEvent.message}</span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {events.length} evento{events.length === 1 ? "" : "s"}
        </span>
      </CardContent>
    </Card>
  );
}
