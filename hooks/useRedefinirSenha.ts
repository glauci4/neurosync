// app/hooks/useRedefinirSenha.ts
// Hook para redefinir senha usando token

import { useMutation } from '@tanstack/react-query';

interface RedefinirData {
  token: string;
  novaSenha: string;
  confirmarSenha: string;
}

async function redefinirSenha(dados: RedefinirData): Promise<{ success: boolean; message: string }> {
  const response = await fetch('/api/recuperacao-senha/redefinir', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dados),
  });
  
  const resultado = await response.json();
  
  if (!response.ok) {
    throw new Error(resultado.error || 'Erro ao redefinir senha');
  }
  
  return resultado;
}

export function useRedefinirSenha() {
  return useMutation({
    mutationFn: redefinirSenha,
  });
}