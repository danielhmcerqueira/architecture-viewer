import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { createProject } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Novo projeto — Arquiteto · iebt" },
      {
        name: "description",
        content:
          "Cole as anotações técnicas do seu projeto para estruturar a arquitetura.",
      },
    ],
  }),
  component: NewProjectPage,
});

function NewProjectPage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = notesRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [notes]);

  const { lines, chars } = useMemo(() => {
    const c = notes.length;
    const l = notes.length === 0 ? 0 : notes.split("\n").length;
    return { lines: l, chars: c };
  }, [notes]);

  const canSubmit = notes.trim().length > 0 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const { id } = await createProject({ name: "Projeto", notes });
      navigate({ to: "/project/$id/review", params: { id } });
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Hero — bloco da marca iebt */}

      <section
        className="relative overflow-hidden px-6 pb-8 pt-8 sm:pb-10 sm:pt-10"
        style={{
          background: "var(--iebt-orange)",
          color: "var(--iebt-paper)",
        }}
      >
        <PixelField />

        <div className="relative mx-auto flex max-w-3xl flex-col gap-4">

          <div>
            <h1 className="font-mono text-2xl font-bold leading-[1.1] tracking-tight sm:text-3xl">
              Um pixel por vez,{" "}
              <span className="inline-flex items-baseline gap-2">
                até a arquitetura
                <span
                  aria-hidden
                  className="inline-block h-5 w-5 translate-y-0.5 sm:h-6 sm:w-6"
                  style={{ background: "var(--iebt-ink)" }}
                />
              </span>{" "}
              inteira.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed opacity-90 sm:text-base">
              Cole suas anotações técnicas. O sistema estrutura os
              componentes, aponta conflitos e prepara o desenho — sem
              decidir por você o que ainda está incerto.
            </p>
          </div>
        </div>
      </section>

      {/* Faixa de status / rótulo */}
      <div
        className="border-y px-6 py-3"
        style={{
          background: "var(--iebt-ink)",
          borderColor: "rgba(255,255,255,0.08)",
          color: "var(--iebt-paper)",
        }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.24em] opacity-80">
          <span className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2"
              style={{ background: "var(--iebt-orange)" }}
              aria-hidden
            />
            entrada · 01
          </span>
          <span>anotações → arquitetura</span>
        </div>
      </div>

      {/* Form */}
      <section
        className="px-6 pb-20 pt-8"
        style={{ background: "var(--iebt-paper)", color: "var(--iebt-ink)" }}
      >
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8">
          <FieldBlock
            index="03"
            title="Anotações técnicas"
            meta={
              <span className="font-mono tabular-nums opacity-70">
                {lines.toString().padStart(3, "0")} L · {chars.toString().padStart(4, "0")} C
              </span>
            }
          >
            <div
              className="relative border-2"
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
              <Label htmlFor="notes" className="sr-only">
                Anotações técnicas
              </Label>
              <Textarea
                id="notes"
                ref={notesRef}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={12}
                spellCheck={false}
                placeholder={`Descreva componentes, integrações, ambientes, restrições…\nUma ideia por linha ajuda a leitura posterior.`}
                className="min-h-[280px] resize-none overflow-hidden rounded-none border-0 bg-transparent p-5 font-mono text-sm leading-6 shadow-none focus-visible:ring-0"
              />
            </div>
          </FieldBlock>

          <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md font-mono text-[11px] uppercase tracking-[0.2em] opacity-60">
              Nada é enviado até você confirmar abaixo.
            </p>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="group h-12 gap-3 rounded-none px-6 font-mono text-xs uppercase tracking-[0.24em] shadow-none transition-transform hover:translate-x-[-2px] hover:translate-y-[-2px] disabled:opacity-40"
              style={{
                background: "var(--iebt-orange)",
                color: "var(--iebt-paper)",
                boxShadow: "4px 4px 0 0 var(--iebt-ink)",
              }}
            >
              {submitting ? "Estruturando…" : "Estruturar arquitetura"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------- */

function FieldBlock({
  index,
  title,
  meta,
  children,
}: {
  index: string;
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
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
      {children}
    </div>
  );
}

function PixelMark() {
  // 3×3 pixel referenciando a identidade "um pixel por vez".
  const on = [1, 3, 4, 5, 7];
  return (
    <span
      aria-hidden
      className="inline-grid h-4 w-4 grid-cols-3 grid-rows-3 gap-[1px]"
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <span
          key={i}
          className="block"
          style={{
            background: on.includes(i) ? "var(--iebt-paper)" : "transparent",
          }}
        />
      ))}
    </span>
  );
}

function PixelField() {
  // Grade sutil de pixels que reforça o motivo da marca.
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
