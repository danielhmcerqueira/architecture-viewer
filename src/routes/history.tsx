import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Copy, Download, ExternalLink, FilePlus2, Loader2, Search } from "lucide-react";

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

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Histórico — Arquiteto" },
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
    // Ordena pela data da última geração (mais recente primeiro); sem
    // geração vai para o final.
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

  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar o histórico</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!rows) {
    return (
      <div className="mx-auto max-w-5xl flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando projetos…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-dashed border-border p-10 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Nenhum projeto ainda</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Quando você estruturar um projeto, ele aparece aqui.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">
            <FilePlus2 className="mr-2 h-4 w-4" /> Criar primeiro projeto
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Histórico</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Projetos estruturados. A lista vem da API — nada é agregado
            aqui.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/">
            <FilePlus2 className="mr-2 h-4 w-4" /> Novo projeto
          </Link>
        </Button>
      </header>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome"
          className="pl-8"
        />
      </div>

      <TooltipProvider delayDuration={200}>
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do projeto</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Versão do último arquivo</TableHead>
                <TableHead>Data da última geração</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
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
        </div>
      </TooltipProvider>
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
    const fileName = row.last_diagram_file_name ?? `${row.id}-arquitetura.drawio`;
    void projects.downloadDiagram(row.id, fileName);
  }, [row.id, row.last_diagram_file_name, hasDiagram]);

  const handleNewVersion = useCallback(() => {
    // "Nova versão" = abrir o projeto na revisão para editar e salvar.
    // A criação da nova versão fica a cargo do backend, no PATCH.
    navigate({ to: "/project/$id/review", params: { id: row.id } });
  }, [navigate, row.id]);

  return (
    <TableRow>
      <TableCell className="font-medium">{row.name}</TableCell>
      <TableCell>
        <IdCell id={row.id} />
      </TableCell>
      <TableCell className="font-mono text-sm">{versionLabel}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{generatedLabel}</TableCell>
      <TableCell>
        <StatusPill status={row.status} />
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/project/$id/review" params={{ id: row.id }}>
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Abrir
            </Link>
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownload}
                  disabled={!hasDiagram}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Baixar .drawio
                </Button>
              </span>
            </TooltipTrigger>
            {!hasDiagram && (
              <TooltipContent>Este projeto ainda não gerou diagrama.</TooltipContent>
            )}
          </Tooltip>
          <Button size="sm" onClick={handleNewVersion}>
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
      // Sem clipboard disponível — silencioso.
    }
  }, [id]);

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="font-mono text-xs text-muted-foreground">{truncated}</span>
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
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{copied ? "Copiado" : "Copiar ID completo"}</TooltipContent>
      </Tooltip>
    </div>
  );
}

function StatusPill({ status }: { status: ProjectStatus }) {
  const styles: Record<ProjectStatus, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    READY_FOR_REVIEW: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    APPROVED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
