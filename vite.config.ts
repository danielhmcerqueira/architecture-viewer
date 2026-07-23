// Configuração SPA pura. Apenas React + Tailwind + roteador file-based
// do TanStack Router. Nada de SSR, Nitro ou preset do Lovable Start.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    // TanStackRouterVite precisa vir ANTES do plugin do React. Ele varre
    // src/routes/ e regenera src/routeTree.gen.ts.
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
  },
  preview: {
    host: "::",
    port: 8080,
    strictPort: true,
  },
});
