# Arquiteto — Front-end

Interface web (SPA) para revisar, aprovar e baixar especificações de arquitetura geradas pelo backend Python (framework ADK).

Este repositório contém **apenas o front-end**: React + TypeScript + Vite + Tailwind + TanStack Router em modo SPA. Nenhum código de servidor, banco de dados, chave de API ou lógica de IA vive aqui.

## Rodando em desenvolvimento

```bash
bun install
cp .env.example .env      # opcional; padrão já usa mocks
bun run dev
```

A aplicação sobe em `http://localhost:8080` (ou porta indicada pelo Vite) com os mocks estáticos ligados. Não é necessário nenhum backend rodando.

## Variáveis de ambiente (BUILD TIME)

Toda variável começa com `VITE_` e é resolvida em **build time** pelo Vite — trocá-la no `.env` de um contêiner já buildado **não** tem efeito. Para mudar, gere um novo build.

| Variável             | Padrão                  | Descrição                                                   |
| -------------------- | ----------------------- | ------------------------------------------------------------|
| `VITE_API_BASE_URL`  | `http://localhost:8000` | URL base do backend real (usada quando `VITE_USE_MOCK=0`).  |
| `VITE_USE_MOCK`      | `1`                     | `1` = mocks estáticos ligados. `0` = usa a API real.        |

O `.env.example` contém a lista completa. Nenhuma outra variável, chave ou segredo é aceita ou lida pelo front.

## Rodando via Docker

Build multi-stage: `bun` gera `dist/`, o runtime é `nginx:alpine` servindo estáticos na porta 80. **Não há Node/Bun em runtime.**

```bash
# build (defina as VITE_* no momento do build)
docker build \
  --build-arg VITE_USE_MOCK=0 \
  --build-arg VITE_API_BASE_URL=https://api.seu-dominio.tld \
  -t arquiteto-web .

# run
docker run --rm -p 8080:80 arquiteto-web
```

O `nginx.conf` inclui fallback de SPA (`try_files $uri /index.html`) para que qualquer rota do TanStack Router resolva ao entrar diretamente na URL.

## Ligando o backend real

1. Suba o backend Python expondo os endpoints listados abaixo em `VITE_API_BASE_URL`.
2. Faça o build com `VITE_USE_MOCK=0`.
3. Nenhum código de tela precisa mudar — a troca acontece dentro de `src/api/` (ver comentário no topo de `src/api/adapter.ts`).

### Endpoints esperados

Todos com prefixo `${VITE_API_BASE_URL}`. Bodies em JSON, exceto o download binário.

| Método | Caminho                                     | Descrição                                                                 |
| ------ | ------------------------------------------- | ------------------------------------------------------------------------- |
| POST   | `/projects`                                 | Cria projeto. Body: `{ name, notes }`. Retorna `{ id }`.                  |
| GET    | `/projects`                                 | Lista projetos (`ProjectSummary[]`) para a tela de Histórico.             |
| GET    | `/projects/:id/architecture`                | Retorna a `ArchitectureSpec` completa do projeto.                         |
| PATCH  | `/projects/:id/architecture`                | Substitui a `ArchitectureSpec` inteira. Retorna a nova versão.            |
| POST   | `/projects/:id/approve`                     | Body: `{ approver }`. Marca o projeto como `APPROVED`.                    |
| POST   | `/api/projects/:id/diagram`                 | Dispara a geração do `.drawio`. Retorna `DiagramInfo`.                    |
| GET    | `/api/projects/:id/diagram/download`        | Devolve o binário `.drawio` (usado pelo `<a download>`).                  |
| GET    | `/api/projects/:id/events`                  | Stream **SSE** de progresso. Eventos com `data: JSON` no formato do hook. |

Os tipos exatos vivem em `src/types/architecture.ts`. O contrato de eventos SSE está documentado em `src/hooks/useProgressEvents.ts` e nas implementações de `src/api/events.real.ts` / `src/api/mock/events.mock.ts`.

## Estrutura

- `src/routes/` — telas (TanStack Router, file-based).
- `src/api/` — **única** camada de dados. Componentes importam daqui.
- `src/api/adapter.ts` — fachada de troca mock ↔ real (ver comentário no topo).
- `src/mocks/` — fixtures estáticos; nunca importados por componentes.
- `src/types/architecture.ts` — tipos do contrato com o backend.
- `src/components/` — UI reutilizável.
