import { Trash2, Plus } from "lucide-react";
import { useArchitectureDraft } from "./ArchitectureDraftContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Relation } from "@/types/architecture";

function makeId() {
  return `r-${Math.random().toString(36).slice(2, 8)}`;
}

export function RelationsTable() {
  const { draft, dispatch } = useArchitectureDraft();

  function addRelation() {
    const r: Relation = {
      id: makeId(),
      source_id: "",
      target_id: "",
      protocol: "",
      direction: "unidirectional",
      sync: "sync",
      information_type: "",
      description: "",
    };
    dispatch({ type: "upsertRelation", relation: r });
  }

  function update(r: Relation, patch: Partial<Relation>) {
    dispatch({ type: "upsertRelation", relation: { ...r, ...patch } });
  }

  const components = draft.components;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Relações</CardTitle>
        <Button size="sm" variant="outline" onClick={addRelation}>
          <Plus className="mr-1 h-4 w-4" /> Adicionar
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Origem</TableHead>
                <TableHead className="min-w-[180px]">Destino</TableHead>
                <TableHead className="min-w-[120px]">Protocolo</TableHead>
                <TableHead className="min-w-[140px]">Direção</TableHead>
                <TableHead className="min-w-[120px]">Sync</TableHead>
                <TableHead className="min-w-[160px]">Tipo de informação</TableHead>
                <TableHead className="min-w-[220px]">Descrição</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {draft.relations.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Select value={r.source_id} onValueChange={(v) => update(r, { source_id: v })}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        {components.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={r.target_id} onValueChange={(v) => update(r, { target_id: v })}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        {components.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input value={r.protocol} onChange={(e) => update(r, { protocol: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Select value={r.direction} onValueChange={(v) => update(r, { direction: v as Relation["direction"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unidirectional">Unidirecional</SelectItem>
                        <SelectItem value="bidirectional">Bidirecional</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={r.sync} onValueChange={(v) => update(r, { sync: v as Relation["sync"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sync">Síncrono</SelectItem>
                        <SelectItem value="async">Assíncrono</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input value={r.information_type} onChange={(e) => update(r, { information_type: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input value={r.description} onChange={(e) => update(r, { description: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => dispatch({ type: "removeRelation", id: r.id })} aria-label="Remover">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {draft.relations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                    Nenhuma relação.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
