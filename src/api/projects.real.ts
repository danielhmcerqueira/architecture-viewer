import { apiFetch, apiFetchBlob } from "./client";
import type { ArchitectureSpec, ProjectSummary } from "@/types/architecture";

export const realProjectsApi = {
  async createProject(input: { name: string; description?: string }): Promise<{ id: string }> {
    return apiFetch("/api/projects", { method: "POST", body: JSON.stringify(input) });
  },
  async sendInput(id: string, text: string): Promise<void> {
    await apiFetch(`/api/projects/${id}/input`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  },
  async triggerStructuring(id: string): Promise<void> {
    await apiFetch(`/api/projects/${id}/structure`, { method: "POST" });
  },
  async getArchitecture(id: string): Promise<ArchitectureSpec> {
    return apiFetch(`/api/projects/${id}/architecture`);
  },
  async patchArchitecture(id: string, spec: ArchitectureSpec): Promise<ArchitectureSpec> {
    return apiFetch(`/api/projects/${id}/architecture`, {
      method: "PATCH",
      body: JSON.stringify(spec),
    });
  },
  async approve(id: string, approver: string): Promise<ArchitectureSpec> {
    return apiFetch(`/api/projects/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ approver }),
    });
  },
  async generateDiagram(id: string): Promise<void> {
    await apiFetch(`/api/projects/${id}/diagram`, { method: "POST" });
  },
  async downloadDiagram(id: string): Promise<Blob> {
    return apiFetchBlob(`/api/projects/${id}/diagram/download`);
  },
  async listProjects(): Promise<ProjectSummary[]> {
    return apiFetch(`/api/projects`);
  },
};
