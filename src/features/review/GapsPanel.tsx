import { Trash2, Plus, AlertTriangle } from "lucide-react";
import { useArchitectureDraft } from "./ArchitectureDraftContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Gap } from "@/types/architecture";

function makeId() {
  return `g-${Math.random().toString(36).slice(2, 8)}`;
}

export function GapsPanel() {
  const { draft, dispatch } = useArchitectureDraft();

  function add() {
    const g: Gap = { id: makeId(), missing_info: "", impact: "", action: "", status: "open" };
    dispatch({ type: "upsertGap", item: g });
  }
  function update(g: Gap, patch: Partial<Gap>) {
    dispatch({ type: "upsertGap", item: { ...g, ...patch } });
  }

  const openCount = draft.gaps.filter((g) => g.status === "open").length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>Lacunas</CardTitle>
          {openCount > 0 && (
            <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
              <AlertTriangle className="mr-1 h-3 w-3" /> {openCount} em aberto
            </Badge>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={add}>
          <Plus className="mr-1 h-4 w-4" /> Adicionar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Lacunas são apresentadas para sua decisão. A interface nunca resolve nem oculta —
          revise cada uma antes de aprovar.
        </p>
        {draft.gaps.map((g) => (
          <div
            key={g.id}
            className={
              g.status === "open"
                ? "rounded-md border border-amber-200 bg-amber-50/40 p-4"
                : "rounded-md border border-border p-4"
            }
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Informação faltante</Label>
                <Textarea rows={2} value={g.missing_info} onChange={(e) => update(g, { missing_info: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Impacto</Label>
                <Textarea rows={2} value={g.impact} onChange={(e) => update(g, { impact: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Ação sugerida</Label>
                <Textarea rows={2} value={g.action} onChange={(e) => update(g, { action: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={g.status} onValueChange={(v) => update(g, { status: v as Gap["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Em aberto</SelectItem>
                    <SelectItem value="resolved">Resolvida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button size="sm" variant="ghost" onClick={() => dispatch({ type: "removeGap", id: g.id })}>
                <Trash2 className="mr-1 h-4 w-4" /> Remover
              </Button>
            </div>
          </div>
        ))}
        {draft.gaps.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma lacuna.</p>}
      </CardContent>
    </Card>
  );
}
