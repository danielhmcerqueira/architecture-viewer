# Auditoria — Complemento

## 1. `vite.config.ts` plugin por plugin

Conteúdo real do arquivo (10 linhas úteis):

```ts
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" }, // aponta para src/server.ts (wrapper SSR)
  },
});
```

Não há nenhum `plugins: [...]` explícito. Todos os plugins são injetados pelo preset `@lovable.dev/vite-tanstack-config`. O comentário no topo do arquivo (colocado pelo template) lista o que o preset registra internamente:

| Plugin/feature injetado pelo preset | Papel | Necessário em SPA pura? |
| --- | --- | --- |
| `tanstackStart` (do `@tanstack/react-start/plugin`) | Bundle SSR, server-entry virtual, roteamento server-side, `HeadContent/Scripts` | **Não** — é a espinha do SSR |
| `nitro` (build-only, target Cloudflare) | Empacota o Worker de produção | **Não** — só existe para produzir o servidor |
| `viteReact` (`@vitejs/plugin-react`) | JSX/Fast Refresh | **Sim** |
| `tailwindcss` (`@tailwindcss/vite`) | Tailwind v4 | **Sim** |
| `tsConfigPaths` (`vite-tsconfig-paths`) | Resolve `@/*` do tsconfig | **Sim** |
| Alias `@` + dedupe `react`/`@tanstack/*` | Estabilidade de bundle | **Sim** (pode ser reescrito à mão) |
| Injeção de `VITE_*` env | Substituir `import.meta.env.VITE_*` em build | **Sim** (Vite já faz nativo; o preset só formaliza) |
| Sandbox detection (port/host/strictPort) | Ajusta `server.port`/`host` para o preview do Lovable | **Sim** para rodar dentro do sandbox |
| TanStack devtools (dev-only) | Overlay de rotas em dev | Opcional |
| `@lovable.dev/vite-plugin-dev-server-bridge` / `hmr-gate` | Integração HMR com o preview | **Sim** para dev no sandbox |
| Plugins de error logger | Enviam erros para o painel do Lovable | Opcional |
| **Faltando** para SPA: `@tanstack/router-plugin/vite` (`TanStackRouterVite`) | Gera `src/routeTree.gen.ts` a partir de `src/routes/` | **Sim** (hoje quem gera isso é o `tanstackStart`; ver §3) |

Bottom line: dos itens injetados, apenas `viteReact`, `tailwindcss`, `tsConfigPaths`, alias/dedupe, injeção de env e as pontes de sandbox são necessários para SPA. `tanstackStart` e `nitro` são SSR.

## 2. `index.html` e `src/main.tsx`

- `index.html` na raiz: **não existe**.
- `src/main.tsx`: **não existe**.
- Também não há `entry-client.tsx` nem `entry-server.tsx` (bem — a doc do Start proíbe criá-los à mão).

Confirmação: **hoje o app sobe exclusivamente pelo server entry do TanStack Start** (`src/server.ts` → `@tanstack/react-start/server-entry`). O HTML é montado pelo `RootShell` (`src/routes/__root.tsx`) via `HeadContent`/`Scripts`. Para virar SPA pura será preciso criar `index.html` (com `<div id="root">` e `<script type="module" src="/src/main.tsx">`) e um `src/main.tsx` que faça `createRouter(...) + RouterProvider` — mais remover o `shellComponent`, `HeadContent` e `Scripts` do `__root.tsx`.

## 3. O que faz `@lovable.dev/vite-tanstack-config`

Do `package.json` do próprio pacote:

- `main`: `./dist/index.cjs`, `module`: `./dist/index.js` — exporta um `defineConfig` que envolve o `defineConfig` do Vite.
- Dependências: `@lovable.dev/vite-plugin-dev-server-bridge`, `@lovable.dev/vite-plugin-hmr-gate`, `@tanstack/devtools-vite`, `lightningcss`.
- Peer deps obrigatórias: `vite`, `@tailwindcss/vite`, `vite-tsconfig-paths`, **`nitro`**, **`@tanstack/react-start`**.

Em linguagem clara: é um preset opinado que instala plugins do TanStack Start + Nitro + Tailwind + tsconfig-paths + pontes de sandbox do Lovable, tudo em um só `defineConfig`. Ele **assume SSR** (peer deps de `nitro` e `@tanstack/react-start`).

Removível sem quebrar? **Sim, mas exige reescrever `vite.config.ts` do zero** com os plugins que a SPA de fato precisa. Não dá para tirar o preset e deixar o arquivo como está — o `defineConfig` importado some. Uma config SPA equivalente ficaria mais ou menos:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: { host: "::", port: 8080, strictPort: true },
});
```

E ainda perderíamos as pontes HMR do sandbox do Lovable (`dev-server-bridge`, `hmr-gate`) — que são úteis para o preview do próprio Lovable. Precisamos avaliar se dá para reinstalar apenas esses dois plugins avulsos ou se o preview do Lovable continua funcionando sem eles.

## 4. Formulário da rota `/` usa react-hook-form? Tem validação?

Não. O `src/routes/index.tsx` faz o form "na mão":

- `const [name, setName] = useState("");`
- `const [notes, setNotes] = useState("");`
- `const [submitting, setSubmitting] = useState(false);`
- Único gate: `canSubmit = name.trim().length > 0 && notes.trim().length > 0 && !submitting;` (linha 45).
- `handleSubmit`: `e.preventDefault()` → `if (!canSubmit) return` → `createProject({ name: name.trim(), notes })` → `navigate({ to: "/project/$id/review", ... })`.

Nenhum `useForm`, nenhum `zodResolver`, nenhum schema. A única "validação" é "não pode estar vazio". Nada de tamanho mínimo, limite máximo, feedback de erro por campo, `aria-invalid`, etc. `zod` continua no `package.json` sem uma única linha usando (0 ocorrências de `z.`/`zod` em `src/`). `react-hook-form` também está instalado e igualmente não é importado por nenhum arquivo do produto.

Ou seja: **o form ficou sem validação de verdade**, e as duas libs (`react-hook-form`, `zod`) são código morto hoje.

## Correção da recomendação anterior sobre `@tanstack/router-plugin`

Você está certo. No relatório anterior eu listei `@tanstack/router-plugin` junto com `@tanstack/react-start` como "SSR". **Isso está errado.**

- `@tanstack/router-plugin` (o `TanStackRouterVite`) é o plugin do TanStack **Router** — não do Start. Ele varre `src/routes/`, gera `src/routeTree.gen.ts` e faz code-splitting das rotas. Funciona igual em SSR e em SPA e é **obrigatório** para file-based routing.
- `@tanstack/react-start` é o pacote SSR (server entry, `createServerFn`, `HeadContent`, `Scripts`, etc.). Esse sim é para remover ao migrar para SPA.

Hoje o preset `@lovable.dev/vite-tanstack-config` provavelmente já injeta o `TanStackRouterVite` (o `tanstackStart` plugin depende dele internamente para gerar o route tree). Se sairmos do preset, teremos de adicioná-lo explicitamente no `vite.config.ts` (como no snippet do §3). **Manter `@tanstack/router-plugin` como dependência é correto e necessário.**

## Resumo do que faltava

- vite.config.ts é 100% dependente do preset SSR do Lovable; não há `plugins: []` local.
- Não há `index.html` nem `src/main.tsx` — a app só sobe via `src/server.ts` hoje.
- `@lovable.dev/vite-tanstack-config` é um wrapper de `defineConfig` com peer deps que exigem `nitro` e `@tanstack/react-start` (assume SSR). Removível, desde que substituído por um `vite.config.ts` SPA escrito à mão.
- Form da `/` não usa react-hook-form, não usa zod, tem apenas um `trim().length > 0` como gate.
- Correção: `@tanstack/router-plugin` **fica**; `@tanstack/react-start` é que sai numa eventual migração para SPA.

Nada foi alterado. Aguardando sua decisão sobre migração para SPA pura antes de propor plano de correção.
