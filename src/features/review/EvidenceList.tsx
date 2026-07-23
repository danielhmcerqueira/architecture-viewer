import { useArchitectureDraft } from "./ArchitectureDraftContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VerificationBadge } from "@/components/VerificationBadge";

export function EvidenceList() {
  const { draft } = useArchitectureDraft();
  const componentById = new Map(draft.components.map((c) => [c.id, c.name]));

  const groups = new Map<string, typeof draft.evidence>();
  for (const e of draft.evidence) {
    const list = groups.get(e.target_id) ?? [];
    list.push(e);
    groups.set(e.target_id, list);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evidências</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Evidências vêm do backend. O front apenas exibe — não interpreta nem valida.
        </p>
        {groups.size === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma evidência coletada.</p>
        )}
        {Array.from(groups.entries()).map(([targetId, list]) => (
          <div key={targetId} className="rounded-md border border-border p-4">
            <h3 className="text-sm font-semibold">
              {componentById.get(targetId) ?? targetId}
            </h3>
            <ul className="mt-2 space-y-3">
              {list.map((e) => (
                <li key={e.id} className="rounded border border-border/60 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{e.technology}</span>
                    <VerificationBadge status={e.status} />
                  </div>
                  <p className="mt-1 text-muted-foreground">{e.summary}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{e.source_title}</span>
                    <span>·</span>
                    <a
                      href={e.source_reference}
                      target="_blank"
                      rel="noreferrer"
                      className="underline-offset-4 hover:underline"
                    >
                      {e.source_reference}
                    </a>
                    <span>·</span>
                    <span>Verificado em {new Date(e.checked_at).toLocaleString("pt-BR")}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
