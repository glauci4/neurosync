"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  atualizarClinica,
  buscarClinica,
  enviarIdentidadeClinica,
  removerAssinaturaClinica,
  removerIdentidadeClinica,
  usarAssinaturaPerfilClinica,
} from "../services";
import type {
  ClinicaUpdatePayload,
  TipoIdentidadeVisualClinica,
} from "../types";

export const CHAVE_CLINICA = ["clinica"] as const;

export function useClinica(enabled = true) {
  return useQuery({
    queryKey: CHAVE_CLINICA,
    queryFn: buscarClinica,
    enabled,
  });
}

export function useAtualizarClinica() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dados: ClinicaUpdatePayload) => atualizarClinica(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAVE_CLINICA });
      toast.success("Clínica atualizada com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useAtualizarIdentidadeClinica() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tipo,
      arquivo,
    }: {
      tipo: TipoIdentidadeVisualClinica;
      arquivo: File;
    }) => enviarIdentidadeClinica({ tipo, arquivo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAVE_CLINICA });
      toast.success("Identidade visual atualizada");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRemoverIdentidadeClinica() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tipo: TipoIdentidadeVisualClinica) =>
      removerIdentidadeClinica(tipo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAVE_CLINICA });
      toast.success("Arquivo removido com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUsarAssinaturaPerfilClinica() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usarAssinaturaPerfilClinica,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAVE_CLINICA });
      toast.success("Assinatura do perfil reutilizada");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRemoverAssinaturaClinica() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removerAssinaturaClinica,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAVE_CLINICA });
      toast.success("Assinatura removida");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
