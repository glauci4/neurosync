// app/hooks/useLogin.ts
// Hook para realizar login

import { useMutation } from "@tanstack/react-query";
import { useAutenticacao } from "./useAutenticacao";

interface LoginData {
  email: string;
  senha: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  usuario?: {
    id: number;
    nome: string;
    email: string;
    perfil: string;
    perfil_id: number;
    clinica_id: number; // adicionado para refletir a resposta da API
    clinica?: string | null;
    avatar_url?: string | null;
    isAdminClinica?: boolean;
    isResponsavelClinica?: boolean;
  };
}

async function fazerLoginRequisicao(dados: LoginData): Promise<LoginResponse> {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dados),
  });

  const resultado = await response.json();

  if (!response.ok) {
    throw new Error(resultado.error || "Erro ao fazer login");
  }

  return resultado;
}

export function useLogin() {
  const { fazerLogin: salvarUsuarioNoContexto } = useAutenticacao();

  return useMutation({
    mutationFn: fazerLoginRequisicao,
    onSuccess: (data) => {
      console.log("Login bem sucedido:", data);

      if (data.success && data.usuario) {
        salvarUsuarioNoContexto({
          id: data.usuario.id,
          nome: data.usuario.nome,
          email: data.usuario.email,
          perfil: data.usuario.perfil,
          perfil_id: data.usuario.perfil_id,
          clinica_id: data.usuario.clinica_id, // agora salvo no contexto
          clinica: data.usuario.clinica || null,
          avatar_url: data.usuario.avatar_url || null,
          isAdminClinica: Boolean(data.usuario.isAdminClinica),
          isResponsavelClinica: Boolean(data.usuario.isResponsavelClinica),
        });

        // Redireciona para a página de início após login bem-sucedido
        window.location.href = "/inicio";
      }
    },
    onError: (error: Error) => {
      console.error("Erro no login:", error.message);
    },
  });
}
