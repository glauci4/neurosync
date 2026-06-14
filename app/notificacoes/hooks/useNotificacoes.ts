"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  buscarNotificacoes,
  gerarNotificacoesConsultas,
  gerarNotificacoesFeriados,
  gerarNotificacoesOperacionais,
  gerarNotificacoesPendentes,
  marcarNotificacaoComoLida,
  marcarNotificacaoComoNaoLida,
  marcarTodasNotificacoesComoLidas,
} from "../services/notificacoesService";

const QUERY_KEY = ["notificacoes"];

export function useNotificacoes() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: buscarNotificacoes,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });
}

export function useContadorNotificacoes(ativo = true) {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: buscarNotificacoes,
    enabled: ativo,
    select: (dados) => dados.totais.nao_lidas,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });
}

export function useMarcarNotificacaoComoLida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: marcarNotificacaoComoLida,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Notificação marcada como lida.");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a notificação.",
      );
    },
  });
}

export function useMarcarNotificacaoComoNaoLida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: marcarNotificacaoComoNaoLida,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Notificação marcada como não lida.");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a notificação.",
      );
    },
  });
}

export function useMarcarTodasNotificacoesComoLidas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: marcarTodasNotificacoesComoLidas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Todas as notificações foram marcadas como lidas.");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar as notificações.",
      );
    },
  });
}

export function useGerarNotificacoesConsultas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: gerarNotificacoesConsultas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error) => {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar as notificações automáticas.";
      toast.error(mensagem);
    },
  });
}

export function useGerarNotificacoesPendentes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: gerarNotificacoesPendentes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error) => {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar as notificações pendentes.";
      toast.error(mensagem);
    },
  });
}

export function useGerarNotificacoesFeriados() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: gerarNotificacoesFeriados,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error) => {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar as notificações de feriados.";
      toast.error(mensagem);
    },
  });
}

export function useGerarNotificacoesOperacionais() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: gerarNotificacoesOperacionais,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error) => {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar as notificações operacionais.";
      toast.error(mensagem);
    },
  });
}
