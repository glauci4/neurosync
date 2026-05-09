// app/hooks/useSolicitarRecuperacao.ts
// Hook para solicitar recuperação de senha

import { useMutation } from '@tanstack/react-query';

async function solicitarRecuperacao(email: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch('/api/recuperacao-senha/solicitar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
  
  const resultado = await response.json();
  
  if (!response.ok) {
    throw new Error(resultado.error || 'Erro ao solicitar recuperação');
  }
  
  return resultado;
}

export function useSolicitarRecuperacao() {
  return useMutation({
    mutationFn: solicitarRecuperacao,
  });
}