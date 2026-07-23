import { QueryClient } from "@tanstack/react-query";
import { createRouter, Link } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function DefaultErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md p-8 text-center">
      <h1 className="text-lg font-semibold">Algo deu errado</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message || "Erro inesperado ao carregar esta tela."}
      </p>
      <button
        onClick={reset}
        className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Tentar de novo
      </button>
    </div>
  );
}

function DefaultNotFoundComponent() {
  return (
    <div className="mx-auto max-w-md p-8 text-center">
      <h1 className="text-lg font-semibold">Página não encontrada</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        O endereço acessado não existe.
      </p>
      <Link to="/" className="mt-4 inline-block text-sm underline">
        Voltar para o início
      </Link>
    </div>
  );
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent,
    defaultNotFoundComponent: DefaultNotFoundComponent,
  });

  return router;
};
