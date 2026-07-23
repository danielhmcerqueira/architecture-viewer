import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, Download, ExternalLink, FileWarning, Loader2, RefreshCw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { USE_MOCKS, type DiagramInfo } from "@/api/client";
import { projects } from "@/api/projects";
import { useProgressEvents } from "@/hooks/useProgressEvents";
import { SAMPLE_DIAGRAM_XML } from "@/mocks/sampleDiagram";
import type { ArchitectureSpec } from "@/types/architecture";

export const Route = createFileRoute("/project/$id/diagram")({
  head: () => ({
    meta: [
      { title: "Diagrama — Arquiteto" },
      { name: "description", content: "Geração e download do diagrama draw.io." },
    ],
  }),
  component: DiagramPage,
});

type Phase = "idle" | "generating" | "done" | "failed";

function DiagramPage() {
  const { id } = Route.useParams();
  const [spec, setSpec] = useState<ArchitectureSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [info, setInfo] = useState<DiagramInfo | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    projects
      .getArchitecture(id)
      .then((s) => {
        if (!alive) return;
        setSpec(s);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setLoadError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  // Assina o canal de progresso do diagrama apenas quando a geração está
  // em andamento. RECEBE e REPASSA — nada mais.
  const { events, lastEvent, status } = useProgressEvents(id, {
    channel: "diagram",
    enabled: phase === "generating",
  });

  useEffect(() => {
    if (phase !== "generating") return;
    if (status === "error") {
      setPhase("failed");
      setGenError("A conexão com o servidor de progresso caiu.");
      return;
    }
    const failed = events.find((e) => e.name === "FAILED");
    if (failed) {
      setPhase("failed");
      setGenError(failed.message ?? "O backend informou falha na geração.");
    }
  }, [events, status, phase]);

  const handleGenerate = useCallback(async () => {
    setGenError(null);
    setInfo(null);
    setPhase("generating");
    try {
      const result = await projects.generateDiagram(id);
      setInfo(result);
      setPhase("done");
    } catch (e) {
      setGenError(e instanceof Error ? e.message : String(e));
      setPhase("failed");
    }
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando projeto…
        </div>
      </div>
    );
  }

  if (loadError || !spec) {
    return (
      <div className="mx-auto max-w-3xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar o projeto</AlertTitle>
          <AlertDescription>{loadError ?? "Projeto não encontrado."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Bloqueio de acesso quando a arquitetura ainda não foi aprovada.
  if (spec.project.status !== "APPROVED") {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Diagrama</h1>
        <Alert>
          <FileWarning className="h-4 w-4" />
          <AlertTitle>Arquitetura ainda não aprovada</AlertTitle>
          <AlertDescription>
            O diagrama só pode ser gerado depois que a arquitetura for
            aprovada na tela de revisão.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link to="/project/$id/review" params={{ id }}>
            Voltar para a revisão
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Diagrama</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {spec.project.name} — versão aprovada {spec.project.version}. A
          geração do arquivo é feita pelo backend; esta tela só dispara a
          requisição, acompanha o progresso e entrega o download.
        </p>
      </header>

      {phase === "idle" && (
        <div className="rounded-lg border border-border bg-card p-6">
          <Button onClick={handleGenerate}>Gerar arquivo</Button>
        </div>
      )}

      {phase === "generating" && (
        <GenerationProgress
          statusLabel={status}
          lastName={lastEvent?.name ?? null}
        />
      )}

      {phase === "failed" && (
        <div className="space-y-3">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Falha na geração</AlertTitle>
            <AlertDescription>
              {genError ?? "O backend não concluiu a geração do diagrama."}
            </AlertDescription>
          </Alert>
          <Button onClick={handleGenerate}>Tentar novamente</Button>
        </div>
      )}

      {phase === "done" && info && (
        <ResultCard
          projectId={id}
          info={info}
          onRegenerate={handleGenerate}
        />
      )}
    </div>
  );
}

function GenerationProgress({
  statusLabel,
  lastName,
}: {
  statusLabel: string;
  lastName: string | null;
}) {
  const label = useMemo(() => {
    if (lastName === "DIAGRAM_GENERATION_STARTED") return "O backend começou a montar o diagrama.";
    if (lastName === "COMPLETED") return "O backend finalizou. Preparando download…";
    return "Conectando ao canal de progresso…";
  }, [lastName]);

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{label}</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Canal: <span className="font-mono">{statusLabel}</span>
        {lastName ? (
          <>
            {" · "}
            último evento: <span className="font-mono">{lastName}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}

function ResultCard({
  projectId,
  info,
  onRegenerate,
}: {
  projectId: string;
  info: DiagramInfo;
  onRegenerate: () => void;
}) {
  const handleDownload = useCallback(() => {
    if (USE_MOCKS) {
      // Mock: entrega um arquivo ESTÁTICO como Blob. Não construímos XML
      // a partir dos dados da arquitetura.
      const blob = new Blob([SAMPLE_DIAGRAM_XML], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = info.file_name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      return;
    }
    // Real: o backend responde binário direto no GET; deixamos o navegador
    // baixar via <a download>.
    const a = document.createElement("a");
    a.href = projects.diagramDownloadUrl(projectId);
    a.download = info.file_name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [projectId, info]);

  const generatedAt = new Date(info.generated_at).toLocaleString("pt-BR");

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Arquivo gerado
            </p>
            <p className="font-mono text-sm">{info.file_name}</p>
            <p className="text-xs text-muted-foreground">
              Versão {info.version} · gerado em {generatedAt}
            </p>
          </div>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Baixar .drawio
          </Button>
        </div>

        <Alert className="mt-6">
          <FileWarning className="h-4 w-4" />
          <AlertTitle>Confira o arquivo antes de usar</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              Esta versão não valida o arquivo automaticamente. Abra o
              arquivo no draw.io e confira se os componentes e as relações
              correspondem à arquitetura que você aprovou.
            </p>
            <a
              href="https://app.diagrams.net"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm underline underline-offset-4"
            >
              Abrir draw.io <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </AlertDescription>
        </Alert>
      </div>

      <div className="rounded-lg border border-dashed border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Gerar novamente refaz apenas o desenho. A arquitetura aprovada
            fica preservada — nenhum componente, relação ou evidência é
            alterado.
          </p>
          <Button variant="outline" onClick={onRegenerate}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Gerar novamente
          </Button>
        </div>
      </div>
    </div>
  );
}
