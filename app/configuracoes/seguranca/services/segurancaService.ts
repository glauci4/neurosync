import type {
  AlterarEmailPayload,
  AlterarSenhaPayload,
  RespostaAlterarEmail,
} from "../types/seguranca.types";

async function tratarResposta<T>(resposta: Response): Promise<T> {
  const data = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(data.error || "Não foi possível concluir a ação.");
  }
  return data as T;
}

export async function alterarSenha(payload: AlterarSenhaPayload) {
  const resposta = await fetch("/api/configuracoes/seguranca/senha", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return tratarResposta<{ success: boolean; message: string }>(resposta);
}

export async function alterarEmail(payload: AlterarEmailPayload) {
  const resposta = await fetch("/api/configuracoes/seguranca/email", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return tratarResposta<RespostaAlterarEmail>(resposta);
}

