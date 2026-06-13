import { useMutation, useQuery } from "@tanstack/react-query";

export interface UsuarioSessao {
  id: number;
  nome: string;
  email: string;
  perfil: string;
  perfil_id: number;
  clinica_id: number;
  avatar_url?: string | null;
  isAdminClinica?: boolean;
  isResponsavelClinica?: boolean;
  clinica?: string | null;
}

async function buscarUsuarioLogado(): Promise<UsuarioSessao> {
  const resposta = await fetch("/api/usuarios/me");

  if (!resposta.ok) {
    throw new Error("Nao foi possivel sincronizar o usuario logado");
  }

  return resposta.json();
}

async function encerrarSessao(): Promise<void> {
  const resposta = await fetch("/api/logout", { method: "POST" });

  if (!resposta.ok) {
    throw new Error("Nao foi possivel limpar a sessao no servidor");
  }
}

export function useUsuarioLogado(usuarioId?: number) {
  return useQuery({
    queryKey: ["usuario-logado", usuarioId],
    queryFn: buscarUsuarioLogado,
    enabled: Boolean(usuarioId),
    staleTime: 60 * 1000,
  });
}

export function useLogoutUsuario() {
  return useMutation({
    mutationFn: encerrarSessao,
  });
}
