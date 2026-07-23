import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Save } from "lucide-react";

import { projectsApi } from "@/api";
import type { ArchitectureSpec } from "@/types/architecture";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import {
  ArchitectureDraftProvider,
  resetDraft,
  useArchitectureDraft,
} from "@/features/review/ArchitectureDraftContext";
import { ProjectHeader } from "@/features/review/ProjectHeader";
import { ComponentsTable } from "@/features/review/ComponentsTable";
import { RelationsTable } from "@/features/review/RelationsTable";
import { EnvironmentsPanel } from "@/features/review/EnvironmentsPanel";
import { AssumptionsList } from "@/features/review/AssumptionsList";
import { GapsPanel } from "@/features/review/GapsPanel";
import { EvidenceList } from "@/features/review/EvidenceList";
import { ProgressStrip } from "@/features/review/ProgressStrip";
import { ApproveDialog } from "@/features/review/ApproveDialog";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

export const Route = createFileRoute("/project/$id/review")({
  head: () => ({
    meta: [
      { title: "Revisão — Architecture Console" },
      { name: "description", content: "Revise a arquitetura devolvida pelo backend e aprove." },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const { id } = Route.useParams();
  const [spec, setSpec] = useState<ArchitectureSpec | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSpec(null);
    setError(null);
    projectsApi
      .getArchitecture(id)
      .then(setSpec)
      .catch((e) => {
        console.error(e);
        setError("Não foi possível carregar a arquitetura.");
      });
  }, [id]);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!spec) return <ReviewSkeleton />;

  return (
    <ArchitectureDraftProvider spec={spec}>
      <ReviewInner projectId={id} onServerUpdate={setSpec} />
    </ArchitectureDraftProvider>
  );
}

function ReviewSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}

function ReviewInner({
  projectId,
  onServerUpdate,
}: {
  projectId: string;
  onServerUpdate: (spec: ArchitectureSpec) => void;
}) {
  const { draft, isDirty, dispatch } = useArchitectureDraft();
  const [saving, setSaving] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const navigate = useNavigate();

  useUnsavedChangesGuard(isDirty);

  const openGaps = draft.gaps.filter((g) => g.status === "open").length;
  const isApproved = draft.project.status === "APPROVED";

  async function saveRevision() {
    setSaving(true);
    try {
      const updated = await projectsApi.patchArchitecture(projectId, draft);
      resetDraft(dispatch, updated);
      onServerUpdate(updated);
      toast.success(`Revisão salva — v${updated.project.version}.`);
    } catch (err) {
      console.error(err);
      toast.error("Falha ao salvar revisão.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{draft.project.name}</h1>
          <p className="text-xs text-muted-foreground">Projeto {projectId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={saveRevision} disabled={!isDirty || saving}>
            <Save className="mr-1 h-4 w-4" />
            {saving ? "Salvando..." : "Salvar revisão"}
          </Button>
          <Button onClick={() => setApproveOpen(true)} disabled={isApproved}>
            {isApproved ? "Aprovado" : "Aprovar arquitetura"}
          </Button>
          <Button
            variant="secondary"
            disabled={!isApproved}
            onClick={() => navigate({ to: "/project/$id/diagram", params: { id: projectId } })}
          >
            Ir para geração <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      <ProgressStrip projectId={projectId} />

      {openGaps > 0 && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="flex items-start gap-3 py-4 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-medium">
                {openGaps} lacuna{openGaps === 1 ? "" : "s"} em aberto.
              </p>
              <p className="text-amber-900/80">
                A interface não resolve lacunas automaticamente. Revise cada uma na aba
                <strong> Lacunas</strong> antes de aprovar.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="components">
            Componentes <Badge variant="outline" className="ml-2">{draft.components.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="relations">
            Relações <Badge variant="outline" className="ml-2">{draft.relations.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="environments">Ambientes</TabsTrigger>
          <TabsTrigger value="assumptions">Premissas</TabsTrigger>
          <TabsTrigger value="gaps">
            Lacunas
            {openGaps > 0 && (
              <Badge className="ml-2 bg-amber-100 text-amber-900 hover:bg-amber-100">
                {openGaps}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="evidence">Evidências</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="overview"><ProjectHeader /></TabsContent>
          <TabsContent value="components"><ComponentsTable /></TabsContent>
          <TabsContent value="relations"><RelationsTable /></TabsContent>
          <TabsContent value="environments"><EnvironmentsPanel /></TabsContent>
          <TabsContent value="assumptions"><AssumptionsList /></TabsContent>
          <TabsContent value="gaps"><GapsPanel /></TabsContent>
          <TabsContent value="evidence"><EvidenceList /></TabsContent>
        </div>
      </Tabs>

      <p className="text-xs text-muted-foreground">
        <Link to="/history" className="underline-offset-4 hover:underline">Voltar para o histórico</Link>
      </p>

      <ApproveDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        projectId={projectId}
        isDirty={isDirty}
        openGapsCount={openGaps}
        onApproved={(updated) => {
          resetDraft(dispatch, updated);
          onServerUpdate(updated);
        }}
      />
    </div>
  );
}
