import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAutenticacao } from "@/hooks/useAutenticacao";
import type { PerfilData } from "../../types";

export const CHAVE_PERFIL_USUARIO = ["perfil"] as const;

export interface PerfilPayload {
  nome: string;
  telefone?: string;
}

async function tratarResposta(resposta: Response) {
  const data = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(data.error || "Não foi possível concluir a ação");
  }
  return data;
}

async function buscarPerfilUsuario(): Promise<PerfilData> {
  const resposta = await fetch("/api/usuarios/me");
  return tratarResposta(resposta);
}

async function sincronizarPerfilAutenticado(
  queryClient: ReturnType<typeof useQueryClient>,
  atualizarUsuario: ReturnType<typeof useAutenticacao>["atualizarUsuario"],
) {
  const perfilAtualizado = await queryClient.fetchQuery({
    queryKey: CHAVE_PERFIL_USUARIO,
    queryFn: buscarPerfilUsuario,
  });

  atualizarUsuario({
    nome: perfilAtualizado.nome,
    email: perfilAtualizado.email,
    perfil: perfilAtualizado.perfil,
    perfil_id: perfilAtualizado.perfil_id,
    avatar_url: perfilAtualizado.avatar_url || null,
  });
}

async function atualizarPerfil(dados: PerfilPayload) {
  const resposta = await fetch("/api/usuarios/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return tratarResposta(resposta);
}

async function atualizarFotoPerfil(arquivo: File) {
  const formData = new FormData();
  formData.append("avatar", arquivo);

  const resposta = await fetch("/api/usuarios/me/avatar", {
    method: "POST",
    body: formData,
  });
  return tratarResposta(resposta);
}

async function removerFotoPerfil() {
  const resposta = await fetch("/api/usuarios/me/avatar", {
    method: "DELETE",
  });
  return tratarResposta(resposta);
}

async function atualizarAssinaturaProfissional(arquivo: File) {
  const formData = new FormData();
  formData.append("assinatura", arquivo);

  const resposta = await fetch("/api/usuarios/me/assinatura", {
    method: "POST",
    body: formData,
  });
  return tratarResposta(resposta);
}

async function removerAssinaturaProfissional() {
  const resposta = await fetch("/api/usuarios/me/assinatura", {
    method: "DELETE",
  });
  return tratarResposta(resposta);
}

export function usePerfilUsuario() {
  return useQuery({
    queryKey: CHAVE_PERFIL_USUARIO,
    queryFn: buscarPerfilUsuario,
  });
}

export function useAtualizarPerfil() {
  const queryClient = useQueryClient();
  const { atualizarUsuario } = useAutenticacao();

  return useMutation({
    mutationFn: atualizarPerfil,
    // TanStack Query centraliza a atualização visual do perfil após salvar.
    onSuccess: async () => {
      await sincronizarPerfilAutenticado(queryClient, atualizarUsuario);
    },
  });
}

export function useAtualizarFotoPerfil() {
  const queryClient = useQueryClient();
  const { atualizarUsuario, usuario } = useAutenticacao();

  return useMutation({
    mutationFn: atualizarFotoPerfil,
    onSuccess: (data) => {
      const avatarUrl = data.avatar_url || null;

      queryClient.setQueryData<PerfilData | undefined>(
        CHAVE_PERFIL_USUARIO,
        (perfilAtual) =>
          perfilAtual
            ? {
                ...perfilAtual,
                avatar_url: avatarUrl,
              }
            : perfilAtual,
      );

      if (usuario?.id) {
        queryClient.setQueryData(["usuario-logado", usuario.id], (atual) =>
          atual
            ? {
                ...atual,
                avatar_url: avatarUrl,
              }
            : atual,
        );
        queryClient.invalidateQueries({
          queryKey: ["usuario-logado", usuario.id],
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["usuario-logado"] });
      }

      atualizarUsuario({
        avatar_url: avatarUrl,
      });

      queryClient.invalidateQueries({ queryKey: CHAVE_PERFIL_USUARIO });
    },
  });
}

export function useRemoverFotoPerfil() {
  const queryClient = useQueryClient();
  const { atualizarUsuario, usuario } = useAutenticacao();

  return useMutation({
    mutationFn: removerFotoPerfil,
    onSuccess: () => {
      queryClient.setQueryData<PerfilData | undefined>(
        CHAVE_PERFIL_USUARIO,
        (perfilAtual) =>
          perfilAtual
            ? {
                ...perfilAtual,
                avatar_url: null,
              }
            : perfilAtual,
      );

      if (usuario?.id) {
        queryClient.setQueryData(["usuario-logado", usuario.id], (atual) =>
          atual
            ? {
                ...atual,
                avatar_url: null,
              }
            : atual,
        );
        queryClient.invalidateQueries({
          queryKey: ["usuario-logado", usuario.id],
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["usuario-logado"] });
      }

      atualizarUsuario({
        avatar_url: null,
      });

      queryClient.invalidateQueries({ queryKey: CHAVE_PERFIL_USUARIO });
    },
  });
}

export function useAtualizarAssinaturaProfissional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: atualizarAssinaturaProfissional,
    // A assinatura será usada futuramente no Prontuário; invalidar o perfil
    // mantém o preview e os dados profissionais sincronizados no cache.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAVE_PERFIL_USUARIO });
    },
  });
}

export function useRemoverAssinaturaProfissional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removerAssinaturaProfissional,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAVE_PERFIL_USUARIO });
    },
  });
}

