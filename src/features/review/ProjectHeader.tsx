import { useArchitectureDraft } from "./ArchitectureDraftContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL = {
  DRAFT: "Rascunho",
  READY_FOR_REVIEW: "Aguardando revisão",
  APPROVED: "Aprovado",
} as const;

export function ProjectHeader() {
  const { draft, dispatch } = useArchitectureDraft();
  const p = draft.project;
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline">v{p.version}</Badge>
          <Badge variant="secondary">{STATUS_LABEL[p.status]}</Badge>
          <span className="text-xs text-muted-foreground">
            Editar campos gera uma nova revisão ao salvar.
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input
              value={p.name}
              onChange={(e) => dispatch({ type: "patchProject", patch: { name: e.target.value } })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input
              value={p.description}
              onChange={(e) => dispatch({ type: "patchProject", patch: { description: e.target.value } })}
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Objetivo</Label>
            <Textarea
              rows={2}
              value={p.objective}
              onChange={(e) => dispatch({ type: "patchProject", patch: { objective: e.target.value } })}
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Escopo</Label>
            <Textarea
              rows={2}
              value={p.scope}
              onChange={(e) => dispatch({ type: "patchProject", patch: { scope: e.target.value } })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
