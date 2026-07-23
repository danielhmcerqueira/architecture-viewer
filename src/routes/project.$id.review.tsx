import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

import { APPROVER_NAME } from "@/config";
import { projects } from "@/api/projects";
import type {
  ArchitectureSpec,
  Component,
  Environment,
  Evidence,
  Gap,
  Relation,
  VerificationStatus,
} from "@/types/architecture";
import {
  ArchitectureDraftProvider,
  newLocalId,
  useArchitectureDraft,
} from "@/features/review/ArchitectureDraftContext";
import { VerificationBadge } from "@/components/VerificationBadge";
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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/project/$id/review")({
  head: () => ({
    meta: [
      { title: "Revisão — Arquiteto" },
      { name: "description", content: "Revisão da arquitetura estruturada." },
    ],
  }),
  component: ReviewRoute,
});

function ReviewRoute() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["architecture", id],
    queryFn: () => projects.getArchitecture(id),
  });

  if (q.isLoading || !q.data) {
    return (
      <div>
        <PageHero index="/02" title="Revisão" description="Carregando arquitetura…" />
        <section
          className="px-6 pb-24 pt-10"
          style={{ background: "var(--iebt-paper)", color: "var(--iebt-ink)" }}
        >
          <div className="mx-auto flex max-w-5xl items-center gap-2 font-mono text-xs uppercase tracking-[0.24em] opacity-70">
            <Loader2 className="h-4 w-4 animate-spin" /> carregando…
          </div>
        </section>
      </div>
    );
  }
  if (q.error) {
    return (
      <div>
        <PageHero index="/02" title="Revisão" />
        <section
          className="px-6 pb-24 pt-10"
          style={{ background: "var(--iebt-paper)", color: "var(--iebt-ink)" }}
        >
          <div className="mx-auto max-w-5xl">
            <Alert
              variant="destructive"
              className="rounded-none border-2"
              style={{ borderColor: "var(--iebt-ink)" }}
            >
              <AlertTitle>Não foi possível carregar</AlertTitle>
              <AlertDescription>{String(q.error)}</AlertDescription>
            </Alert>
          </div>
        </section>
      </div>
    );
  }
  return (
    <ArchitectureDraftProvider spec={q.data}>
      <ReviewScreen projectId={id} refetch={q.refetch} />
    </ArchitectureDraftProvider>
  );
}

function ReviewScreen({
  projectId,
  refetch,
}: {
  projectId: string;
  refetch: () => void;
}) {
  const { draft, isDirty, dispatch } = useArchitectureDraft();
  const [tab, setTab] = useState("overview");
  const [saving, setSaving] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);

  const openGaps = draft.gaps.filter((g) => g.status === "open");
  const unverified = draft.components.filter(
    (c) => c.verification_status !== "verified",
  );

  async function handleSave() {
    setSaving(true);
    try {
      const next = await projects.patchArchitecture(projectId, draft);
      dispatch({ type: "reset", spec: next });
      toast.success(`Revisão salva (versão ${next.project.version}).`);
      refetch();
    } catch (e) {
      toast.error("Falha ao salvar revisão.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHero
        index="/02"
        title={
          <>
            {draft.project.name} —{" "}
            <span className="inline-flex items-baseline gap-2">
              revisão
              <span
                aria-hidden
                className="inline-block h-5 w-5 translate-y-0.5 sm:h-6 sm:w-6"
                style={{ background: "var(--iebt-ink)" }}
              />
            </span>
          </>
        }
        description="Ajuste componentes, relações e evidências. Cada salvar gera uma nova versão no backend."
      />
      <StatusStrip
        left={<>arquitetura · v{draft.project.version}</>}
        right={
          isDirty
            ? "alterações não salvas"
            : draft.project.status === "APPROVED"
              ? "aprovada"
              : "sem pendências"
        }
      />

      <section
        className="px-6 pb-28 pt-8"
        style={{ background: "var(--iebt-paper)", color: "var(--iebt-ink)" }}
      >
        <div className="mx-auto max-w-5xl space-y-6">
          <ProjectHeader />

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList
              className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-none border-2 bg-white p-1"
              style={{ borderColor: "var(--iebt-ink)" }}
            >
              <IebtTabTrigger value="overview">Visão geral</IebtTabTrigger>
              <IebtTabTrigger value="components">
                Componentes
                <Badge
                  variant="secondary"
                  className="ml-2 rounded-none font-mono"
                >
                  {draft.components.length}
                </Badge>
              </IebtTabTrigger>
              <IebtTabTrigger value="relations">
                Relações
                <Badge
                  variant="secondary"
                  className="ml-2 rounded-none font-mono"
                >
                  {draft.relations.length}
                </Badge>
              </IebtTabTrigger>
              <IebtTabTrigger value="environments">Ambientes</IebtTabTrigger>
              <IebtTabTrigger value="assumptions">Premissas</IebtTabTrigger>
              <IebtTabTrigger value="gaps">
                Lacunas
                {openGaps.length > 0 && (
                  <span
                    className="ml-2 inline-flex items-center px-1.5 py-0.5 font-mono text-[10px] tracking-wider"
                    style={{
                      background: "var(--iebt-orange)",
                      color: "var(--iebt-paper)",
                    }}
                  >
                    {openGaps.length}
                  </span>
                )}
              </IebtTabTrigger>
              <IebtTabTrigger value="evidence">Evidências</IebtTabTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <OverviewPanel
                spec={draft}
                openGapsCount={openGaps.length}
                onGoToGaps={() => setTab("gaps")}
              />
            </TabsContent>
            <TabsContent value="components" className="mt-4">
              <ComponentsTable />
            </TabsContent>
            <TabsContent value="relations" className="mt-4">
              <RelationsTable />
            </TabsContent>
            <TabsContent value="environments" className="mt-4">
              <EnvironmentsPanel />
            </TabsContent>
            <TabsContent value="assumptions" className="mt-4">
              <AssumptionsList />
            </TabsContent>
            <TabsContent value="gaps" className="mt-4">
              <GapsPanel />
            </TabsContent>
            <TabsContent value="evidence" className="mt-4">
              <EvidenceList
                evidence={draft.evidence}
                components={draft.components}
              />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <SaveRevisionBar
        isDirty={isDirty}
        saving={saving}
        canApprove={!isDirty && draft.project.status !== "APPROVED"}
        approved={draft.project.status === "APPROVED"}
        projectId={projectId}
        onSave={handleSave}
        onApprove={() => setApproveOpen(true)}
      />

      <ApproveDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        projectId={projectId}
        unverifiedCount={unverified.length}
        openGapsCount={openGaps.length}
        onApproved={(spec) => {
          dispatch({ type: "reset", spec });
          refetch();
        }}
      />
    </div>
  );
}

function IebtTabTrigger({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return (
    <TabsTrigger
      value={value}
      className="rounded-none border-0 bg-transparent px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] data-[state=active]:bg-[var(--iebt-ink)] data-[state=active]:text-[var(--iebt-paper)] data-[state=active]:shadow-none"
    >
      {children}
    </TabsTrigger>
  );
}

// -------------------- Header --------------------

function ProjectHeader() {
  const { draft, dispatch } = useArchitectureDraft();
  const p = draft.project;
  return (
    <PaperCard as="section" className="p-5">
      <SectionLabel
        index="01"
        title="Identificação"
        meta={
          <span
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em]"
            style={{ color: "var(--iebt-orange-deep)" }}
          >
            <span
              className="inline-block h-2 w-2"
              style={{ background: "var(--iebt-orange)" }}
              aria-hidden
            />
            v{p.version} · {p.status.toLowerCase()}
          </span>
        }
      />
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Input
            value={p.name}
            onChange={(e) =>
              dispatch({
                type: "patchProject",
                patch: { name: e.target.value },
              })
            }
            className="h-auto rounded-none border-0 border-b-2 bg-transparent px-0 font-mono text-2xl tracking-tight shadow-none focus-visible:ring-0"
            style={{ borderBottomColor: "var(--iebt-ink)" }}
          />
          <Textarea
            value={p.description}
            onChange={(e) =>
              dispatch({
                type: "patchProject",
                patch: { description: e.target.value },
              })
            }
            rows={2}
            className="resize-none rounded-none border-0 bg-transparent px-0 text-sm opacity-80 shadow-none focus-visible:ring-0"
          />
        </div>
      </div>
    </PaperCard>
  );
}

// -------------------- Overview --------------------

function OverviewPanel({
  spec,
  openGapsCount,
  onGoToGaps,
}: {
  spec: ArchitectureSpec;
  openGapsCount: number;
  onGoToGaps: () => void;
}) {
  const counts = {
    verified: spec.components.filter((c) => c.verification_status === "verified")
      .length,
    not_found: spec.components.filter(
      (c) => c.verification_status === "not_found",
    ).length,
    unavailable: spec.components.filter(
      (c) => c.verification_status === "unavailable",
    ).length,
  };
  return (
    <div className="space-y-4">
      {openGapsCount > 0 && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {openGapsCount} lacuna{openGapsCount === 1 ? "" : "s"} em aberto
          </AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>
              Há informações ausentes que podem afetar decisões. Revise antes
              de aprovar.
            </span>
            <Button size="sm" variant="outline" onClick={onGoToGaps}>
              Ver lacunas <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Componentes" value={spec.components.length} />
        <StatCard label="Relações" value={spec.relations.length} />
        <StatCard label="Ambientes" value={spec.environments.length} />
        <StatCard label="Premissas" value={spec.assumptions.length} />
      </div>

      <div className="rounded-lg border border-border bg-card p-4 text-sm">
        <div className="mb-2 font-medium">Status de verificação</div>
        <div className="flex flex-wrap gap-4 text-muted-foreground">
          <span>Verificados: {counts.verified}</span>
          <span>Não encontrados: {counts.not_found}</span>
          <span>Fonte indisponível: {counts.unavailable}</span>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-sm font-medium">Objetivo</div>
        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
          {spec.project.objective}
        </p>
        <div className="mt-3 text-sm font-medium">Escopo</div>
        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
          {spec.project.scope}
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

// -------------------- Components --------------------

// Filtros nunca ocultam not_found nem unavailable — a política do produto
// exige que itens não verificados sigam sempre visíveis.
const STATUS_FILTERS: { key: "all" | "issues"; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "issues", label: "Somente não verificados" },
];

function ComponentsTable() {
  const { draft, dispatch } = useArchitectureDraft();
  const [filter, setFilter] = useState<"all" | "issues">("all");
  const [sortByStatus, setSortByStatus] = useState(false);

  const rows = useMemo(() => {
    let r = draft.components;
    if (filter === "issues") {
      r = r.filter((c) => c.verification_status !== "verified");
    }
    if (sortByStatus) {
      // not_found/unavailable primeiro para trazer os pendentes ao topo.
      const order: Record<VerificationStatus, number> = {
        not_found: 0,
        unavailable: 1,
        verified: 2,
      };
      r = [...r].sort(
        (a, b) => order[a.verification_status] - order[b.verification_status],
      );
    }
    return r;
  }, [draft.components, filter, sortByStatus]);


  function addComponent() {
    const item: Component = {
      id: newLocalId("c"),
      name: "Novo componente",
      category: "",
      technology: "",
      responsibility: "",
      environment: "",
      region: "",
      notes: "",
      verification_status: "unavailable",
      evidence_ids: [],
    };
    dispatch({ type: "addComponent", item });
    toast.info("Componente adicionado como 'Fonte indisponível' até verificação pelo backend.");
  }

  function removeComponent(c: Component) {
    const refs = draft.relations.filter(
      (r) => r.source_id === c.id || r.target_id === c.id,
    ).length;
    const msg =
      refs > 0
        ? `${refs} relaç${refs === 1 ? "ão usa" : "ões usam"} este componente. Remover mesmo assim?`
        : `Remover "${c.name}"?`;
    if (window.confirm(msg)) dispatch({ type: "removeComponent", id: c.id });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? "default" : "outline"}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
          <label className="ml-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Checkbox
              checked={sortByStatus}
              onCheckedChange={(v) => setSortByStatus(!!v)}
            />
            Ordenar por status
          </label>
        </div>
        <Button size="sm" onClick={addComponent}>
          <Plus className="mr-1 h-4 w-4" /> Adicionar
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[160px]">Nome</TableHead>
              <TableHead className="min-w-[160px]">Tecnologia</TableHead>
              <TableHead className="min-w-[120px]">Categoria</TableHead>
              <TableHead className="min-w-[220px]">Responsabilidade</TableHead>
              <TableHead className="min-w-[120px]">Ambiente</TableHead>
              <TableHead className="min-w-[120px]">Região</TableHead>
              <TableHead className="min-w-[220px]">Verificação</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Input
                    value={c.name}
                    onChange={(e) =>
                      dispatch({
                        type: "updateComponent",
                        id: c.id,
                        patch: { name: e.target.value },
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={c.technology}
                    onChange={(e) =>
                      dispatch({
                        type: "updateComponent",
                        id: c.id,
                        patch: { technology: e.target.value },
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={c.category}
                    onChange={(e) =>
                      dispatch({
                        type: "updateComponent",
                        id: c.id,
                        patch: { category: e.target.value },
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={c.responsibility}
                    onChange={(e) =>
                      dispatch({
                        type: "updateComponent",
                        id: c.id,
                        patch: { responsibility: e.target.value },
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={c.environment}
                    onChange={(e) =>
                      dispatch({
                        type: "updateComponent",
                        id: c.id,
                        patch: { environment: e.target.value },
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={c.region}
                    onChange={(e) =>
                      dispatch({
                        type: "updateComponent",
                        id: c.id,
                        patch: { region: e.target.value },
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <VerificationBadge status={c.verification_status} />
                </TableCell>
                <TableCell>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeComponent(c)}
                    aria-label="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                  Nenhum componente neste filtro.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// -------------------- Relations --------------------

function RelationsTable() {
  const { draft, dispatch } = useArchitectureDraft();
  const comps = draft.components;

  function add() {
    if (comps.length < 2) {
      toast.info("Adicione pelo menos dois componentes antes de criar relações.");
      return;
    }
    const item: Relation = {
      id: newLocalId("r"),
      source_id: comps[0].id,
      target_id: comps[1].id,
      protocol: "",
      direction: "unidirectional",
      sync: "sync",
      information_type: "",
      description: "",
    };
    dispatch({ type: "addRelation", item });
  }

  const patch = (id: string, p: Partial<Relation>) =>
    dispatch({ type: "updateRelation", id, patch: p });

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={add}>
          <Plus className="mr-1 h-4 w-4" /> Adicionar
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[160px]">Origem</TableHead>
              <TableHead className="min-w-[160px]">Destino</TableHead>
              <TableHead className="min-w-[120px]">Protocolo</TableHead>
              <TableHead className="min-w-[140px]">Direção</TableHead>
              <TableHead className="min-w-[120px]">Sync/Async</TableHead>
              <TableHead className="min-w-[160px]">Tipo de informação</TableHead>
              <TableHead className="min-w-[220px]">Descrição</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {draft.relations.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <ComponentSelect
                    value={r.source_id}
                    options={comps}
                    onChange={(v) => patch(r.id, { source_id: v })}
                  />
                </TableCell>
                <TableCell>
                  <ComponentSelect
                    value={r.target_id}
                    options={comps}
                    onChange={(v) => patch(r.id, { target_id: v })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={r.protocol}
                    onChange={(e) => patch(r.id, { protocol: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={r.direction}
                    onValueChange={(v) =>
                      patch(r.id, { direction: v as Relation["direction"] })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unidirectional">Unidirecional</SelectItem>
                      <SelectItem value="bidirectional">Bidirecional</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={r.sync}
                    onValueChange={(v) => patch(r.id, { sync: v as Relation["sync"] })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sync">Sync</SelectItem>
                      <SelectItem value="async">Async</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    value={r.information_type}
                    onChange={(e) =>
                      patch(r.id, { information_type: e.target.value })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={r.description}
                    onChange={(e) => patch(r.id, { description: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Remover"
                    onClick={() =>
                      window.confirm("Remover esta relação?") &&
                      dispatch({ type: "removeRelation", id: r.id })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {draft.relations.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                  Nenhuma relação cadastrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ComponentSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Component[];
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
      <SelectContent>
        {options.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// -------------------- Environments --------------------

function EnvironmentsPanel() {
  const { draft, dispatch } = useArchitectureDraft();
  return (
    <div className="space-y-4">
      {draft.environments.map((env) => (
        <div key={env.id} className="rounded-lg border border-border bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Nome</Label>
              <Input
                value={env.name}
                onChange={(e) =>
                  dispatch({
                    type: "updateEnvironment",
                    id: env.id,
                    patch: { name: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select
                value={env.type}
                onValueChange={(v) =>
                  dispatch({
                    type: "updateEnvironment",
                    id: env.id,
                    patch: { type: v as Environment["type"] },
                  })
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">local</SelectItem>
                  <SelectItem value="dev">dev</SelectItem>
                  <SelectItem value="staging">staging</SelectItem>
                  <SelectItem value="production">production</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-3">
            <div className="mb-2 text-xs font-medium">Componentes associados</div>
            <div className="flex flex-wrap gap-2">
              {draft.components.map((c) => {
                const active = env.component_ids.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: "toggleEnvComponent",
                        envId: env.id,
                        componentId: c.id,
                      })
                    }
                    className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-accent"
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
              {draft.components.length === 0 && (
                <span className="text-xs text-muted-foreground">
                  Nenhum componente cadastrado.
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
      {draft.environments.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum ambiente.</p>
      )}
    </div>
  );
}

// -------------------- Assumptions --------------------

function AssumptionsList() {
  const { draft, dispatch } = useArchitectureDraft();
  function add() {
    dispatch({
      type: "addAssumption",
      item: {
        id: newLocalId("a"),
        text: "",
        origin: "",
        impact: "",
      },
    });
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={add}>
          <Plus className="mr-1 h-4 w-4" /> Adicionar
        </Button>
      </div>
      {draft.assumptions.map((a) => (
        <div key={a.id} className="rounded-lg border border-border bg-card p-4">
          <div className="grid gap-3">
            <div>
              <Label className="text-xs">Premissa</Label>
              <Textarea
                value={a.text}
                onChange={(e) =>
                  dispatch({
                    type: "updateAssumption",
                    id: a.id,
                    patch: { text: e.target.value },
                  })
                }
                rows={2}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Origem</Label>
                <Input
                  value={a.origin}
                  onChange={(e) =>
                    dispatch({
                      type: "updateAssumption",
                      id: a.id,
                      patch: { origin: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Impacto se falsa</Label>
                <Input
                  value={a.impact}
                  onChange={(e) =>
                    dispatch({
                      type: "updateAssumption",
                      id: a.id,
                      patch: { impact: e.target.value },
                    })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  window.confirm("Remover premissa?") &&
                  dispatch({ type: "removeAssumption", id: a.id })
                }
              >
                <Trash2 className="mr-1 h-4 w-4" /> Remover
              </Button>
            </div>
          </div>
        </div>
      ))}
      {draft.assumptions.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma premissa registrada.</p>
      )}
    </div>
  );
}

// -------------------- Gaps --------------------

function GapsPanel() {
  const { draft } = useArchitectureDraft();
  if (draft.gaps.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma lacuna registrada.</p>;
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        As lacunas apresentam informações ausentes identificadas pelo backend.
        A interface apenas apresenta a lacuna, o impacto e a ação sugerida —
        a decisão é sua.
      </p>
      {draft.gaps.map((g: Gap) => (
        <div
          key={g.id}
          className={`rounded-lg border p-4 ${
            g.status === "open"
              ? "border-amber-300 bg-amber-50 dark:bg-amber-950/30"
              : "border-border bg-card"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm font-medium">{g.missing_info}</div>
            <Badge variant={g.status === "open" ? "default" : "outline"}>
              {g.status === "open" ? "Em aberto" : "Resolvida"}
            </Badge>
          </div>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Impacto</dt>
              <dd>{g.impact}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Ação sugerida</dt>
              <dd>{g.action}</dd>
            </div>
          </dl>
        </div>
      ))}
    </div>
  );
}

// -------------------- Evidence --------------------

function EvidenceList({
  evidence,
  components,
}: {
  evidence: Evidence[];
  components: Component[];
}) {
  const byTarget = useMemo(() => {
    const m = new Map<string, Evidence[]>();
    for (const e of evidence) {
      const arr = m.get(e.target_id) ?? [];
      arr.push(e);
      m.set(e.target_id, arr);
    }
    return m;
  }, [evidence]);

  return (
    <div className="space-y-3">
      {components.map((c) => {
        const items = byTarget.get(c.id) ?? [];
        return (
          <div key={c.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">{c.name}</div>
              <VerificationBadge status={c.verification_status} compact />
            </div>
            {items.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">sem evidências</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {items.map((e) => (
                  <li key={e.id} className="rounded-md border border-border bg-background p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">{e.source_title || "—"}</div>
                      <VerificationBadge status={e.status} compact />
                    </div>
                    <p className="mt-1 text-muted-foreground">{e.summary}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(e.checked_at).toLocaleString("pt-BR")}</span>
                      {e.source_reference && (
                        <a
                          href={e.source_reference}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline"
                        >
                          Ver fonte
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

// -------------------- Save bar --------------------

function SaveRevisionBar({
  isDirty,
  saving,
  canApprove,
  approved,
  projectId,
  onSave,
  onApprove,
}: {
  isDirty: boolean;
  saving: boolean;
  canApprove: boolean;
  approved: boolean;
  projectId: string;
  onSave: () => void;
  onApprove: () => void;
}) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t-2"
      style={{
        background: "var(--iebt-ink)",
        borderColor: "var(--iebt-orange)",
        color: "var(--iebt-paper)",
      }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-3">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] opacity-80">
          <span
            className="inline-block h-2 w-2"
            style={{
              background: isDirty
                ? "var(--iebt-orange)"
                : approved
                  ? "#7fe0a3"
                  : "rgba(250,247,242,0.4)",
            }}
            aria-hidden
          />
          {isDirty
            ? "Alterações não salvas"
            : approved
              ? "Arquitetura aprovada"
              : "Sem pendências"}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onSave}
            disabled={!isDirty || saving}
            className={iebtOutlineButtonClass}
            style={iebtOutlineButtonStyle}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar revisão
          </Button>
          {approved ? (
            <Button
              asChild
              className={iebtPrimaryButtonClass}
              style={iebtPrimaryButtonStyle}
            >
              <Link to="/project/$id/diagram" params={{ id: projectId }}>
                Ir para diagrama <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button
              onClick={onApprove}
              disabled={!canApprove}
              className={iebtPrimaryButtonClass}
              style={iebtPrimaryButtonStyle}
            >
              <CheckCircle2 className="h-4 w-4" /> Aprovar arquitetura
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------- Approve dialog --------------------

function ApproveDialog({
  open,
  onOpenChange,
  projectId,
  unverifiedCount,
  openGapsCount,
  onApproved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  unverifiedCount: number;
  openGapsCount: number;
  onApproved: (spec: ArchitectureSpec) => void;
}) {
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) setBusy(false);
  }, [open]);

  async function confirm() {
    setBusy(true);
    try {
      const spec = await projects.approve(projectId, { approver: APPROVER_NAME });
      onApproved(spec);
      toast.success("Arquitetura aprovada.");
      onOpenChange(false);
      navigate({ to: "/project/$id/diagram", params: { id: projectId } });
    } catch (e) {
      toast.error("Falha ao aprovar.");
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar aprovação</DialogTitle>
          <DialogDescription>
            A aprovação libera a geração do diagrama. Confira antes de confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          <div className="rounded-md border border-border bg-muted/40 p-3">
            <div>
              Componentes não verificados: <strong>{unverifiedCount}</strong>
            </div>
            <div>
              Lacunas em aberto: <strong>{openGapsCount}</strong>
            </div>
          </div>
          {(unverifiedCount > 0 || openGapsCount > 0) && (
            <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Aprovar não resolve os itens acima. Eles seguem registrados na
                especificação.
              </AlertDescription>
            </Alert>
          )}
          <p className="text-xs text-muted-foreground">
            Aprovador: <span className="font-mono">{APPROVER_NAME}</span>. A data
            de aprovação é definida pelo backend.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={confirm} disabled={busy}>
            {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Confirmar aprovação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
