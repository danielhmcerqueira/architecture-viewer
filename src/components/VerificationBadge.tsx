import { CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";
import type { VerificationStatus } from "@/types/architecture";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CFG: Record<
  VerificationStatus,
  { label: string; tooltip: string; classes: string; Icon: typeof CheckCircle2 }
> = {
  verified: {
    label: "Verificado na documentação Google",
    tooltip: "Fonte verificada com sucesso pelo backend.",
    classes:
      "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900",
    Icon: CheckCircle2,
  },
  not_found: {
    label: "Não foi possível verificar por esta fonte",
    tooltip:
      "Não encontrado NÃO significa proibido ou inseguro. Significa apenas que não foi possível verificar por esta fonte.",
    classes:
      "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900",
    Icon: AlertTriangle,
  },
  unavailable: {
    label: "Fonte de verificação indisponível",
    tooltip: "A fonte não respondeu. Nada foi verificado.",
    classes:
      "bg-muted text-muted-foreground border-border",
    Icon: HelpCircle,
  },
};

export function VerificationBadge({
  status,
  compact = false,
}: {
  status: VerificationStatus;
  compact?: boolean;
}) {
  const cfg = CFG[status];
  const Icon = cfg.Icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${cfg.classes}`}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {!compact && <span>{cfg.label}</span>}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{cfg.tooltip}</TooltipContent>
    </Tooltip>
  );
}

export function verificationLabel(status: VerificationStatus): string {
  return CFG[status].label;
}
