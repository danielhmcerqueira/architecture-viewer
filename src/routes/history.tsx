import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FilePlus2,
  Loader2,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { projects } from "@/api/projects";
import type { ProjectStatus, ProjectSummary } from "@/types/architecture";
import {
  PageHero,
  PaperCard,
  SectionLabel,
  StatusStrip,
  iebtOutlineButtonClass,
  iebtOutlineButtonStyle,
  iebtPrimaryButtonClass,
  iebtPrimaryButtonStyle,
} from "@/components/iebt";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Histórico — Arquiteto · iebt" },
      { name: "description", content: "Projetos anteriores estruturados." },
    ],
  }),
  component: HistoryPage,
});

const STATUS_LABEL: Record<ProjectStatus, string> = {
  DRAFT: "Rascunho",
  READY_FOR_REVIEW: "Aguardando revisão",
  APPROVED: "Aprovado",
};

function HistoryPage() {
  const [rows, setRows] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    projects
      .list()
      .then((list) => {
        if (alive) setRows(list);
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      alive = false;
    };
  }, []);

  const filteredSorted = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    const filtered = q
      ? rows.filter((r) => r.name.toLowerCase().includes(q))
      : rows;
    return [...filtered].sort((a, b) => {
      const ta = a.last_diagram_generated_at
        ? Date.parse(a.last_diagram_generated_at)
        : -Infinity;
      const tb = b.last_diagram_generated_at
        ? Date.parse(b.last_diagram_generated_at)
        : -Infinity;
      return tb - ta;
    });
  }, [rows, query]);

  return (
    <div>
      <PageHero
        index="/04"
        title={
          <>
            Um histórico de{" "}
            <span className="inline-flex items-baseline gap-2">
              cada pixel
              <span
                aria-hidden
                className="inline-block h-5 w-5 translate-y-0.5 sm:h-6 sm:w-6"
                style={{ background: "var(--iebt-ink)" }}
              />
            </span>{" "}
            estruturado.
          </>
        }
        description="Todos os projetos que passaram pelo Arquiteto"
        actions={
          <Button
            asChild
            className="h-11 gap-2 rounded-none px-5 font-mono text-[11px] uppercase tracking-[0.24em] shadow-none transition-colors hover:bg-[var(--iebt-ink)] hover:text-[var(--iebt-paper)]"
            style={{
              background: "var(--iebt-paper)",
              color: "var(--iebt-ink)",
              border: "2px solid var(--iebt-ink)",
            }}
          >
            <Link to="/">
              <FilePlus2 className="h-4 w-4" /> Novo projeto
            </Link>
          </Button>
        }
      />

      <StatusStrip
        left={<>projetos · histórico</>}
        right={rows ? `${rows.length.toString().padStart(3, "0")} registros` : "carregando"}
      />

      <section
        className="px-6 pb-24 pt-10"
        style={{ background: "var(--iebt-paper)", color: "var(--iebt-ink)" }}
      >
        <div className="mx-auto max-w-5xl space-y-6">
          {error ? (
            <Alert
              variant="destructive"
              className="rounded-none border-2"
              style={{ borderColor: "var(--iebt-ink)" }}
            >
              <AlertTitle>Não foi possível carregar o histórico</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : !rows ? (
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.24em] opacity-70">
              <Loader2 className="h-4 w-4 animate-spin" /> carregando projetos…
            </div>
          ) : rows.length === 0 ? (
            <PaperCard className="p-10 text-center">
              <h2 className="font-mono text-xl">Nenhum projeto ainda</h2>
              <p className="mt-2 text-sm opacity-70">
                Quando você estruturar um projeto, ele aparece aqui.
              </p>
              <Button
                asChild
                className={`${iebtPrimaryButtonClass} mt-6`}
                style={iebtPrimaryButtonStyle}
              >
                <Link to="/">
                  <FilePlus2 className="h-4 w-4" /> Criar primeiro projeto
                </Link>
              </Button>
            </PaperCard>
          ) : (
            <>
              <SectionLabel title="Busca" />
              <div
                className="relative border-2"
                style={{
                  borderColor: "var(--iebt-ink)",
                  background: "#fff",
                }}
              >
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 opacity-60" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nome"
                  className="h-11 rounded-none border-0 bg-transparent pl-10 font-mono text-sm shadow-none focus-visible:ring-0"
                />
              </div>

              <SectionLabel title="Projetos" />
              <TooltipProvider delayDuration={200}>
                <PaperCard>
                  <Table>
                    <TableHeader>
                      <TableRow
                        className="border-b-2 hover:bg-transparent"
                        style={{ borderColor: "var(--iebt-ink)" }}
                      >
                        <TableHead className="font-mono text-[11px] uppercase tracking-[0.2em]">
                          Nome
                        </TableHead>
                        <TableHead className="font-mono text-[11px] uppercase tracking-[0.2em]">
                          ID
                        </TableHead>
                        <TableHead className="font-mono text-[11px] uppercase tracking-[0.2em]">
                          Versão
                        </TableHead>
                        <TableHead className="font-mono text-[11px] uppercase tracking-[0.2em]">
                          Última geração
                        </TableHead>
                        <TableHead className="font-mono text-[11px] uppercase tracking-[0.2em]">
                          Status
                        </TableHead>
                        <TableHead className="text-right font-mono text-[11px] uppercase tracking-[0.2em]">
                          Ações
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSorted.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="py-8 text-center font-mono text-xs uppercase tracking-[0.2em] opacity-60"
                          >
                            Nenhum projeto corresponde à busca.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSorted.map((row) => (
                          <ProjectRow key={row.id} row={row} />
                        ))
                      )}
                    </TableBody>
                  </Table>
                </PaperCard>
              </TooltipProvider>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function ProjectRow({ row }: { row: ProjectSummary }) {
  const navigate = useNavigate();
  const hasDiagram =
    row.last_diagram_version !== undefined &&
    row.last_diagram_generated_at !== undefined;

  const generatedLabel = hasDiagram
    ? new Date(row.last_diagram_generated_at as string).toLocaleString("pt-BR")
    : "—";

  const versionLabel = hasDiagram ? `v${row.last_diagram_version}` : "—";

  const handleDownload = useCallback(() => {
    if (!hasDiagram) return;
    const fileName =
      row.last_diagram_file_name ?? `${row.id}-arquitetura.drawio`;
    void projects.downloadDiagram(row.id, fileName);
  }, [row.id, row.last_diagram_file_name, hasDiagram]);

  const handleNewVersion = useCallback(() => {
    navigate({ to: "/project/$id/review", params: { id: row.id } });
  }, [navigate, row.id]);

  return (
    <TableRow
      className="border-b hover:bg-black/[0.03]"
      style={{ borderColor: "rgba(20,20,20,0.15)" }}
    >
      <TableCell className="font-medium">{row.name}</TableCell>
      <TableCell>
        <IdCell id={row.id} />
      </TableCell>
      <TableCell className="font-mono text-sm">{versionLabel}</TableCell>
      <TableCell className="text-sm opacity-70">{generatedLabel}</TableCell>
      <TableCell>
        <StatusPill status={row.status} />
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="h-8 rounded-none border font-mono text-[11px] uppercase tracking-[0.18em]"
            style={{ borderColor: "var(--iebt-ink)" }}
          >
            <Link to="/project/$id/review" params={{ id: row.id }}>
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Abrir
            </Link>
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDownload}
                  disabled={!hasDiagram}
                  className="h-8 rounded-none border font-mono text-[11px] uppercase tracking-[0.18em]"
                  style={{ borderColor: "var(--iebt-ink)" }}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" /> .drawio
                </Button>
              </span>
            </TooltipTrigger>
            {!hasDiagram && (
              <TooltipContent>
                Este projeto ainda não gerou diagrama.
              </TooltipContent>
            )}
          </Tooltip>
          <Button
            size="sm"
            onClick={handleNewVersion}
            className="h-8 rounded-none px-3 font-mono text-[11px] uppercase tracking-[0.18em] shadow-none"
            style={{
              background: "var(--iebt-orange)",
              color: "var(--iebt-paper)",
              boxShadow: "3px 3px 0 0 var(--iebt-ink)",
            }}
          >
            <FilePlus2 className="mr-1.5 h-3.5 w-3.5" /> Nova versão
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function IdCell({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const truncated = id.length > 14 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* silencioso */
    }
  }, [id]);

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="font-mono text-xs opacity-70">{truncated}</span>
        </TooltipTrigger>
        <TooltipContent>
          <span className="font-mono text-xs">{id}</span>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={handleCopy}
            aria-label="Copiar ID"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {copied ? "Copiado" : "Copiar ID completo"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function StatusPill({ status }: { status: ProjectStatus }) {
  const styles: Record<ProjectStatus, { bg: string; fg: string }> = {
    DRAFT: { bg: "rgba(20,20,20,0.08)", fg: "var(--iebt-ink)" },
    READY_FOR_REVIEW: {
      bg: "rgba(255,79,28,0.14)",
      fg: "var(--iebt-orange-deep)",
    },
    APPROVED: { bg: "var(--iebt-ink)", fg: "var(--iebt-paper)" },
  };
  const s = styles[status];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.18em]"
      style={{ background: s.bg, color: s.fg }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

// Manter helpers unused-friendly (evita warning caso o linter fique estrito).
void iebtOutlineButtonClass;
void iebtOutlineButtonStyle;
