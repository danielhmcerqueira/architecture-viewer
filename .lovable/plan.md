# Plano de implementação — Front-end (SPA pura)

Stack final: TanStack Router em modo SPA (sem SSR, sem server functions, sem `src/routes/api/`), Vite, React, TypeScript, Tailwind. Zero código de servidor, zero IA, zero XML, zero banco. Todo dado começa mockado em `src/mocks/`, atrás da camada `src/api/`.

---

## Bloco 0 — Limpeza do template e bootstrap SPA

**Objetivo:** deixar o projeto rodando como SPA pura antes de qualquer feature.

- Alterar: `vite.config.ts` (remover plugin de start/SSR, manter só router + react), `src/router.tsx`, `src/routes/__root.tsx` (sem `shellComponent`, sem `HeadContent`/`Scripts`; virar layout normal), `src/routes/index.tsx` (limpar placeholder).
- Remover: `src/server.ts`, `src/start.ts`, qualquer referência a `createServerFn`, `HeadContent`, `Scripts`, `shellComponent`.
- Criar: `index.html` + `src/main.tsx` montando `<RouterProvider>`; `src/config.ts` com `APPROVER_NAME` e `API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"`; `.env.example` só com `VITE_API_BASE_URL`.
- Testável: `bun run dev` abre `/` sem erro de SSR; `bun run build` gera `dist/` estático que pode ser servido por Nginx; `import.meta.env.VITE_API_BASE_URL` acessível.
- Dependências novas: nenhuma (remove `@tanstack/react-start`).

## Bloco 1 — Tipos do contrato (Architecture Specification)

**Objetivo:** ter o contrato da API tipado num único lugar.

- Criar: `src/types/architecture.ts` com `Project`, `Component`, `Relation`, `Environment`, `Assumption`, `Gap`, `Evidence`, `ArchitectureSpec`, `VerificationStatus = "verified" | "not_found" | "unavailable"`, `ProjectStatus`, `SseEventName` (union das 10 strings).
- Testável: `tsgo` passa; nenhum outro arquivo importa esses tipos ainda.
- Dependências: nenhuma.

## Bloco 2 — Camada de dados trocável (`src/api/` + `src/mocks/`)

**Objetivo:** única fronteira que conhece `fetch`. Trocar mock por real = mudar um arquivo.

Estrutura:

```
src/api/
  client.ts          # wrapper fino sobre fetch (baseUrl, JSON, erros tipados)
  projects.ts        # createProject, sendInput, triggerStructuring, getArchitecture,
                     # patchArchitecture, approve, generateDiagram, downloadDiagram, listProjects
  events.ts          # subscribeProgress(projectId, onEvent) → () => void  (EventSource real)
  index.ts           # re-export do "adapter" ativo
  mock/
    projects.ts      # mesma assinatura de projects.ts, servida de src/mocks/
    events.ts        # mesma assinatura de events.ts, com timers
  adapter.ts         # escolhe real vs mock via VITE_USE_MOCK ("1" default por enquanto)
src/mocks/
  architecture.sample.ts   # ArchitectureSpec completo, com casos verified/not_found/unavailable, gaps abertos, evidências
  projects.sample.ts       # lista para /history
```

- Regra: **nenhum componente importa de `src/api/mock/*` ou `src/mocks/***` — só de `src/api`.
- Testável: um script/rota de debug consegue chamar `getArchitecture("p1")` e receber o mock. Trocar `VITE_USE_MOCK=0` faz o mesmo call bater em `fetch(API_BASE_URL + ...)`.
- Dependências: nenhuma.

## Bloco 3 — Hook de SSE (`useProgressEvents`)

**Objetivo:** encapsular streaming de progresso; mesmo hook serve mock e real.

- Criar: `src/hooks/useProgressEvents.ts`. Recebe `projectId`, retorna `{ events, lastEvent, status }`. Internamente chama `api.events.subscribeProgress` e faz cleanup no unmount.
- Mock (`src/api/mock/events.ts`): dispara em timers a sequência `INPUT_RECEIVED → STRUCTURING_STARTED → MCP_VERIFICATION_STARTED → STRUCTURING_COMPLETED → READY_FOR_REVIEW` (e depois, conforme a tela: `APPROVED`, `DIAGRAM_GENERATION_STARTED`, `COMPLETED`).
- Real: `new EventSource(...)` conectado a `/api/projects/{id}/events`.
- Testável: uma página de sandbox (`/dev/sse`, só em dev) monta o hook e lista os eventos recebidos; ordem e cleanup funcionam.
- Dependências: nenhuma.

## Bloco 4 — Design system mínimo e primitivos de UI

**Objetivo:** base visual sóbria antes de montar telas.

- Alterar: `src/styles.css` — paleta neutra fria (fundo claro, uma cor de destaque fria), tokens semânticos para `verified` (verde), `not_found` (âmbar) e `unavailable` (cinza). Sem gradientes.
- Criar em `src/components/ui/`: `Button`, `Input`, `Textarea`, `Card`, `Badge`, `Table`, `Modal`, `Tooltip`, `Tabs`, `Alert`, `Skeleton`. Podem ser shadcn ou hand-rolled minimalistas — o que o template já oferece decide.
- Criar: `src/components/VerificationBadge.tsx` recebendo `VerificationStatus` e renderizando **cor + rótulo textual explícito** ("Verificado", "Não foi possível verificar", "Fonte indisponível") + tooltip com o significado longo. Nunca só cor.
- Criar: `src/components/AppShell.tsx` (header com link para `/` e `/history`, área de `<Outlet />`).
- Testável: página de sandbox `/dev/ui` renderiza cada primitivo e os 3 badges lado a lado, com textos legíveis.
- Dependências novas: possivelmente `class-variance-authority` / `@radix-ui/*` se optarmos por shadcn (a confirmar antes de instalar).

## Bloco 5 — Rota `/` (Novo projeto)

- Criar: `src/routes/index.tsx` = form com nome + textarea grande do texto de entrada + botão "Criar projeto".
- Fluxo: `createProject` → `sendInput` → `triggerStructuring` → `navigate("/project/:id/review")`.
- Testável: com mock, submeter o form leva à tela de revisão populada com `architecture.sample.ts`.
- Dependências novas: `react-hook-form` + `zod` (apenas UI/forms, dentro do que o Knowledge permite).

## Bloco 6 — Rota `/project/:id/review` (revisão e aprovação)

Tela mais complexa; quebrada em componentes pequenos e independentes. Todos recebem `value` + `onChange` e operam sobre um **rascunho local** (`useReducer` sobre `ArchitectureSpec`); só o botão **"Salvar revisão"** dispara `PATCH /architecture`. A aprovação é botão separado.

- Criar `src/routes/project.$id.review.tsx` com layout em abas: Visão geral · Componentes · Relações · Ambientes · Premissas · Lacunas · Evidências.
- Criar em `src/features/review/`:
  - `ArchitectureDraftContext.tsx` — provê rascunho + `dispatch` + flag `isDirty`.
  - `ProjectHeader.tsx` — nome, descrição, versão (só leitura, com aviso "editar gera nova revisão"), status.
  - `ComponentsTable.tsx` + `ComponentRowEditor.tsx` — tabela densa, editar inline; coluna de verificação usa `VerificationBadge`.
  - `RelationsTable.tsx` + `RelationRowEditor.tsx`.
  - `EnvironmentsPanel.tsx`.
  - `AssumptionsList.tsx`.
  - `GapsPanel.tsx` — destaca lacunas abertas; **apenas apresenta**, nunca "resolve" sozinho.
  - `EvidenceList.tsx` — agrupada por `target_id`; badge de status.
  - `ProgressStrip.tsx` — usa `useProgressEvents` para mostrar o último evento.
  - `SaveRevisionBar.tsx` — botão "Salvar revisão" (habilitado se `isDirty`) + botão "Aprovar arquitetura" (abre `ApproveDialog`).
  - `ApproveDialog.tsx` — modal de confirmação; ao confirmar chama `api.projects.approve(id, { approver: APPROVER_NAME })`. Só depois de `APPROVED` o botão "Ir para geração" fica habilitado.
- Regra dura: aprovação **não** é inferida de navegação/edição. Botão "Gerar arquivo" fica desabilitado até `status === "APPROVED"`.
- Testável, incrementalmente:
  1. Renderiza mock read-only (sem edição).
  2. Edição local reflete no rascunho, `isDirty` acende.
  3. "Salvar revisão" chama `patchArchitecture` do mock e recarrega a árvore.
  4. Modal de aprovação chama `approve` e habilita o botão de gerar.
- Dependências: nenhuma além do bloco 5.

## Bloco 7 — Rota `/project/:id/diagram`

- Criar: `src/routes/project.$id.diagram.tsx`.
- Fluxo: botão "Gerar arquivo" → `POST /diagram` → `useProgressEvents` mostra `DIAGRAM_GENERATION_STARTED → COMPLETED` → botão "Baixar" habilita e chama `downloadDiagram` (que retorna bytes/URL; front só faz `<a download>`).
- Aviso obrigatório em destaque: **"Abra o arquivo e confira. Esta versão não valida o conteúdo gerado."**
- Testável: com mock, sequência dispara os eventos e o botão "Baixar" fica clicável (mock devolve um `Blob` fake).
- Dependências: nenhuma.

## Bloco 8 — Rota `/history`

- Criar: `src/routes/history.tsx` — tabela: nome, id, última versão, status; linha clica em `/project/:id/review`.
- Fonte: `api.projects.list()` → `projects.sample.ts` no mock.
- Testável: lista carrega, navegação funciona.
- Dependências: nenhuma.

## Bloco 9 — Polimento e handoff Docker

- Criar: `Dockerfile` (build multi-stage: `bun install && bun run build` → `nginx:alpine` servindo `dist/`), `nginx.conf` com fallback SPA (`try_files $uri /index.html`), `README` explicando `VITE_API_BASE_URL` no build.
- Estados de erro/loading em cada rota, `notFoundComponent` do `__root`, `errorComponent` global.
- Testável: `docker build && docker run -p 8080:80` serve a SPA; deep link `/history` funciona sem 404.
- Dependências: nenhuma.

---

## Como comunicar `verified / not_found / unavailable` sem induzir ao erro

- Sempre **texto + cor + ícone**, nunca só cor.
- Rótulos fixos: "Verificado na documentação Google" · "Não foi possível verificar por esta fonte (não significa inválido)" · "Fonte de verificação indisponível no momento".
- Ordenação e filtro por status na tabela de componentes, mas sem esconder `not_found`/`unavailable`.
- `GapsPanel` e `EvidenceList` mostram o motivo bruto vindo da API; front não interpreta.
- Nenhum lugar da UI usa palavras como "reprovado", "inválido", "inseguro" para `not_found`.

---

## Respostas às perguntas finais

**Por onde começaria:** Bloco 0 (bootstrap SPA) seguido imediatamente do Bloco 2 (camada de dados + mocks). Sem SPA limpa, todo o resto herda ruído de SSR; sem camada de dados trocável, as telas nascem acopladas a `fetch` e a promessa "trocar mock por real = um arquivo" morre.

**Decisões difíceis de reverter:**

- Migrar de TanStack Start para TanStack Router SPA (bloco 0) — mexe em bootstrap, `routeTree.gen`, config do Vite.
- Formato do `ArchitectureSpec` em TS (bloco 1) — vira dependência de dezenas de componentes; renomear campo depois é caro.
- Assinatura de `src/api/*` (bloco 2) — se as telas passarem a depender de shapes específicos de retorno, trocar mock↔real fica arriscado.
- Modelo "rascunho local + Salvar revisão" (bloco 6) — mudar para autosave depois exige refatorar todo o estado da tela de revisão.

**Ambíguo / faltando no Knowledge:**

- Shape dos payloads de request (não só das responses): o que exatamente vai no body de `POST /input`, `PATCH /architecture` (diff? doc inteiro?), `POST /approve` (só nome do aprovador? timestamp?).
- Formato de resposta de `POST /diagram/download`: binário direto? URL assinada? Content-Type esperado?
- Como criar projeto — `POST /projects` recebe `{name, description}`? devolve `{id}`?
- Autenticação/headers para chamar a API em produção (mesmo sem login de usuário, o backend pode exigir um header fixo).
- Comportamento do SSE em reconexão (retry? last-event-id?).
- Se `PATCH /architecture` retorna o doc já com nova `version` incrementada (imagino que sim, mas convém confirmar).
- Como o `id` do projeto entra na URL antes do backend existir — no mock uso um id fixo `"mock-project"`?

**Onde senti vontade de cruzar a fronteira (e não cruzei):**

- No hook de SSE mock (bloco 3), seria natural "simular o backend processando" com uma máquina de estados que decide quando emitir cada evento — isso vira lógica de negócio disfarçada. Vou manter o mock burro: sequência fixa em timers, sem ramificações.
- Na tela de revisão (bloco 6), tive vontade de validar client-side coisas como "toda relação precisa ter `source_id` e `target_id` existentes na lista de componentes". Isso é regra de negócio e é do backend. Só valido tipos de formulário (campo obrigatório, número onde é número).
- Na tela de diagrama (bloco 7), pensei em "pré-visualizar" o `.drawio`. Isso exigiria parsear XML — proibido. Só ofereço download.
- Ao mockar evidências, pensei em gerar `summary` sintético para cada componente sem evidência. Isso é o backend inventando — mantenho `evidence: []` quando o mock não tem.

Se algum desses instintos for na verdade desejável, me avise antes de eu implementar os blocos correspondentes.  
  
**1. As lacunas não podem viver atrás de uma aba.** Essa é a mais séria. A regra do v5 é que lacunas sejam *visíveis*, e o modo de falha é justamente aprovar uma arquitetura sem nunca ter olhado para elas. O `ApproveDialog` contando as abertas ajuda, mas chega tarde. Peça: badge com a contagem na aba "Lacunas" + um alerta persistente na aba "Visão geral" quando houver alguma `open`.

**2. O mock de SSE precisa dos cenários.** O plano tem só o caminho feliz rápido. Sem `slow`, você não testa o que o SSE existe para resolver. Detalho abaixo, porque eles perguntaram sobre isso.

**3. `VITE_USE_MOCK` contradiz a regra 9 do Knowledge** ("a única variável permitida é `VITE_API_BASE_URL`). O desvio é benigno — não é segredo, é chave de build —, então **aprove**, mas atualize a regra para "nenhuma variável que contenha segredo, chave ou token". Senão o prompt de auditoria vai acusar isso como violação lá na frente.

**4. Componente novo precisa nascer `unavailable`.** O `ComponentRowEditor` não diz de onde vem o `verification_status` ao adicionar. Se ficar em aberto, o front pode acabar marcando algo como verificado — o que só o backend pode fazer.

**5. O botão "Solicitar nova verificação" não tem endpoint.** Erro meu: pus no Prompt 4, mas a lista de endpoints do v5 não tem `/verify`. Eles silenciosamente omitiram. Decida: ou o botão mapeia para `POST /structure`, ou some. Eu tiraria — reestruturar já cobre o caso.

Falta também o **guarda de navegação** para edições não salvas (com rascunho local, sair da tela perde tudo) e o **prompt de auditoria** antes do Bloco 9.