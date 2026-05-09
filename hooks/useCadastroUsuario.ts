// app/hooks/useCadastroUsuario.ts
// Hook para cadastrar usuário usando TanStack Query Mutation

import { useMutation } from '@tanstack/react-query';

interface CadastroData {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  perfil: 'psicologo' | 'secretaria';
  cnpj: string;
  crp?: string;
}

interface CadastroResponse {
  success: boolean;
  message: string;
  usuarioId: number;
}

async function cadastrarUsuario(dados: CadastroData): Promise<CadastroResponse> {
  const response = await fetch('/api/usuarios', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dados),
  });
  
  const resultado = await response.json();
  
  if (!response.ok) {
    throw new Error(resultado.error || 'Erro ao cadastrar');
  }
  
  return resultado;
}

export function useCadastroUsuario() {
  return useMutation({
    mutationFn: cadastrarUsuario,
    onSuccess: (data) => {
      console.log('Cadastro bem sucedido:', data);
      alert('Cadastro realizado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro no cadastro:', error.message);
    },
  });
}