// Configurações estáticas do front. Nenhum segredo mora aqui — apenas
// valores de build. `VITE_API_BASE_URL` é uma URL pública, não um segredo.

export const APPROVER_NAME = "Aprovador Padrão";

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  "http://localhost:8000";
