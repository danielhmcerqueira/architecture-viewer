// Contrato da API. O front APENAS renderiza e edita estas estruturas.
// Nunca as produz do zero, nunca deduz nenhum destes campos.

export type VerificationStatus = "verified" | "not_found" | "unavailable";
export type ProjectStatus = "DRAFT" | "READY_FOR_REVIEW" | "APPROVED";
export type Direction = "unidirectional" | "bidirectional";
export type Sync = "sync" | "async";
export type EnvironmentType = "local" | "dev" | "staging" | "production";
export type GapStatus = "open" | "resolved";

export interface Project {
  id: string;
  name: string;
  description: string;
  objective: string;
  scope: string;
  version: number;
  status: ProjectStatus;
}

export interface Component {
  id: string;
  name: string;
  category: string;
  technology: string;
  responsibility: string;
  environment: string;
  region: string;
  notes: string;
  verification_status: VerificationStatus;
  evidence_ids: string[];
}

export interface Relation {
  id: string;
  source_id: string;
  target_id: string;
  protocol: string;
  direction: Direction;
  sync: Sync;
  information_type: string;
  description: string;
}

export interface Environment {
  id: string;
  name: string;
  type: EnvironmentType;
  component_ids: string[];
}

export interface Assumption {
  id: string;
  text: string;
  origin: string;
  impact: string;
}

export interface Gap {
  id: string;
  missing_info: string;
  impact: string;
  action: string;
  status: GapStatus;
}

export interface Evidence {
  id: string;
  target_id: string;
  technology: string;
  status: VerificationStatus;
  summary: string;
  source_title: string;
  source_reference: string;
  checked_at: string;
}

export interface ArchitectureSpec {
  project: Project;
  components: Component[];
  relations: Relation[];
  environments: Environment[];
  assumptions: Assumption[];
  gaps: Gap[];
  evidence: Evidence[];
}

export interface ProjectSummary {
  id: string;
  name: string;
  version: number;
  status: ProjectStatus;
  updated_at: string;
}

export type SseEventName =
  | "INPUT_RECEIVED"
  | "STRUCTURING_STARTED"
  | "MCP_VERIFICATION_STARTED"
  | "STRUCTURING_COMPLETED"
  | "READY_FOR_REVIEW"
  | "REVISION_APPLIED"
  | "APPROVED"
  | "DIAGRAM_GENERATION_STARTED"
  | "COMPLETED"
  | "FAILED";

export interface ProgressEvent {
  name: SseEventName;
  message?: string;
  at: string; // ISO
}
