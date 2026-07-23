// Camada ÚNICA que fala com dados. Componentes SEMPRE importam daqui —
// nunca de src/mocks/*.
//
// Enquanto USE_MOCKS = true, todas as funções devolvem os mocks estáticos
// com um atraso simulado de 600ms. Quando o backend estiver disponível,
// troque USE_MOCKS para false e implemente os blocos `// TODO(real)`
// usando fetch contra `${API_BASE_URL}${path}`.

import { API_BASE_URL } from "@/config";
import {
  sampleArchitecture,
  sampleProjects,
} from "@/mocks/architecture.sample";
import type {
  ArchitectureSpec,
  ProjectSummary,
} from "@/types/architecture";

export const USE_MOCKS = true;

const MOCK_DELAY_MS = 600;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

// Clone raso para simular a fronteira de rede: consumidores nunca devem
// mutar o objeto de mock em memória.
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export interface CreateProjectInput {
  name: string;
  notes: string;
}

export interface CreateProjectResponse {
  id: string;
}

// ---- API ---------------------------------------------------------------

export async function createProject(
  input: CreateProjectInput,
): Promise<CreateProjectResponse> {
  if (USE_MOCKS) {
    const id = `mock-${Date.now().toString(36)}`;
    return delay({ id });
  }
  // TODO(real):
  // return apiFetch<CreateProjectResponse>("/projects", {
  //   method: "POST",
  //   body: JSON.stringify(input),
  // });
  void API_BASE_URL;
  void input;
  throw new Error("Backend real ainda não conectado.");
}

export async function getArchitecture(
  projectId: string,
): Promise<ArchitectureSpec> {
  if (USE_MOCKS) {
    const spec = clone(sampleArchitecture);
    spec.project.id = projectId;
    return delay(spec);
  }
  // TODO(real):
  // return apiFetch<ArchitectureSpec>(`/projects/${projectId}/architecture`);
  throw new Error("Backend real ainda não conectado.");
}

export async function listProjects(): Promise<ProjectSummary[]> {
  if (USE_MOCKS) return delay(clone(sampleProjects));
  // TODO(real):
  // return apiFetch<ProjectSummary[]>("/projects");
  throw new Error("Backend real ainda não conectado.");
}

export async function patchArchitecture(
  projectId: string,
  spec: ArchitectureSpec,
): Promise<ArchitectureSpec> {
  if (USE_MOCKS) {
    const next = clone(spec);
    next.project.id = projectId;
    next.project.version = (spec.project.version ?? 1) + 1;
    return delay(next);
  }
  // TODO(real):
  // return apiFetch<ArchitectureSpec>(`/projects/${projectId}/architecture`, {
  //   method: "PATCH",
  //   body: JSON.stringify(spec),
  // });
  throw new Error("Backend real ainda não conectado.");
}

export async function approveArchitecture(
  projectId: string,
  approver: string,
): Promise<ArchitectureSpec> {
  if (USE_MOCKS) {
    const spec = clone(sampleArchitecture);
    spec.project.id = projectId;
    spec.project.status = "APPROVED";
    return delay(spec);
  }
  // TODO(real):
  // return apiFetch<ArchitectureSpec>(`/projects/${projectId}/approve`, {
  //   method: "POST",
  //   body: JSON.stringify({ approver }),
  // });
  void approver;
  throw new Error("Backend real ainda não conectado.");
}

// ---- Diagrama ----------------------------------------------------------

export interface DiagramInfo {
  file_name: string;
  version: number;
  generated_at: string; // ISO
}

export async function generateDiagram(projectId: string): Promise<DiagramInfo> {
  if (USE_MOCKS) {
    return delay({
      file_name: `${projectId}-arquitetura.drawio`,
      version: 1,
      generated_at: new Date().toISOString(),
    });
  }
  // TODO(real):
  // return apiFetch<DiagramInfo>(`/api/projects/${projectId}/diagram`, {
  //   method: "POST",
  // });
  throw new Error("Backend real ainda não conectado.");
}

// URL usada pelo <a download> no modo real. No mock, o download é montado
// em memória a partir de `SAMPLE_DIAGRAM_XML` no próprio componente.
export function diagramDownloadUrl(projectId: string): string {
  return `${API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}/diagram/download`;
}


// ---- Utilitário reservado para o modo real ------------------------------

// Mantido pronto para quando USE_MOCKS virar false. NÃO é usado enquanto
// o modo mock estiver ativo.
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`Requisição falhou (${res.status})`);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
