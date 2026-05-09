// app/layout.tsx
// Layout principal da aplicação NeuroSync
// Este arquivo envolve todas as páginas do sistema, aplicando configurações globais, estilos, fontes e provedores de estado.

// Importa o tipo Metadata do Next.js para configuração de SEO
import type { Metadata } from 'next';

// Importa os estilos globais da aplicação
import './globals.css';

// Importa o QueryProvider responsável por gerenciar requisições e cache, utilizando a biblioteca TanStack Query (React Query)
import QueryProvider from './components/QueryProvider';

// Importa o Provider de autenticação para gerenciar o estado de login do usuário em toda a aplicação
import { AutenticacaoProvider } from './context/AutenticacaoContext';

// Importa o Provider da sidebar para gerenciar o estado recolhido/expandido em toda a aplicação
import { SidebarProvider } from './context/SidebarContext';

// Importa o componente Toaster da biblioteca sonner para exibir notificações/toasts
import { Toaster } from 'sonner';

// Configuração de metadados da aplicação
// Essas informações são utilizadas para SEO e exibidas no navegador
export const metadata: Metadata = {
  title: 'NeuroSync',
  description: 'Plataforma de agendamento integrada para psicólogos',
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
    <html lang="pt-BR">
      <head>
        {/* Importa a fonte Pacifico do Google Fonts, essa fonte é utilizada para estilizar o nome "NeuroSync", conferindo identidade visual ao sistema */}
        <link
          href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap"
          rel="stylesheet"
        />
      </head>

      <body>
        {/* Toaster: Componente global para exibição de notificações/toasts (sucesso, erro, informação, etc.) */}
        {/* Posicionado no canto superior direito com cores temáticas */}
        <Toaster position="top-right" richColors />

        {/* AutenticacaoProvider: Gerencia o estado de login do usuário */}
        <AutenticacaoProvider>
          {/* SidebarProvider: Gerencia o estado recolhido/expandido da sidebar */}
          <SidebarProvider>
            {/* QueryProvider: Gerencia requisições assíncronas e cache com TanStack Query */}
            <QueryProvider>
              {children}
            </QueryProvider>
          </SidebarProvider>
        </AutenticacaoProvider>
      </body>
    </html>
  );
}