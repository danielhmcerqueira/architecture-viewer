import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { APPROVER_NAME } from "@/config";
import { projectsApi } from "@/api";
import { toast } from "sonner";
import type { ArchitectureSpec } from "@/types/architecture";

export function ApproveDialog({
  open,
  onOpenChange,
  projectId,
  isDirty,
  openGapsCount,
  onApproved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  isDirty: boolean;
  openGapsCount: number;
  onApproved: (spec: ArchitectureSpec) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function handleApprove() {
    setBusy(true);
    try {
      const spec = await projectsApi.approve(projectId, APPROVER_NAME);
      toast.success("Arquitetura aprovada.");
      onApproved(spec);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Falha ao aprovar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aprovar arquitetura</DialogTitle>
          <DialogDescription>
            Você está prestes a aprovar esta arquitetura como <strong>{APPROVER_NAME}</strong>.
            A aprovação é registrada pelo backend.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          {isDirty && (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">
              Existem edições não salvas. Salve a revisão antes de aprovar para que a aprovação
              seja aplicada sobre a versão correta.
            </p>
          )}
          {openGapsCount > 0 && (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">
              Ainda há <strong>{openGapsCount}</strong> lacuna(s) em aberto. Aprovações costumam
              ser feitas apenas após revisar cada uma.
            </p>
          )}
          <p className="text-muted-foreground">
            Essa ação não gera nem valida o arquivo de diagrama.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={handleApprove} disabled={busy || isDirty}>
            {busy ? "Aprovando..." : "Confirmar aprovação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
