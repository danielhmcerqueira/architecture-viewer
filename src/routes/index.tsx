import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { projectsApi } from "@/api";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Novo projeto — Architecture Console" },
      {
        name: "description",
        content: "Descreva um novo projeto para o backend estruturar a arquitetura.",
      },
    ],
  }),
  component: NewProjectPage,
});

function NewProjectPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !text.trim()) {
      toast.error("Preencha o nome do projeto e o texto de entrada.");
      return;
    }
    setSubmitting(true);
    try {
      const { id } = await projectsApi.createProject({ name: name.trim(), description: description.trim() });
      await projectsApi.sendInput(id, text);
      await projectsApi.triggerStructuring(id);
      navigate({ to: "/project/$id/review", params: { id } });
    } catch (err) {
      console.error(err);
      toast.error("Falha ao criar o projeto.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Novo projeto</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Descreva o sistema a ser modelado. O backend estrutura e devolve uma proposta de arquitetura
        para você revisar e aprovar.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Entrada</CardTitle>
          <CardDescription>Nome, descrição curta e texto livre com o contexto do projeto.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome do projeto</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Plataforma de Pedidos" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc">Descrição curta (opcional)</Label>
              <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Uma frase sobre o objetivo do projeto" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="text">Texto de entrada</Label>
              <Textarea
                id="text"
                rows={12}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Cole aqui a descrição completa do sistema, requisitos, integrações conhecidas, restrições..."
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Enviando..." : "Criar projeto"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
