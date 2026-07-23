import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { projectsApi } from "@/api";
import type { ProjectSummary } from "@/types/architecture";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Histórico — Architecture Console" },
      { name: "description", content: "Projetos anteriores estruturados pelo backend." },
    ],
  }),
  component: HistoryPage,
});

const STATUS_LABEL: Record<ProjectSummary["status"], string> = {
  DRAFT: "Rascunho",
  READY_FOR_REVIEW: "Aguardando revisão",
  APPROVED: "Aprovado",
};

function HistoryPage() {
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  useEffect(() => {
    projectsApi.listProjects().then(setProjects).catch(() => setProjects([]));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Histórico</h1>
      <p className="mt-1 text-sm text-muted-foreground">Projetos processados pelo backend.</p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Projetos</CardTitle>
        </CardHeader>
        <CardContent>
          {projects === null ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum projeto ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Atualizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link
                        to="/project/$id/review"
                        params={{ id: p.id }}
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.id}</TableCell>
                    <TableCell>v{p.version}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{STATUS_LABEL[p.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(p.updated_at).toLocaleString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
