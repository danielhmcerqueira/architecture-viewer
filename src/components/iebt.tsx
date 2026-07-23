import type { ReactNode } from "react";

/**
 * Peças visuais reutilizáveis do idioma "iebt · arquiteto".
 * A tela / (index.tsx) define o vocabulário original e mantém as
 * variantes inline; aqui centralizamos o suficiente para replicar
 * o mesmo tratamento nas telas de Histórico, Revisão e Diagrama sem
 * duplicar decisões de design.
 */

export function PixelMark({
  color = "var(--iebt-paper)",
  size = 16,
}: {
  color?: string;
  size?: number;
}) {
  const on = [1, 3, 4, 5, 7];
  return (
    <span
      aria-hidden
      className="inline-grid grid-cols-3 grid-rows-3 gap-[1px]"
      style={{ width: size, height: size }}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <span
          key={i}
          className="block"
          style={{ background: on.includes(i) ? color : "transparent" }}
        />
      ))}
    </span>
  );
}

export function PixelField() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.14]"
      style={{
        backgroundImage:
          "linear-gradient(var(--iebt-ink) 1px, transparent 1px), linear-gradient(90deg, var(--iebt-ink) 1px, transparent 1px)",
        backgroundSize: "14px 14px",
        maskImage:
          "radial-gradient(ellipse at 80% 20%, black 0%, transparent 70%)",
      }}
    />
  );
}

/**
 * Faixa laranja de topo com o mesmo lockup ("iebt innovation · arquiteto"),
 * um índice numérico (ex.: "/04"), um título grande em mono e um resumo.
 */
export function PageHero({
  index,
  eyebrow = "arquiteto",
  title,
  description,
  actions,
}: {
  index: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section
      className="relative overflow-hidden px-6 pb-8 pt-8 sm:pb-10 sm:pt-10"
      style={{
        background: "var(--iebt-orange)",
        color: "var(--iebt-paper)",
      }}
    >
      <PixelField />
      <div className="relative mx-auto flex max-w-5xl flex-col gap-4">
        <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] opacity-90">
          <PixelMark />
          <span>iebt innovation</span>
          <span aria-hidden className="h-px w-8 bg-current opacity-40" />
          <span>{eyebrow}</span>
          <span aria-hidden className="h-px w-8 bg-current opacity-40" />
          <span className="font-mono">{index}</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="font-mono text-2xl font-bold leading-[1.1] tracking-tight sm:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="mt-3 text-sm leading-relaxed opacity-90 sm:text-[15px]">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Faixa preta abaixo do hero com rótulo de contexto em mono/uppercase e
 * pixel laranja — ecoa o "/01 entrada" do form da home.
 */
export function StatusStrip({
  left,
  right,
}: {
  left: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div
      className="border-y px-6 py-3"
      style={{
        background: "var(--iebt-ink)",
        borderColor: "rgba(255,255,255,0.08)",
        color: "var(--iebt-paper)",
      }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.24em] opacity-80">
        <span className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2"
            style={{ background: "var(--iebt-orange)" }}
            aria-hidden
          />
          {left}
        </span>
        {right && <span>{right}</span>}
      </div>
    </div>
  );
}

/**
 * Cabeçalho de seção interno ao conteúdo (paper): "/NN · TÍTULO".
 * Espelha o FieldBlock da home.
 */
export function SectionLabel({
  index,
  title,
  meta,
}: {
  index: string;
  title: string;
  meta?: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <div className="flex items-baseline gap-3">
        <span
          className="font-mono text-[11px] tracking-[0.24em] opacity-60"
          style={{ color: "var(--iebt-orange-deep)" }}
        >
          /{index}
        </span>
        <span className="font-mono text-[13px] uppercase tracking-[0.18em]">
          {title}
        </span>
      </div>
      {meta}
    </div>
  );
}

/**
 * Card "paper": fundo branco, borda ink sólida 2px, cantos retos e
 * dois pixels laranja nos vértices — mesma linguagem da textarea.
 */
export function PaperCard({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return (
    <Tag
      className={`relative border-2 ${className}`}
      style={{ borderColor: "var(--iebt-ink)", background: "#fff" }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -left-[6px] -top-[6px] h-3 w-3"
        style={{ background: "var(--iebt-orange)" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-[6px] -right-[6px] h-3 w-3"
        style={{ background: "var(--iebt-orange)" }}
      />
      {children}
    </Tag>
  );
}

/**
 * Botão primário laranja neobrutalista (mesmo do "Estruturar arquitetura").
 * Aplicado como classe utilitária para reuso em <Button> shadcn ou <a>.
 */
export const iebtPrimaryButtonClass =
  "h-11 gap-2 rounded-none px-5 font-mono text-[11px] uppercase tracking-[0.24em] shadow-none transition-transform hover:translate-x-[-2px] hover:translate-y-[-2px] disabled:opacity-40";

export const iebtPrimaryButtonStyle: React.CSSProperties = {
  background: "var(--iebt-orange)",
  color: "var(--iebt-paper)",
  boxShadow: "4px 4px 0 0 var(--iebt-ink)",
};

export const iebtOutlineButtonClass =
  "h-11 gap-2 rounded-none px-5 font-mono text-[11px] uppercase tracking-[0.24em] shadow-none transition-transform hover:translate-x-[-2px] hover:translate-y-[-2px] disabled:opacity-40";

export const iebtOutlineButtonStyle: React.CSSProperties = {
  background: "#fff",
  color: "var(--iebt-ink)",
  boxShadow: "4px 4px 0 0 var(--iebt-ink)",
  border: "2px solid var(--iebt-ink)",
};
