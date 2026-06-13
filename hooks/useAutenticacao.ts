// app/hooks/useAutenticacao.ts
// Hook personalizado para acessar o contexto de autenticação

"use client";

import { useContext } from "react";
import { AutenticacaoContext } from "@/app/context/AutenticacaoContext";

// Tipo do usuário
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: string; // 'secretaria' ou 'psicologo'
  perfil_id: number; // 1 ou 2
  clinica_id: number;
  avatar_url?: string | null;
  isAdminClinica?: boolean;
  isResponsavelClinica?: boolean;
  clinica?: string | null;
}

export function useAutenticacao() {
  const contexto = useContext(AutenticacaoContext);

  if (!contexto) {
    throw new Error(
      "useAutenticacao deve ser usado dentro de AutenticacaoProvider",
    );
  }

  return contexto;
}

