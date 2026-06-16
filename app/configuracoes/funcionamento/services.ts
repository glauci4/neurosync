// app/configuracoes/funcionamento/services.ts
// Funções de comunicação com as APIs de funcionamento e exceções

import type { AplicacaoPontualFuncionamento, Excecao, Horario } from "./types";

export interface CriarExcecaoPayload {
  tipo: Excecao["tipo"];
  data_especifica: string;
  data_fim?: string | null;
  hora_inicio?: string | null;
  hora_fim?: string | null;
  descricao?: string | null;
  ativo?: number;
}

export interface ConflitoExcecaoDia {
  data: string;
  total: number;
}

export interface ConflitosExcecaoResponse {
  success: boolean;
  temConflitos: boolean;
  dias: ConflitoExcecaoDia[];
  mensagem: string | null;
}

// ---------- FUNCIONAMENTO ----------
/**
 * Busca os horários de funcionamento salvos no backend.
 */
export async function buscarHorarios(): Promise<Horario[]> {
  const res = await fetch("/api/clinica/funcionamento");
  if (!res.ok) throw new Error("Erro ao carregar funcionamento");
  const json = (await res.json()) as Array<
    Horario & { tipo?: string; dia_semana?: number | null }
  >;
  return json.filter((h) => h.tipo === "funcionamento");
}

/**
 * Salva a grade completa de horários no backend.
 */
export async function salvarHorarios(
  horarios: Horario[],
): Promise<{ success?: boolean; error?: string; message?: string }> {
  const res = await fetch("/api/clinica/funcionamento", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ horarios }),
  });
  if (!res.ok) {
    const erro = (await res.json()) as { error?: string };
    throw new Error(erro.error || "Erro ao salvar funcionamento");
  }
  return res.json();
}

export async function salvarFuncionamentoPontual(
  aplicacoes: AplicacaoPontualFuncionamento[],
): Promise<{ success?: boolean; error?: string; message?: string }> {
  const res = await fetch("/api/clinica/funcionamento", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ aplicacoes_pontuais: aplicacoes }),
  });
  if (!res.ok) {
    const erro = (await res.json()) as { error?: string };
    throw new Error(erro.error || "Erro ao salvar funcionamento pontual");
  }
  return res.json();
}

// ---------- EXCEÇÕES ----------
/**
 * Busca todas as exceções (feriados, férias, horários especiais).
 */
export async function buscarExcecoes(): Promise<Excecao[]> {
  const res = await fetch("/api/clinica/funcionamento/excecoes");
  if (!res.ok) throw new Error("Erro ao carregar exceções");
  return res.json();
}

/**
 * Cria uma nova exceção (feriado, férias, horário especial).
 * Se ocorrer erro de duplicata (registro já existente), considera como sucesso silencioso.
 * Isso evita que a sincronização automática de feriados seja interrompida por registros duplicados.
 */
export async function criarExcecao(
  dados: CriarExcecaoPayload,
): Promise<{ success?: boolean; message?: string; id?: number }> {
  const res = await fetch("/api/clinica/funcionamento/excecoes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });

  if (!res.ok) {
    const errorData = await res.json();
    // Se for erro de duplicata (registro já existe), consideramos sucesso
    if (
      res.status === 500 &&
      (errorData.error?.includes("Duplicate entry") ||
        errorData.error?.includes("already exists"))
    ) {
      console.warn("[criarExcecao] Registro duplicado ignorado:", dados);
      return { success: true, message: "Registro já existente" };
    }
    throw new Error(errorData.error || "Erro ao criar exceção");
  }
  return res.json();
}

export async function validarConflitosExcecao(
  dados: CriarExcecaoPayload,
): Promise<ConflitosExcecaoResponse> {
  const params = new URLSearchParams({
    tipo: dados.tipo,
    data_inicio: dados.data_especifica,
    data_fim: dados.data_fim || dados.data_especifica,
  });

  if (dados.hora_inicio) params.set("hora_inicio", dados.hora_inicio);
  if (dados.hora_fim) params.set("hora_fim", dados.hora_fim);

  const res = await fetch(
    `/api/clinica/funcionamento/excecoes/conflitos?${params.toString()}`,
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Erro ao validar consultas vinculadas");
  }
  return data;
}

/**
 * Remove uma exceção pelo ID.
 */
export async function excluirExcecao(id: number): Promise<void> {
  const res = await fetch(`/api/clinica/funcionamento/excecoes/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Não foi possível excluir a exceção.");
  }
}
