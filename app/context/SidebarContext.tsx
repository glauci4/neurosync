// app/context/SidebarContext.tsx
// Contexto para gerenciar o estado da sidebar (recolhida/expandida)
// Permite que o estado seja compartilhado entre a sidebar e o conteúdo principal

"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

// Tipo que define o contexto da sidebar
interface SidebarContextType {
  isCollapsed: boolean; // Estado: true = recolhida, false = expandida
  toggleSidebar: () => void; // Função para alternar entre recolhida e expandida
  setCollapsed: (collapsed: boolean) => void; // Função para definir estado específico
}

// Cria o contexto com valor inicial undefined
const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// Provider que envolve toda a aplicação
export function SidebarProvider({ children }: { children: ReactNode }) {
  // Estado que controla se a sidebar está recolhida ou não
  // Valor padrão: false (expandida)
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Função para alternar entre recolhida e expandida
  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  // Função para definir um estado específico
  const setCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
  };

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggleSidebar,
        setCollapsed,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

// Hook personalizado para acessar o contexto da sidebar, facilita o uso em qualquer componente
export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar deve ser usado dentro de um SidebarProvider");
  }
  return context;
}

