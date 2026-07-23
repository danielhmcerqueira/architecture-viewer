import type { ProjectSummary } from "@/types/architecture";

export const sampleProjects: ProjectSummary[] = [
  {
    id: "mock-project",
    name: "Plataforma de Pedidos",
    version: 1,
    status: "READY_FOR_REVIEW",
    updated_at: "2026-07-22T18:30:00Z",
  },
  {
    id: "mock-legacy-migration",
    name: "Migração do Portal Legado",
    version: 3,
    status: "APPROVED",
    updated_at: "2026-07-19T09:15:00Z",
  },
  {
    id: "mock-analytics",
    name: "Pipeline de Analytics",
    version: 2,
    status: "DRAFT",
    updated_at: "2026-07-15T14:02:00Z",
  },
];
