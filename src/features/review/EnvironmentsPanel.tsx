import { useArchitectureDraft } from "./ArchitectureDraftContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const TYPE_LABEL = {
  local: "Local",
  dev: "Dev",
  staging: "Staging",
  production: "Produção",
} as const;

export function EnvironmentsPanel() {
  const { draft } = useArchitectureDraft();
  const byId = new Map(draft.components.map((c) => [c.id, c.name]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ambientes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Componentes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {draft.environments.map((env) => (
              <TableRow key={env.id}>
                <TableCell className="font-medium">{env.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{TYPE_LABEL[env.type]}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {env.component_ids.map((cid) => (
                      <Badge key={cid} variant="outline">{byId.get(cid) ?? cid}</Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {draft.environments.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                  Nenhum ambiente informado pelo backend.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
