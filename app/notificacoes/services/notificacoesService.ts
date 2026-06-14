import { obterRotuloTipoNotificacao } from "@/lib/notificacoes";

export interface Notificacao {
  id: number;
  clinica_id: number;
  usuario_id: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  entidade_tipo: string | null;
  entidade_id: number | null;
  lida: boolean;
  lida_em: string | null;
  criado_em: string;
}

export interface RespostaNotificacoes {
  notificacoes: Notificacao[];
  totais: {
    total: number;
    nao_lidas: number;
    lidas: number;
  };
}

export interface RespostaListaNotificacoes {
  success: true;
  data: RespostaNotificacoes;
}

export interface RespostaGeracaoNotificacoesConsultas {
  success: true;
  data: {
    consulta_5_dias: number;
    consulta_24h: number;
    total: number;
    consultas_5_dias: number;
    consultas_24h: number;
  };
}

export interface RespostaGeracaoNotificacoesPendentes {
  success: true;
  data: {
    consulta_pendente: number;
    total: number;
    consultas_pendentes: number;
  };
}

export interface RespostaGeracaoNotificacoesFeriados {
  success: true;
  data: {
    feriado_30_dias: number;
    feriado_7_dias: number;
    total: number;
  };
}

export interface RespostaGeracaoNotificacoesOperacionais {
  success: true;
  data: {
    paciente_sem_responsavel: number;
    pacientes_sem_responsavel: number;
    total: number;
  };
}

async function tratarResposta<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "Erro ao carregar notificações");
  }
  return data as T;
}

export async function buscarNotificacoes(): Promise<RespostaNotificacoes> {
  const res = await fetch("/api/notificacoes", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
  const resposta = await tratarResposta<RespostaListaNotificacoes>(res);
  return resposta.data;
}

export async function marcarNotificacaoComoLida(id: number) {
  const res = await fetch(`/api/notificacoes/${id}/lida`, {
    method: "PATCH",
    credentials: "include",
  });
  return tratarResposta<{ success: true; message: string }>(res);
}

export async function marcarNotificacaoComoNaoLida(id: number) {
  const res = await fetch(`/api/notificacoes/${id}/nao-lida`, {
    method: "PATCH",
    credentials: "include",
  });
  return tratarResposta<{ success: true; message: string }>(res);
}

export async function marcarTodasNotificacoesComoLidas() {
  const res = await fetch("/api/notificacoes/marcar-todas-lidas", {
    method: "PATCH",
    credentials: "include",
  });
  return tratarResposta<{
    success: true;
    message: string;
    atualizadas: number;
  }>(res);
}

export async function gerarNotificacoesConsultas() {
  const res = await fetch("/api/notificacoes/gerar-consultas", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });
  return tratarResposta<RespostaGeracaoNotificacoesConsultas>(res);
}

export async function gerarNotificacoesPendentes() {
  const res = await fetch("/api/notificacoes/gerar-pendentes", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });
  return tratarResposta<RespostaGeracaoNotificacoesPendentes>(res);
}

export async function gerarNotificacoesFeriados() {
  const res = await fetch("/api/notificacoes/gerar-feriados", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });
  return tratarResposta<RespostaGeracaoNotificacoesFeriados>(res);
}

export async function gerarNotificacoesOperacionais() {
  const res = await fetch("/api/notificacoes/gerar-operacionais", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });
  return tratarResposta<RespostaGeracaoNotificacoesOperacionais>(res);
}

export function labelTipoNotificacao(tipo: string) {
  return obterRotuloTipoNotificacao(tipo);
}
