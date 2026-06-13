import type {
  AlterarStatusUsuarioSistemaDetalhadoPayload,
  CriarUsuarioSistemaPayload,
  FiltrosUsuariosSistema,
  PreviaInativacaoUsuario,
  UsuariosSistemaResponse,
} from "../types/usuariosSistema.types";

async function tratarResposta<T>(resposta: Response): Promise<T> {
  const data = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(data.error || "Não foi possível concluir a ação");
  }
  return data;
}

function montarQuery(filtros: FiltrosUsuariosSistema) {
  const params = new URLSearchParams();
  if (filtros.busca.trim()) params.set("busca", filtros.busca.trim());
  if (filtros.perfil !== "todos") params.set("perfil", filtros.perfil);
  if (filtros.status !== "todos") params.set("status", filtros.status);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function listarUsuariosSistema(
  filtros: FiltrosUsuariosSistema,
): Promise<UsuariosSistemaResponse> {
  const resposta = await fetch(
    `/api/configuracoes/usuarios${montarQuery(filtros)}`,
  );
  return tratarResposta<UsuariosSistemaResponse>(resposta);
}

export async function criarUsuarioSistema(dados: CriarUsuarioSistemaPayload) {
  const resposta = await fetch("/api/configuracoes/usuarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return tratarResposta<{ success: boolean; message: string; id: number }>(
    resposta,
  );
}

export async function alterarStatusUsuarioSistema(id: number, ativo: boolean) {
  const resposta = await fetch(`/api/configuracoes/usuarios/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ativo }),
  });
  return tratarResposta<{ success: boolean; message: string }>(resposta);
}

export async function alterarStatusUsuarioSistemaDetalhado(
  id: number,
  payload: AlterarStatusUsuarioSistemaDetalhadoPayload,
) {
  const resposta = await fetch(`/api/configuracoes/usuarios/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return tratarResposta<{ success: boolean; message: string }>(resposta);
}

export function inativarUsuarioSistema(id: number) {
  return alterarStatusUsuarioSistema(id, false);
}

export function inativarUsuarioSistemaDetalhado(
  id: number,
  payload: Omit<AlterarStatusUsuarioSistemaDetalhadoPayload, "ativo">,
) {
  return alterarStatusUsuarioSistemaDetalhado(id, {
    ativo: false,
    ...payload,
  });
}

export function reativarUsuarioSistema(id: number) {
  return alterarStatusUsuarioSistema(id, true);
}

export async function obterPreviaInativacaoUsuario(
  id: number,
): Promise<PreviaInativacaoUsuario> {
  const resposta = await fetch(`/api/configuracoes/usuarios/${id}`);
  const resultado = await tratarResposta<{
    success: boolean;
    data: PreviaInativacaoUsuario;
  }>(resposta);
  return resultado.data;
}

export async function excluirUsuarioSistema(id: number) {
  const resposta = await fetch(`/api/configuracoes/usuarios/${id}`, {
    method: "DELETE",
  });
  return tratarResposta<{ success: boolean; message: string }>(resposta);
}
