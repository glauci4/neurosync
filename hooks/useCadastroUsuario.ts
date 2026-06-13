// app/hooks/useCadastroUsuario.ts
// Hook para cadastrar usuário usando TanStack Query Mutation.

import { useMutation } from "@tanstack/react-query";

// Interface dos dados enviados ao backend (inclui CPF para secretárias)
interface CadastroData {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  perfil?: "psicologo" | "secretaria";
  perfil_id?: number;
  cnpj: string;
  crp?: string;
  cpf?: string; // CPF obrigatório para perfil secretária
}

interface CadastroResponse {
  success: boolean;
  message: string;
  usuarioId: number;
}

// Função que realiza a requisição de cadastro
async function cadastrarUsuario(
  dados: CadastroData,
): Promise<CadastroResponse> {
  const response = await fetch("/api/usuarios", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dados),
  });

  const resultado = await response.json();

  if (!response.ok) {
    throw new Error(resultado.error || "Erro ao cadastrar");
  }

  return resultado;
}

export function useCadastroUsuario() {
  return useMutation({
    mutationFn: cadastrarUsuario,
    onError: (error: Error) => {
      console.error("Erro no cadastro:", error.message);
    },
  });
}

