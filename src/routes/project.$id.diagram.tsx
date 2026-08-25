import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Download,
  ExternalLink,
  FileWarning,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { type DiagramInfo } from "@/api/client";
import { projects } from "@/api/projects";
import { useProgressEvents } from "@/hooks/useProgressEvents";
import type { ArchitectureSpec } from "@/types/architecture";
import {
  PageHero,
  PaperCard,
  SectionLabel,
  StatusStrip,
  iebtPrimaryButtonClass,
  iebtPrimaryButtonStyle,
  iebtOutlineButtonClass,
  iebtOutlineButtonStyle,
} from "@/components/iebt";

export const Route = createFileRoute("/project/$id/diagram")({
  head: () => ({
    meta: [
      { title: "Diagrama — Arquiteto · iebt" },
      {
        name: "description",
        content: "Geração e download do diagrama draw.io.",
      },
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

  // ----- Loading / erro de carregamento -----
  if (loading) {
    return (
      <div>
        <PageHero
          index="/03"
          title="Diagrama"
          description="Carregando dados do projeto…"
        />
        <PageBody>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.24em] opacity-70">
            <Loader2 className="h-4 w-4 animate-spin" /> carregando…
          </div>
        </PageBody>
      </div>
    );
  }

  if (loadError || !spec) {
    return (
      <div>
        <PageHero index="/03" title="Diagrama" />
        <PageBody>
          <BrutAlert
            tone="error"
            icon={<AlertCircle className="h-4 w-4" />}
            title="Não foi possível carregar o projeto"
            description={loadError ?? "Projeto não encontrado."}
          />
        </PageBody>
      </div>
    );
  }

  // ----- Bloqueio: não aprovado -----
  if (spec.project.status !== "APPROVED") {
    return (
      <div>
        <PageHero
          index="/03"
          title={
            <>
              Aguardando{" "}
              <span className="inline-flex items-baseline gap-2">
                aprovação
                <span
                  aria-hidden
                  className="inline-block h-5 w-5 translate-y-0.5 sm:h-6 sm:w-6"
                  style={{ background: "var(--iebt-ink)" }}
                />
              </span>
            </>
          }
          description="O diagrama só é gerado depois que a arquitetura for aprovada na tela de revisão."
        />
        <StatusStrip left={<>diagrama · bloqueado</>} right="status ≠ approved" />
        <PageBody>
          <BrutAlert
            tone="warning"
            icon={<FileWarning className="h-4 w-4" />}
            title="Arquitetura ainda não aprovada"
            description="Volte para a revisão, resolva as pendências e aprove antes de gerar o diagrama."
          />
          <Button
            asChild
            className={`${iebtOutlineButtonClass} mt-4`}
            style={iebtOutlineButtonStyle}
          >
            <Link to="/project/$id/review" params={{ id }}>
              Voltar para a revisão
            </Link>
          </Button>
        </PageBody>
      </div>
    );
  }

  // ----- Tela principal -----
  return (
    <div>
      <PageHero
        index="/03"
        title={
          <>
            {spec.project.name} —{" "}
            <span className="inline-flex items-baseline gap-2">
              diagrama
              <span
                aria-hidden
                className="inline-block h-5 w-5 translate-y-0.5 sm:h-6 sm:w-6"
                style={{ background: "var(--iebt-ink)" }}
              />
            </span>
          </>
        }
        description={`Versão aprovada ${spec.project.version}. Esta tela dispara a geração no backend, acompanha o progresso e entrega o download.`}
      />
      <StatusStrip
        left={<>diagrama · geração</>}
        right={
          phase === "idle"
            ? "pronto"
            : phase === "generating"
              ? "em andamento"
              : phase === "done"
                ? "concluído"
                : "falhou"
        }
      />

      <PageBody>
        {phase === "idle" && (
          <PaperCard className="p-6">
            <SectionLabel index="01" title="Iniciar geração" />
            <p className="mt-3 max-w-xl text-sm opacity-70">
              A arquitetura aprovada é enviada ao backend, que devolve um
              arquivo <span className="font-mono">.html</span>. Nada é
              validado automaticamente por esta interface.
            </p>
            <div className="mt-5">
              <Button
                onClick={handleGenerate}
                className={iebtPrimaryButtonClass}
                style={iebtPrimaryButtonStyle}
              >
                Gerar arquivo
              </Button>
            </div>
          </PaperCard>
        )}

        {phase === "generating" && (
          <GenerationProgress
            statusLabel={status}
            lastName={lastEvent?.name ?? null}
          />
        )}

        {phase === "failed" && (
          <div className="space-y-4">
            <BrutAlert
              tone="error"
              icon={<AlertCircle className="h-4 w-4" />}
              title="Falha na geração"
              description={
                genError ?? "O backend não concluiu a geração do diagrama."
              }
            />
            <Button
              onClick={handleGenerate}
              className={iebtPrimaryButtonClass}
              style={iebtPrimaryButtonStyle}
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {phase === "done" && info && (
          <ResultCard
            projectId={id}
            info={info}
            onRegenerate={handleGenerate}
          />
        )}
      </PageBody>
    </div>
  );
}

function PageBody({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="px-6 pb-24 pt-10"
      style={{ background: "var(--iebt-paper)", color: "var(--iebt-ink)" }}
    >
      <div className="mx-auto max-w-3xl space-y-6">{children}</div>
    </section>
  );
}

function BrutAlert({
  tone,
  icon,
  title,
  description,
}: {
  tone: "error" | "warning" | "info";
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}) {
  const bg =
    tone === "error"
      ? "rgba(214,59,14,0.08)"
      : tone === "warning"
        ? "rgba(255,79,28,0.10)"
        : "#fff";
  return (
    <div
      className="relative border-2 p-4"
      style={{ borderColor: "var(--iebt-ink)", background: bg }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -left-[6px] -top-[6px] h-3 w-3"
        style={{ background: "var(--iebt-orange)" }}
      />
      <div className="flex items-start gap-3">
        <span className="mt-0.5" style={{ color: "var(--iebt-orange-deep)" }}>
          {icon}
        </span>
        <div>
          <div className="font-mono text-[13px] uppercase tracking-[0.18em]">
            {title}
          </div>
          <div className="mt-1 text-sm opacity-80">{description}</div>
        </div>
      </div>
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
    if (lastName === "DIAGRAM_GENERATION_STARTED")
      return "O backend começou a montar o diagrama.";
    if (lastName === "COMPLETED")
      return "O backend finalizou. Preparando download…";
    return "Conectando ao canal de progresso…";
  }, [lastName]);

  return (
    <PaperCard className="p-6">
      <SectionLabel index="01" title="Progresso" />
      <div className="mt-4 flex items-center gap-2 text-sm">
        <Loader2
          className="h-4 w-4 animate-spin"
          style={{ color: "var(--iebt-orange-deep)" }}
        />
        <span>{label}</span>
      </div>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] opacity-60">
        canal: <span>{statusLabel}</span>
        {lastName ? (
          <>
            {" · "}último evento: <span>{lastName}</span>
          </>
        ) : null}
      </p>
    </PaperCard>
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
    void projects.downloadDiagram(projectId, info.file_name);
  }, [projectId, info.file_name]);

  const generatedAt = new Date(info.generated_at).toLocaleString("pt-BR");

  return (
    <div className="space-y-6">
      <PaperCard className="p-6">
        <SectionLabel
          index="01"
          title="Arquivo gerado"
          meta={
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-60">
              v{info.version}
            </span>
          }
        />
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="font-mono text-sm">{info.file_name}</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-60">
              gerado em {generatedAt}
            </p>
          </div>
          <Button
            onClick={handleDownload}
            className={iebtPrimaryButtonClass}
            style={iebtPrimaryButtonStyle}
          >
            <Download className="h-4 w-4" />
            Baixar .html
          </Button>
        </div>

        <div
          className="mt-6 border-2 p-4"
          style={{
            borderColor: "var(--iebt-ink)",
            background: "rgba(255,79,28,0.08)",
          }}
        >
          <div className="flex items-start gap-3">
            <FileWarning
              className="mt-0.5 h-4 w-4"
              style={{ color: "var(--iebt-orange-deep)" }}
            />
            <div>
              <div className="font-mono text-[13px] uppercase tracking-[0.18em]">
                Confira o arquivo antes de usar
              </div>
              <p className="mt-2 text-sm opacity-80">
                Esta versão não valida o arquivo automaticamente. Abra o
                arquivo no draw.io e confira se os componentes e as relações
                correspondem à arquitetura que você aprovou.
              </p>
              <a
                href="https://app.diagrams.net"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.2em] underline underline-offset-4"
                style={{ color: "var(--iebt-orange-deep)" }}
              >
                Abrir draw.io <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </PaperCard>

      <div
        className="border-2 border-dashed p-5"
        style={{ borderColor: "var(--iebt-ink)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-md text-sm opacity-70">
            Gerar novamente refaz apenas o desenho. A arquitetura aprovada
            fica preservada — nenhum componente, relação ou evidência é
            alterado.
          </p>
          <Button
            variant="outline"
            onClick={onRegenerate}
            className={iebtOutlineButtonClass}
            style={iebtOutlineButtonStyle}
          >
            <RefreshCw className="h-4 w-4" />
            Gerar novamente
          </Button>
        </div>
      </div>
    </div>
  );
}
