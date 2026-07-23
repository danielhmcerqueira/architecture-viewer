import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { createProject } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Novo projeto — Arquiteto" },
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
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  // Cresce a textarea conforme o conteúdo, respeitando o mínimo do CSS.
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

  const canSubmit = name.trim().length > 0 && notes.trim().length > 0 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const { id } = await createProject({ name: name.trim(), notes });
      navigate({ to: "/project/$id/review", params: { id } });
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Novo projeto</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cole abaixo as anotações técnicas do sistema. Elas podem estar
          incompletas ou conter contradições — o sistema vai apontar conflitos
          em vez de escolher sozinho.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome do projeto</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Plataforma de Pedidos B2B"
            autoComplete="off"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="notes">Anotações técnicas</Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {lines} linha{lines === 1 ? "" : "s"} · {chars} caractere
              {chars === 1 ? "" : "s"}
            </span>
          </div>
          <Textarea
            id="notes"
            ref={notesRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={12}
            spellCheck={false}
            placeholder={`Descreva componentes, integrações, ambientes, restrições…\nUma ideia por linha ajuda a leitura posterior.`}
            className="min-h-[260px] resize-none overflow-hidden font-mono text-sm leading-6"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button type="submit" disabled={!canSubmit}>
            {submitting ? "Estruturando…" : "Estruturar arquitetura"}
          </Button>
        </div>
      </form>
    </div>
  );
}
