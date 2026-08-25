// Fixture estática do histórico. Escrita à mão — nenhuma agregação nem
// geração dinâmica. Datas e versões são apenas números plausíveis.

import type { ProjectSummary } from "@/types/architecture";

export const sampleProjectHistory: ProjectSummary[] = [
  {
    id: "42",
    name: "Migração do Portal Legado",
    version: 4,
    status: "APPROVED",
    updated_at: "2026-07-21T16:40:00Z",
    last_diagram_version: 3,
    last_diagram_generated_at: "2026-07-21T17:02:00Z",
    last_diagram_file_name: "42-arquitetura.html",
  },
  {
    id: "03",
    name: "Plataforma de Pedidos B2B",
    version: 2,
    status: "APPROVED",
    updated_at: "2026-07-19T09:15:00Z",
    last_diagram_version: 1,
    last_diagram_generated_at: "2026-07-19T09:40:00Z",
    last_diagram_file_name: "03-arquitetura.html",
  },
  {
    id: "02",
    name: "Pipeline de Analytics",
    version: 2,
    status: "APPROVED",
    updated_at: "2026-07-10T14:02:00Z",
    last_diagram_version: 1,
    last_diagram_generated_at: "2026-07-11T08:20:00Z",
    last_diagram_file_name: "02-arquitetura.html",
  },
  {
    id: "07",
    name: "Refatoração do Checkout",
    version: 1,
    status: "READY_FOR_REVIEW",
    updated_at: "2026-07-23T11:05:00Z",
    // Sem diagrama gerado ainda.
  },
];
