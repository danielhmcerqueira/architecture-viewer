import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Download } from "lucide-react";

import { projectsApi, setMockScenario } from "@/api";
import { USE_MOCK } from "@/config";
import type { ArchitectureSpec } from "@/types/architecture";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProgressEvents } from "@/hooks/useProgressEvents";
import { toast } from "sonner";

export const Route = createFileRoute("/project/$id/diagram")({
  head: () => ({
    meta: [
      { title: "Geração de diagrama — Architecture Console" },
      { name: "description", content: "Dispara a geração e faz download do arquivo." },
    ],
  }),
  component: DiagramPage,
});

const LABELS: Record<string, string> = {
  DIAGRAM_GENERATION_STARTED: "Gerando diagrama",
  COMPLETED: "Arquivo pronto",
  FAILED: "Falhou",
};

function DiagramPage() {
  const { id } = Route.useParams();
  const [spec, setSpec] = useState<ArchitectureSpec | null>(null);
  const [started, setStarted] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { lastEvent } = useProgressEvents(id, started);
  const done = lastEvent?.name === "COMPLETED";

  useEffect(() => {
    projectsApi.getArchitecture(id).then(setSpec).catch(console.error);
  }, [id]);

  async function startGeneration() {
    if (!spec) return;
    if (USE_MOCK) setMockScenario(id, "diagram");
    setStarted(true);
    try {
      await projectsApi.generateDiagram(id);
    } catch (err) {
      console.error(err);
      toast.error("Falha ao disparar geração.");
    }
  }

  async function downloadFile() {
    setDownloading(true);
    try {
      const blob = await projectsApi.downloadDiagram(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${spec?.project.name ?? id}.drawio`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error("Falha ao baixar.");
    } finally {
      setDownloading(false);
    }
  }

  if (!spec) return <Skeleton className="h-40 w-full" />;

  const notApproved = spec.project.status !== "APPROVED";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Geração do diagrama</h1>
        <p className="text-xs text-muted-foreground">
          {spec.project.name} · v{spec.project.version}
        </p>
      </div>

      {notApproved && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="flex items-start gap-3 py-4 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-medium">Este projeto ainda não foi aprovado.</p>
              <p>
                Volte para a{" "}
                <Link
                  to="/project/$id/review"
                  params={{ id }}
                  className="underline underline-offset-4"
                >
                  tela de revisão
                </Link>{" "}
                e aprove antes de gerar o arquivo.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Arquivo do diagrama</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={startGeneration} disabled={notApproved || started}>
              {started ? "Geração em curso..." : "Gerar arquivo"}
            </Button>
            <Button variant="secondary" onClick={downloadFile} disabled={!done || downloading}>
              <Download className="mr-1 h-4 w-4" /> {downloading ? "Baixando..." : "Baixar"}
            </Button>
            {lastEvent && (
              <Badge variant={lastEvent.name === "FAILED" ? "destructive" : "secondary"}>
                {LABELS[lastEvent.name] ?? lastEvent.name}
              </Badge>
            )}
          </div>

          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">Confira o arquivo antes de usar.</p>
            <p>
              Esta versão <strong>não valida</strong> o conteúdo gerado. Abra o arquivo no editor
              (draw.io) e confirme se está correto. O humano é o validador.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
