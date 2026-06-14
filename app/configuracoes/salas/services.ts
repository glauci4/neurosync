import type { Sala, SalaPayload } from "./types";

async function tratarResposta(resposta: Response) {
  const data = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(data.error || "Não foi possível concluir a ação");
  }
  return data;
}

export async function listarSalas(): Promise<Sala[]> {
  const resposta = await fetch("/api/clinica/salas");
  return tratarResposta(resposta);
}

export async function listarSalasAtivasParaAgenda(): Promise<Sala[]> {
  const resposta = await fetch("/api/clinica/salas/ativas-para-agenda");
  return tratarResposta(resposta);
}

export async function criarSala(dados: SalaPayload) {
  const resposta = await fetch("/api/clinica/salas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return tratarResposta(resposta);
}

export async function atualizarSala(id: number, dados: SalaPayload) {
  const resposta = await fetch(`/api/clinica/salas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return tratarResposta(resposta);
}

async function alterarStatusSala(id: number, ativo: boolean) {
  const resposta = await fetch(`/api/clinica/salas/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ativo }),
  });
  return tratarResposta(resposta);
}

export async function inativarSala(id: number) {
  return alterarStatusSala(id, false);
}

export async function reativarSala(id: number) {
  return alterarStatusSala(id, true);
}

export async function excluirSala(id: number) {
  const resposta = await fetch(`/api/clinica/salas/${id}`, {
    method: "DELETE",
  });
  return tratarResposta(resposta);
}
