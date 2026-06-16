"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const CHAVE_AGENDA = ["agenda"] as const;
export const CHAVE_DISPONIBILIDADE_AGENDA = ["agenda-disponibilidade"] as const;

export interface AgendaPayload {
  paciente_id: number;
  psicologo_id: number;
  sala_id: number;
  data_consulta: string;
  horario_inicio: string;
  horario_fim: string;
  tipo_atendimento:
    | "triagem"
    | "psicoterapia"
    | "devolutiva"
    | "avaliacao"
    | "orientacao"
    | "retorno"
    | "alta"
    | "outro";
  tipo_outro?: string | null;
  status?: "agendado" | "remarcado" | "cancelado" | "falta" | "concluido";
  observacoes?: string | null;
  definir_responsavel?: boolean;
}

interface FiltrosAgenda {
  data_inicio?: string;
  data_fim?: string;
  psicologo_id?: number;
  sala_id?: number;
  paciente_id?: number;
  status?: string;
  tipo_atendimento?: string;
}

interface OpcaoFiltro {
  id: number;
  nome: string;
  tipo?: string;
  status_atendimento?: "fila_espera" | "em_atendimento" | "encerrado" | null;
  psicologo_responsavel_id?: number | null;
}

interface DisponibilidadeParams {
  data_consulta?: string;
  horario_inicio?: string;
  horario_fim?: string;
  psicologo_id?: number;
  sala_id?: number;
  consulta_id?: number;
}

export interface DisponibilidadeAgenda {
  disponivel: boolean;
  motivo?: string;
  codigo?: string;
  expediente?: {
    inicio: string;
    fim: string;
    intervalo_inicio: string | null;
    intervalo_fim: string | null;
    origem: "semanal" | "especial";
  };
  bloqueiosParciais: Array<{
    id: number;
    tipo: "bloqueio";
    inicio: string;
    fim: string;
    descricao: string | null;
  }>;
  conflitos?: {
    sala?: string;
    psicologo?: string;
  };
}

async function tratarResposta(resposta: Response) {
  const data = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(data.error || "Não foi possível concluir a ação");
  }
  return data;
}

function montarQueryString<T extends object>(filtros?: T) {
  const params = new URLSearchParams();
  if (!filtros) return "";

  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== null && valor !== "") {
      params.set(chave, String(valor));
    }
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

async function listarAgenda(filtros?: FiltrosAgenda) {
  const resposta = await fetch(`/api/agenda${montarQueryString(filtros)}`);
  return tratarResposta(resposta);
}

async function criarConsulta(dados: AgendaPayload) {
  const resposta = await fetch("/api/agenda", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return tratarResposta(resposta);
}

async function atualizarConsulta({
  id,
  dados,
}: {
  id: number;
  dados: Partial<AgendaPayload>;
}) {
  const resposta = await fetch(`/api/agenda/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return tratarResposta(resposta);
}

async function excluirConsulta(id: number) {
  const resposta = await fetch(`/api/agenda/${id}`, {
    method: "DELETE",
  });
  return tratarResposta(resposta);
}

async function listarFiltrosAgenda(): Promise<{
  success: boolean;
  data: {
    pacientes: OpcaoFiltro[];
    psicologos: OpcaoFiltro[];
    salas: OpcaoFiltro[];
  };
}> {
  const resposta = await fetch("/api/agenda/filtros");
  return tratarResposta(resposta);
}

async function consultarDisponibilidadeAgenda(
  params?: DisponibilidadeParams,
): Promise<{ success: boolean; data: DisponibilidadeAgenda }> {
  const resposta = await fetch(
    `/api/agenda/disponibilidade${montarQueryString(params)}`,
  );
  return tratarResposta(resposta);
}

function dataISOValida(data?: string) {
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const [ano, mes, dia] = data.split("-").map(Number);
  const parsed = new Date(ano, mes - 1, dia);
  return (
    parsed.getFullYear() === ano &&
    parsed.getMonth() === mes - 1 &&
    parsed.getDate() === dia
  );
}

function horaValida(hora?: string) {
  return Boolean(hora && /^\d{2}:\d{2}$/.test(hora));
}

export function useAgenda(filtros?: FiltrosAgenda) {
  return useQuery({
    queryKey: [...CHAVE_AGENDA, filtros],
    queryFn: () => listarAgenda(filtros),
  });
}

export function useFiltrosAgenda() {
  return useQuery({
    queryKey: [...CHAVE_AGENDA, "filtros"],
    queryFn: listarFiltrosAgenda,
  });
}

export function useDisponibilidadeAgenda(params?: DisponibilidadeParams) {
  return useQuery({
    queryKey: [...CHAVE_DISPONIBILIDADE_AGENDA, params],
    queryFn: () => consultarDisponibilidadeAgenda(params),
    enabled:
      dataISOValida(params?.data_consulta) &&
      horaValida(params?.horario_inicio) &&
      horaValida(params?.horario_fim),
  });
}

const CHAVE_NOTIFICACOES = ["notificacoes"] as const;

export function useCriarConsulta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: criarConsulta,
    // TanStack Query centraliza a invalidação da Agenda após alterações.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAVE_AGENDA });
      queryClient.invalidateQueries({
        queryKey: CHAVE_DISPONIBILIDADE_AGENDA,
      });
      queryClient.invalidateQueries({ queryKey: CHAVE_NOTIFICACOES });
    },
  });
}

export function useAtualizarConsulta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: atualizarConsulta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAVE_AGENDA });
      queryClient.invalidateQueries({
        queryKey: CHAVE_DISPONIBILIDADE_AGENDA,
      });
      queryClient.invalidateQueries({ queryKey: CHAVE_NOTIFICACOES });
    },
  });
}

export function useExcluirConsulta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: excluirConsulta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAVE_AGENDA });
      queryClient.invalidateQueries({
        queryKey: CHAVE_DISPONIBILIDADE_AGENDA,
      });
      queryClient.invalidateQueries({ queryKey: CHAVE_NOTIFICACOES });
    },
  });
}
