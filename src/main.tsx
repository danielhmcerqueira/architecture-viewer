// Ponto de entrada SPA. O Vite carrega este arquivo a partir de index.html
// e monta o RouterProvider no <div id="root"> — sem SSR, sem server entry.

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";

import { getRouter } from "./router";
import "./styles.css";

const router = getRouter();

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error('Elemento "#root" não encontrado em index.html.');
}

createRoot(rootEl).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
