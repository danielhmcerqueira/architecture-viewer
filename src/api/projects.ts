// Fachada estável para funções de dados de projeto/arquitetura.
// A camada real de rede continua em src/api/client.ts (com USE_MOCKS).
// Este arquivo apenas expõe assinaturas mais amigáveis, como
// `projects.approve(id, { approver })`.

import {
  approveArchitecture,
  createProject,
  diagramDownloadUrl,
  downloadDiagram,
  generateDiagram,
  getArchitecture,
  listProjects,
  patchArchitecture,
  type CreateProjectInput,
  type CreateProjectResponse,
  type DiagramInfo,
} from "@/api/client";
import type { ArchitectureSpec, ProjectSummary } from "@/types/architecture";

export const projects = {
  list: (): Promise<ProjectSummary[]> => listProjects(),
  create: (input: CreateProjectInput): Promise<CreateProjectResponse> =>
    createProject(input),
  getArchitecture: (id: string): Promise<ArchitectureSpec> => getArchitecture(id),
  patchArchitecture: (id: string, spec: ArchitectureSpec): Promise<ArchitectureSpec> =>
    patchArchitecture(id, spec),
  approve: (
    id: string,
    { approver }: { approver: string },
  ): Promise<ArchitectureSpec> => approveArchitecture(id, approver),
  generateDiagram: (id: string): Promise<DiagramInfo> => generateDiagram(id),
  diagramDownloadUrl: (id: string): string => diagramDownloadUrl(id),
  downloadDiagram: (id: string, fileName?: string): Promise<void> =>
    downloadDiagram(id, fileName),
};
