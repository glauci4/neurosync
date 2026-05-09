// app/hooks/useAutenticacao.ts
// Hook personalizado para acessar o contexto de autenticação

'use client';

import { useContext } from 'react';
import { AutenticacaoContext } from '@/app/context/AutenticacaoContext';

// Tipo do usuário
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: string;      // 'secretaria' ou 'psicologo'
  perfil_id: number;   // 1 ou 2
}

interface AutenticacaoContextType {
  usuario: Usuario | null;
  carregando: boolean;
  fazerLogin: (dados: Usuario) => void;
  fazerLogout: () => void;
  estaAutenticado: boolean;
}

export function useAutenticacao() {
  const contexto = useContext(AutenticacaoContext);
  
  if (!contexto) {
    throw new Error('useAutenticacao deve ser usado dentro de AutenticacaoProvider');
  }
  
  return contexto;
}