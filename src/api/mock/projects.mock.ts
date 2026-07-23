import type { ArchitectureSpec, ProjectSummary } from "@/types/architecture";
import { sampleArchitecture } from "@/mocks/architecture.sample";
import { sampleProjects } from "@/mocks/projects.sample";

// Estado em memória para simular persistência do backend durante a sessão.
// Trocar para a API real é uma alteração de uma linha em src/api/index.ts.
const store = new Map<string, ArchitectureSpec>();
const summaries = new Map<string, ProjectSummary>();

function seed() {
  if (!store.has(sampleArchitecture.project.id)) {
    store.set(sampleArchitecture.project.id, structuredClone(sampleArchitecture));
  }
  for (const s of sampleProjects) {
    if (!summaries.has(s.id)) summaries.set(s.id, { ...s });
  }
}
seed();

function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const mockProjectsApi = {
  async createProject(input: { name: string; description?: string }): Promise<{ id: string }> {
    const id = `mock-${Date.now().toString(36)}`;
    const spec: ArchitectureSpec = {
      ...structuredClone(sampleArchitecture),
      project: {
        ...sampleArchitecture.project,
        id,
        name: input.name,
        description: input.description ?? "",
        version: 1,
        status: "DRAFT",
      },
    };
    store.set(id, spec);
    summaries.set(id, {
      id,
      name: input.name,
      version: 1,
      status: "DRAFT",
      updated_at: new Date().toISOString(),
    });
    return delay({ id });
  },
  async sendInput(_id: string, _text: string): Promise<void> {
    return delay(undefined, 150);
  },
  async triggerStructuring(id: string): Promise<void> {
    const s = summaries.get(id);
    if (s) s.status = "READY_FOR_REVIEW";
    const spec = store.get(id);
    if (spec) spec.project.status = "READY_FOR_REVIEW";
    return delay(undefined, 150);
  },
  async getArchitecture(id: string): Promise<ArchitectureSpec> {
    const spec = store.get(id) ?? structuredClone(sampleArchitecture);
    return delay(structuredClone(spec));
  },
  async patchArchitecture(id: string, spec: ArchitectureSpec): Promise<ArchitectureSpec> {
    const next: ArchitectureSpec = {
      ...spec,
      project: { ...spec.project, version: spec.project.version + 1 },
    };
    store.set(id, structuredClone(next));
    const s = summaries.get(id);
    if (s) {
      s.version = next.project.version;
      s.updated_at = new Date().toISOString();
    }
    return delay(structuredClone(next));
  },
  async approve(id: string, _approver: string): Promise<ArchitectureSpec> {
    const spec = store.get(id);
    if (!spec) throw new Error("Projeto não encontrado no mock");
    spec.project.status = "APPROVED";
    const s = summaries.get(id);
    if (s) s.status = "APPROVED";
    return delay(structuredClone(spec));
  },
  async generateDiagram(_id: string): Promise<void> {
    return delay(undefined, 150);
  },
  async downloadDiagram(id: string): Promise<Blob> {
    // Nunca gera/valida XML. Devolve bytes fake, a interface só oferece download.
    const bytes = new TextEncoder().encode(`<!-- mock diagram for ${id} -->\n`);
    return new Blob([bytes], { type: "application/octet-stream" });
  },
  async listProjects(): Promise<ProjectSummary[]> {
    return delay(Array.from(summaries.values()).sort((a, b) => b.updated_at.localeCompare(a.updated_at)));
  },
};
