import { Trash2, Plus } from "lucide-react";
import { useArchitectureDraft } from "./ArchitectureDraftContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VerificationBadge } from "@/components/VerificationBadge";
import type { Component } from "@/types/architecture";

function makeId() {
  return `c-${Math.random().toString(36).slice(2, 8)}`;
}

export function ComponentsTable() {
  const { draft, dispatch } = useArchitectureDraft();

  function addComponent() {
    // Novo componente SEMPRE nasce `unavailable`: só o backend pode marcar
    // como `verified` ou `not_found`.
    const c: Component = {
      id: makeId(),
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
    dispatch({ type: "upsertComponent", component: c });
  }

  function update(c: Component, patch: Partial<Component>) {
    dispatch({ type: "upsertComponent", component: { ...c, ...patch } });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Componentes</CardTitle>
        <Button size="sm" variant="outline" onClick={addComponent}>
          <Plus className="mr-1 h-4 w-4" /> Adicionar
        </Button>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-muted-foreground">
          Componentes novos nascem como <strong>Fonte indisponível</strong> — apenas o backend
          promove para <strong>Verificado</strong> ou <strong>Não foi possível verificar</strong>.
        </p>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px]">Nome</TableHead>
                <TableHead className="min-w-[120px]">Categoria</TableHead>
                <TableHead className="min-w-[140px]">Tecnologia</TableHead>
                <TableHead className="min-w-[220px]">Responsabilidade</TableHead>
                <TableHead className="min-w-[120px]">Ambiente</TableHead>
                <TableHead className="min-w-[120px]">Região</TableHead>
                <TableHead>Verificação</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {draft.components.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Input value={c.name} onChange={(e) => update(c, { name: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input value={c.category} onChange={(e) => update(c, { category: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input value={c.technology} onChange={(e) => update(c, { technology: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input value={c.responsibility} onChange={(e) => update(c, { responsibility: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input value={c.environment} onChange={(e) => update(c, { environment: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input value={c.region} onChange={(e) => update(c, { region: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <VerificationBadge status={c.verification_status} />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => dispatch({ type: "removeComponent", id: c.id })}
                      aria-label="Remover componente"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {draft.components.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                    Nenhum componente.
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
