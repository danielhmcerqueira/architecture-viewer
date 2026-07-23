import { Trash2, Plus } from "lucide-react";
import { useArchitectureDraft } from "./ArchitectureDraftContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Assumption } from "@/types/architecture";

function makeId() {
  return `a-${Math.random().toString(36).slice(2, 8)}`;
}

export function AssumptionsList() {
  const { draft, dispatch } = useArchitectureDraft();

  function add() {
    const a: Assumption = { id: makeId(), text: "", origin: "", impact: "" };
    dispatch({ type: "upsertAssumption", item: a });
  }

  function update(a: Assumption, patch: Partial<Assumption>) {
    dispatch({ type: "upsertAssumption", item: { ...a, ...patch } });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Premissas</CardTitle>
        <Button size="sm" variant="outline" onClick={add}>
          <Plus className="mr-1 h-4 w-4" /> Adicionar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {draft.assumptions.map((a) => (
          <div key={a.id} className="rounded-md border border-border p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Premissa</Label>
                <Textarea rows={2} value={a.text} onChange={(e) => update(a, { text: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Origem</Label>
                <Input value={a.origin} onChange={(e) => update(a, { origin: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Impacto se falsa</Label>
                <Input value={a.impact} onChange={(e) => update(a, { impact: e.target.value })} />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button size="sm" variant="ghost" onClick={() => dispatch({ type: "removeAssumption", id: a.id })}>
                <Trash2 className="mr-1 h-4 w-4" /> Remover
              </Button>
            </div>
          </div>
        ))}
        {draft.assumptions.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma premissa informada.</p>
        )}
      </CardContent>
    </Card>
  );
}
