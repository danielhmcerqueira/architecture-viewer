import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { useBlocker } from "@tanstack/react-router";
import type {
  ArchitectureSpec,
  Assumption,
  Component,
  Environment,
  Relation,
} from "@/types/architecture";

type Action =
  | { type: "reset"; spec: ArchitectureSpec }
  | { type: "patchProject"; patch: Partial<ArchitectureSpec["project"]> }
  | { type: "addComponent"; item: Component }
  | { type: "updateComponent"; id: string; patch: Partial<Component> }
  | { type: "removeComponent"; id: string }
  | { type: "addRelation"; item: Relation }
  | { type: "updateRelation"; id: string; patch: Partial<Relation> }
  | { type: "removeRelation"; id: string }
  | { type: "updateEnvironment"; id: string; patch: Partial<Environment> }
  | { type: "toggleEnvComponent"; envId: string; componentId: string }
  | { type: "addAssumption"; item: Assumption }
  | { type: "updateAssumption"; id: string; patch: Partial<Assumption> }
  | { type: "removeAssumption"; id: string };

interface State {
  original: ArchitectureSpec;
  draft: ArchitectureSpec;
}

function reducer(state: State, action: Action): State {
  const d = state.draft;
  switch (action.type) {
    case "reset":
      return { original: action.spec, draft: action.spec };
    case "patchProject":
      return { ...state, draft: { ...d, project: { ...d.project, ...action.patch } } };
    case "addComponent":
      return { ...state, draft: { ...d, components: [...d.components, action.item] } };
    case "updateComponent":
      return {
        ...state,
        draft: {
          ...d,
          components: d.components.map((c) =>
            c.id === action.id ? { ...c, ...action.patch } : c,
          ),
        },
      };
    case "removeComponent":
      return {
        ...state,
        draft: {
          ...d,
          components: d.components.filter((c) => c.id !== action.id),
          environments: d.environments.map((e) => ({
            ...e,
            component_ids: e.component_ids.filter((id) => id !== action.id),
          })),
        },
      };
    case "addRelation":
      return { ...state, draft: { ...d, relations: [...d.relations, action.item] } };
    case "updateRelation":
      return {
        ...state,
        draft: {
          ...d,
          relations: d.relations.map((r) =>
            r.id === action.id ? { ...r, ...action.patch } : r,
          ),
        },
      };
    case "removeRelation":
      return {
        ...state,
        draft: { ...d, relations: d.relations.filter((r) => r.id !== action.id) },
      };
    case "updateEnvironment":
      return {
        ...state,
        draft: {
          ...d,
          environments: d.environments.map((e) =>
            e.id === action.id ? { ...e, ...action.patch } : e,
          ),
        },
      };
    case "toggleEnvComponent":
      return {
        ...state,
        draft: {
          ...d,
          environments: d.environments.map((e) => {
            if (e.id !== action.envId) return e;
            const has = e.component_ids.includes(action.componentId);
            return {
              ...e,
              component_ids: has
                ? e.component_ids.filter((id) => id !== action.componentId)
                : [...e.component_ids, action.componentId],
            };
          }),
        },
      };
    case "addAssumption":
      return { ...state, draft: { ...d, assumptions: [...d.assumptions, action.item] } };
    case "updateAssumption":
      return {
        ...state,
        draft: {
          ...d,
          assumptions: d.assumptions.map((a) =>
            a.id === action.id ? { ...a, ...action.patch } : a,
          ),
        },
      };
    case "removeAssumption":
      return {
        ...state,
        draft: { ...d, assumptions: d.assumptions.filter((a) => a.id !== action.id) },
      };
  }
}

interface Ctx {
  original: ArchitectureSpec;
  draft: ArchitectureSpec;
  dispatch: React.Dispatch<Action>;
  isDirty: boolean;
  reset: (spec: ArchitectureSpec) => void;
}

const ArchitectureDraftContext = createContext<Ctx | null>(null);

export function ArchitectureDraftProvider({
  spec,
  children,
}: {
  spec: ArchitectureSpec;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, { original: spec, draft: spec });

  // Sincroniza quando a fonte muda (após save/approve retornar nova spec).
  const lastSpec = useRef(spec);
  useEffect(() => {
    if (lastSpec.current !== spec) {
      lastSpec.current = spec;
      dispatch({ type: "reset", spec });
    }
  }, [spec]);

  const isDirty = useMemo(
    () => JSON.stringify(state.draft) !== JSON.stringify(state.original),
    [state.draft, state.original],
  );

  // Aviso ao fechar aba.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Guarda de navegação interna.
  useBlocker({
    shouldBlockFn: () => {
      if (!isDirty) return false;
      return !window.confirm(
        "Você tem alterações não salvas. Deseja sair e perder as alterações?",
      );
    },
    enableBeforeUnload: false,
  });

  const value = useMemo<Ctx>(
    () => ({
      original: state.original,
      draft: state.draft,
      dispatch,
      isDirty,
      reset: (s) => dispatch({ type: "reset", spec: s }),
    }),
    [state, isDirty],
  );

  return (
    <ArchitectureDraftContext.Provider value={value}>
      {children}
    </ArchitectureDraftContext.Provider>
  );
}

export function useArchitectureDraft(): Ctx {
  const ctx = useContext(ArchitectureDraftContext);
  if (!ctx)
    throw new Error("useArchitectureDraft precisa estar dentro do provider.");
  return ctx;
}

export function newLocalId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
