"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const CHAVE_PRONTUARIOS = ["prontuarios"] as const;

export type StatusProntuario = "rascunho" | "finalizado" | "assinado";
export type TipoAtendimentoProntuario =
  | "triagem"
  | "psicoterapia"
  | "devolutiva"
  | "avaliacao"
  | "orientacao"
  | "retorno"
  | "alta"
  | "outro";

export interface RegistroClinico {
  id: number;
  paciente_id: number;
  paciente_nome: string;
  paciente_ativo: boolean;
  psicologo_id: number;
  psicologo_nome: string;
  crp: string | null;
  consulta_id: number | null;
  data_registro: string;
  tipo_atendimento: TipoAtendimentoProntuario;
  conteudo: string;
  status: StatusProntuario;
  assinatura_url: string | null;
  assinado_em: string | null;
  finalizado_em: string | null;
  criado_em: string;
  atualizado_em: string;
  permissao_acesso?: "dono" | "visualizar" | "editar";
  editado_por_id: number | null;
  editado_por_nome: string | null;
  editado_em: string | null;
  assinatura_editor_url: string | null;
  crp_editor: string | null;
  consulta_data_consulta?: string | null;
  consulta_horario_inicio?: string | null;
  consulta_horario_fim?: string | null;
  consulta_sala_nome?: string | null;
  consulta_psicologo_nome?: string | null;
  consulta_status?: string | null;
  consulta_tipo_atendimento?: TipoAtendimentoProntuario | null;
  consulta_tipo_outro?: string | null;
  consulta_observacoes?: string | null;
}

export interface RegistroClinicoPayload {
  paciente_id: number;
  consulta_id?: number | null;
  data_registro: string;
  tipo_atendimento: TipoAtendimentoProntuario;
  conteudo: string;
  finalizar?: boolean;
}

export interface PsicologoProntuario {
  id: number;
  nome: string;
  crp: string | null;
}

export interface PermissaoProntuarioPayload {
  psicologo_permitido_id: number;
  permissao: "visualizar" | "editar";
  escopo: "paciente" | "evolucao";
}

export interface PermissaoProntuario extends PermissaoProntuarioPayload {
  id: number;
  paciente_id: number | null;
  registro_clinico_id: number | null;
  psicologo_dono_id: number;
  psicologo_permitido_nome: string;
  psicologo_permitido_crp: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface ConsultaPacienteProntuario {
  id: number;
  paciente_id: number;
  paciente_nome: string;
  psicologo_id: number;
  psicologo_nome: string;
  data_consulta: string;
  horario_inicio: string;
  horario_fim: string;
  tipo_atendimento: TipoAtendimentoProntuario;
  tipo_outro: string | null;
  status: string;
}

export interface PerfilProfissionalProntuario {
  id: number;
  nome: string;
  crp: string;
  assinatura_profissional_url: string;
}

interface FiltrosProntuario {
  paciente_id?: number;
  status?: string;
  data?: string;
  busca?: string;
}

async function tratarResposta(resposta: Response) {
  const data = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(data.error || "Não foi possível concluir a ação");
  }
  return data;
}

function montarQueryString(filtros?: FiltrosProntuario) {
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

async function listarProntuarios(filtros?: FiltrosProntuario): Promise<{
  success: boolean;
  data: RegistroClinico[];
}> {
  const resposta = await fetch(`/api/prontuario${montarQueryString(filtros)}`);
  return tratarResposta(resposta);
}

async function buscarProntuario(id: number): Promise<{
  success: boolean;
  data: RegistroClinico;
}> {
  const resposta = await fetch(`/api/prontuario/${id}`);
  return tratarResposta(resposta);
}

async function criarEvolucao(payload: RegistroClinicoPayload) {
  const resposta = await fetch("/api/prontuario", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return tratarResposta(resposta);
}

async function atualizarEvolucao({
  id,
  dados,
}: {
  id: number;
  dados: RegistroClinicoPayload;
}) {
  const resposta = await fetch(`/api/prontuario/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return tratarResposta(resposta);
}

async function finalizarEvolucao(id: number) {
  const resposta = await fetch(`/api/prontuario/${id}/finalizar`, {
    method: "POST",
  });
  return tratarResposta(resposta);
}

async function assinarEvolucao(id: number) {
  const resposta = await fetch(`/api/prontuario/${id}/assinar`, {
    method: "POST",
  });
  return tratarResposta(resposta);
}

async function excluirEvolucao(id: number) {
  const resposta = await fetch(`/api/prontuario/${id}`, {
    method: "DELETE",
  });
  return tratarResposta(resposta);
}

async function listarPsicologosProntuario(): Promise<{
  success: boolean;
  data: PsicologoProntuario[];
}> {
  const resposta = await fetch("/api/prontuario/psicologos");
  return tratarResposta(resposta);
}

async function listarPermissoesProntuario(id: number): Promise<{
  success: boolean;
  data: PermissaoProntuario[];
}> {
  const resposta = await fetch(`/api/prontuario/${id}/permissoes`);
  return tratarResposta(resposta);
}

async function salvarPermissaoProntuario({
  id,
  dados,
}: {
  id: number;
  dados: PermissaoProntuarioPayload;
}) {
  const resposta = await fetch(`/api/prontuario/${id}/permissoes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return tratarResposta(resposta);
}

async function excluirPermissaoProntuario({
  id,
  permissaoId,
}: {
  id: number;
  permissaoId: number;
}) {
  const resposta = await fetch(
    `/api/prontuario/${id}/permissoes?permissao_id=${permissaoId}`,
    { method: "DELETE" },
  );
  return tratarResposta(resposta);
}

async function listarConsultasPaciente(
  pacienteId: number,
): Promise<{ success: boolean; data: ConsultaPacienteProntuario[] }> {
  const resposta = await fetch(`/api/agenda?paciente_id=${pacienteId}`);
  return tratarResposta(resposta);
}

async function buscarPerfilProfissional(): Promise<PerfilProfissionalProntuario> {
  const resposta = await fetch("/api/usuarios/me");
  return tratarResposta(resposta);
}

function useInvalidarProntuario() {
  const queryClient = useQueryClient();

  return (id?: number) => {
    // TanStack Query centraliza o refresh da lista e do detalhe após mudanças.
    queryClient.invalidateQueries({ queryKey: CHAVE_PRONTUARIOS });
    if (id) {
      queryClient.invalidateQueries({ queryKey: [...CHAVE_PRONTUARIOS, id] });
    }
  };
}

export function useProntuarios(filtros?: FiltrosProntuario) {
  return useQuery({
    queryKey: [...CHAVE_PRONTUARIOS, filtros],
    queryFn: () => listarProntuarios(filtros),
  });
}

export function useProntuarioPorId(id?: number) {
  return useQuery({
    queryKey: [...CHAVE_PRONTUARIOS, id],
    queryFn: () => buscarProntuario(id || 0),
    enabled: Boolean(id),
  });
}

export function useCriarEvolucao() {
  const invalidar = useInvalidarProntuario();

  return useMutation({
    mutationFn: criarEvolucao,
    onSuccess: () => invalidar(),
  });
}

export function useAtualizarEvolucao() {
  const invalidar = useInvalidarProntuario();

  return useMutation({
    mutationFn: atualizarEvolucao,
    onSuccess: (_data, variaveis) => invalidar(variaveis.id),
  });
}

export function useFinalizarEvolucao() {
  const invalidar = useInvalidarProntuario();

  return useMutation({
    mutationFn: finalizarEvolucao,
    onSuccess: (_data, id) => invalidar(id),
  });
}

export function useAssinarEvolucao() {
  const invalidar = useInvalidarProntuario();

  return useMutation({
    mutationFn: assinarEvolucao,
    onSuccess: (_data, id) => invalidar(id),
  });
}

export function useExcluirEvolucao() {
  const invalidar = useInvalidarProntuario();

  return useMutation({
    mutationFn: excluirEvolucao,
    onSuccess: (_data, id) => invalidar(id),
  });
}

export function usePsicologosProntuario() {
  return useQuery({
    queryKey: [...CHAVE_PRONTUARIOS, "psicologos"],
    queryFn: listarPsicologosProntuario,
  });
}

export function usePermissoesProntuario(id?: number) {
  return useQuery({
    queryKey: [...CHAVE_PRONTUARIOS, id, "permissoes"],
    queryFn: () => listarPermissoesProntuario(id || 0),
    enabled: Boolean(id),
  });
}

export function useSalvarPermissaoProntuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: salvarPermissaoProntuario,
    onSuccess: (_data, variaveis) => {
      queryClient.invalidateQueries({
        queryKey: [...CHAVE_PRONTUARIOS, variaveis.id, "permissoes"],
      });
      queryClient.invalidateQueries({ queryKey: CHAVE_PRONTUARIOS });
    },
  });
}

export function useExcluirPermissaoProntuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: excluirPermissaoProntuario,
    onSuccess: (_data, variaveis) => {
      queryClient.invalidateQueries({
        queryKey: [...CHAVE_PRONTUARIOS, variaveis.id, "permissoes"],
      });
      queryClient.invalidateQueries({ queryKey: CHAVE_PRONTUARIOS });
    },
  });
}

export function useConsultasPacienteProntuario(pacienteId?: number) {
  return useQuery({
    queryKey: [...CHAVE_PRONTUARIOS, "consultas-paciente", pacienteId],
    queryFn: () => listarConsultasPaciente(pacienteId || 0),
    enabled: Boolean(pacienteId),
  });
}

export function usePerfilProfissionalProntuario() {
  return useQuery({
    queryKey: [...CHAVE_PRONTUARIOS, "perfil-profissional"],
    queryFn: buscarPerfilProfissional,
    staleTime: 5 * 60 * 1000,
  });
}
