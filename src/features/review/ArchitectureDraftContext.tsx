import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import type {
  ArchitectureSpec,
  Assumption,
  Component,
  Environment,
  Evidence,
  Gap,
  Relation,
} from "@/types/architecture";

type Action =
  | { type: "reset"; spec: ArchitectureSpec }
  | { type: "patchProject"; patch: Partial<ArchitectureSpec["project"]> }
  | { type: "upsertComponent"; component: Component }
  | { type: "removeComponent"; id: string }
  | { type: "upsertRelation"; relation: Relation }
  | { type: "removeRelation"; id: string }
  | { type: "upsertEnvironment"; env: Environment }
  | { type: "removeEnvironment"; id: string }
  | { type: "upsertAssumption"; item: Assumption }
  | { type: "removeAssumption"; id: string }
  | { type: "upsertGap"; item: Gap }
  | { type: "removeGap"; id: string }
  | { type: "upsertEvidence"; item: Evidence }
  | { type: "removeEvidence"; id: string };

interface State {
  original: ArchitectureSpec;
  draft: ArchitectureSpec;
}

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [...list, item];
  const copy = list.slice();
  copy[i] = item;
  return copy;
}

function remove<T extends { id: string }>(list: T[], id: string): T[] {
  return list.filter((x) => x.id !== id);
}

function reducer(state: State, action: Action): State {
  const d = state.draft;
  switch (action.type) {
    case "reset":
      return { original: action.spec, draft: structuredClone(action.spec) };
    case "patchProject":
      return { ...state, draft: { ...d, project: { ...d.project, ...action.patch } } };
    case "upsertComponent":
      return { ...state, draft: { ...d, components: upsert(d.components, action.component) } };
    case "removeComponent":
      return { ...state, draft: { ...d, components: remove(d.components, action.id) } };
    case "upsertRelation":
      return { ...state, draft: { ...d, relations: upsert(d.relations, action.relation) } };
    case "removeRelation":
      return { ...state, draft: { ...d, relations: remove(d.relations, action.id) } };
    case "upsertEnvironment":
      return { ...state, draft: { ...d, environments: upsert(d.environments, action.env) } };
    case "removeEnvironment":
      return { ...state, draft: { ...d, environments: remove(d.environments, action.id) } };
    case "upsertAssumption":
      return { ...state, draft: { ...d, assumptions: upsert(d.assumptions, action.item) } };
    case "removeAssumption":
      return { ...state, draft: { ...d, assumptions: remove(d.assumptions, action.id) } };
    case "upsertGap":
      return { ...state, draft: { ...d, gaps: upsert(d.gaps, action.item) } };
    case "removeGap":
      return { ...state, draft: { ...d, gaps: remove(d.gaps, action.id) } };
    case "upsertEvidence":
      return { ...state, draft: { ...d, evidence: upsert(d.evidence, action.item) } };
    case "removeEvidence":
      return { ...state, draft: { ...d, evidence: remove(d.evidence, action.id) } };
    default:
      return state;
  }
}

interface Ctx {
  draft: ArchitectureSpec;
  original: ArchitectureSpec;
  isDirty: boolean;
  dispatch: React.Dispatch<Action>;
}

const DraftContext = createContext<Ctx | null>(null);

export function ArchitectureDraftProvider({
  spec,
  children,
}: {
  spec: ArchitectureSpec;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    original: spec,
    draft: structuredClone(spec),
  }));

  // Reinicializa quando o servidor devolve uma nova versão.
  const value = useMemo<Ctx>(() => {
    const isDirty = JSON.stringify(state.draft) !== JSON.stringify(state.original);
    return { draft: state.draft, original: state.original, isDirty, dispatch };
  }, [state]);

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useArchitectureDraft(): Ctx {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error("useArchitectureDraft fora do provider");
  return ctx;
}

export function resetDraft(dispatch: React.Dispatch<Action>, spec: ArchitectureSpec) {
  dispatch({ type: "reset", spec });
}
