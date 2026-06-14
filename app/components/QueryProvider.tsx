// app/components/QueryProvider.tsx
// Componente Provider do TanStack Query, ele configura e disponibiliza o cliente de query para toda aplicação

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

interface QueryProviderProps {
  children: React.ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  // Criamos o cliente de query apenas uma vez e mantemos durante toda a aplicação
  // useState garante que não seja recriado em cada renderização
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Configurações padrão para todas as queries
            staleTime: 60 * 1000, // 1 minuto - dados são considerados "frescos" por 1 minuto
            gcTime: 5 * 60 * 1000, // 5 minutos - dados ficam no cache por 5 minutos
            retry: 1, // Tenta novamente 1 vez se falhar
            refetchOnWindowFocus: false, // Não busca novamente quando a janela ganha foco
            refetchOnMount: true, // Busca novamente quando o componente monta
          },
          mutations: {
            // Configurações padrão para mutações (POST, PUT, DELETE)
            retry: 1, // Tenta novamente 1 vez se falhar
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools, ajuda a debugar as queries (aparece como um ícone no canto da tela) */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
