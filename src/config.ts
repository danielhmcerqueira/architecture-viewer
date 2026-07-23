// Configurações estáticas do front. Nenhum segredo mora aqui — apenas
// valores de build. A regra do escopo (nenhuma chave/token) refere-se a
// segredos; `VITE_API_BASE_URL` e `VITE_USE_MOCK` são chaves de build
// públicas por natureza.

export const APPROVER_NAME = "Aprovador Padrão";

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "http://localhost:8000";

export const USE_MOCK =
  ((import.meta.env.VITE_USE_MOCK as string | undefined) ?? "1").trim() !== "0";
