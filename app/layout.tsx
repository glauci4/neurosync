// app/layout.tsx
// Layout principal da aplicação NeuroSync
// Este arquivo envolve todas as páginas do sistema, aplicando configurações globais, estilos, fontes e provedores de estado.

// Importa o tipo Metadata do Next.js para configuração de SEO
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

// Importa os estilos globais da aplicação
import "./globals.css";

// Importa o React Query Devtools (apenas em desenvolvimento) – útil para depuração e monitoramento das queries
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
// Importa o componente Toaster da biblioteca sonner para exibir notificações/toasts
import { Toaster } from "sonner";
// Importa o QueryProvider responsável por gerenciar requisições e cache, utilizando a biblioteca TanStack Query (React Query)
import QueryProvider from "./components/QueryProvider";
// Importa o Provider de autenticação para gerenciar o estado de login do usuário em toda a aplicação
import { AutenticacaoProvider } from "./context/AutenticacaoContext";
// Importa o Provider da sidebar para gerenciar o estado recolhido/expandido em toda a aplicação
import { SidebarProvider } from "./context/SidebarContext";
// Importa a base técnica de tema para futura configuração de claro/escuro/automático
import { ThemeProvider } from "./theme/ThemeProvider";
import ThemeScript from "./theme/ThemeScript";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta-sans",
});

// Configuração de metadados da aplicação
// Essas informações são utilizadas para SEO e exibidas no navegador
export const metadata: Metadata = {
  title: "NeuroSync",
  description: "Plataforma de agendamento integrada para psicólogos",
};

// Componente de layout raiz que envolve toda a aplicação
export default function RootLayout({
  children,
}: {
  // Define que o layout receberá componentes filhos (todas as páginas do sistema)
  children: React.ReactNode;
}) {
  return (
    // Define o idioma padrão da aplicação como português do Brasil
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={plusJakartaSans.variable}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap"
          rel="stylesheet"
        />
        <ThemeScript />
      </head>

      <body className="font-sans">
        {/* Toaster: Componente global para exibição de notificações/toasts (sucesso, erro, informação, etc.) */}
        {/* Posicionado no canto superior direito com cores temáticas */}
        <Toaster position="top-right" richColors />

        {/* AutenticacaoProvider: Gerencia o estado de login do usuário */}
        <ThemeProvider>
          {/* QueryProvider: Gerencia requisições assíncronas e cache com TanStack Query */}
          <QueryProvider>
            <AutenticacaoProvider>
              {/* SidebarProvider: Gerencia o estado recolhido/expandido da sidebar */}
              <SidebarProvider>
                {children}
                {/* ReactQueryDevtools: Ferramenta de desenvolvimento para inspecionar queries, mutações e cache.
                  initialIsOpen={false} – não abre automaticamente; o usuário pode abrir clicando no ícone.
                  Recomenda-se usar apenas em ambiente de desenvolvimento (process.env.NODE_ENV === 'development') */}
                <ReactQueryDevtools initialIsOpen={false} />
              </SidebarProvider>
            </AutenticacaoProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
