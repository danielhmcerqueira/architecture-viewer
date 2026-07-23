import { CheckCircle2, HelpCircle, MinusCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { VerificationStatus } from "@/types/architecture";
import { cn } from "@/lib/utils";

const META: Record<
  VerificationStatus,
  { label: string; tooltip: string; className: string; Icon: typeof CheckCircle2 }
> = {
  verified: {
    label: "Verificado",
    tooltip: "Verificado na documentação oficial (Google).",
    className: "bg-emerald-50 text-emerald-900 border-emerald-200",
    Icon: CheckCircle2,
  },
  not_found: {
    label: "Não foi possível verificar",
    tooltip:
      "A fonte de verificação não retornou informação sobre este item. NÃO significa inválido, proibido ou inseguro — apenas que não foi possível confirmar por esta fonte.",
    className: "bg-amber-50 text-amber-900 border-amber-200",
    Icon: HelpCircle,
  },
  unavailable: {
    label: "Fonte indisponível",
    tooltip:
      "A fonte de verificação estava fora do ar no momento da consulta. Item ainda não foi verificado.",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    Icon: MinusCircle,
  },
};

export function VerificationBadge({
  status,
  className,
}: {
  status: VerificationStatus;
  className?: string;
}) {
  const meta = META[status];
  const Icon = meta.Icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
            meta.className,
            className,
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {meta.label}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        {meta.tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
