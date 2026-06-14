import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  atualizarSala,
  criarSala,
  excluirSala,
  inativarSala,
  listarSalas,
  listarSalasAtivasParaAgenda,
  reativarSala,
} from "../services";
import type { ResumoSalas, Sala, SalaPayload } from "../types";

export const CHAVES_SALAS = {
  todas: ["salas"] as const,
  ativasParaAgenda: ["salas", "ativas-para-agenda"] as const,
};

export const CHAVE_SALAS = CHAVES_SALAS.todas;

function calcularResumoSalas(salas: Sala[]): ResumoSalas {
  const ativas = salas.filter((sala) => Boolean(sala.ativo)).length;

  return {
    ativas,
    inativas: salas.length - ativas,
    gerais: salas.filter((sala) => sala.tipo === "geral").length,
    infantis: salas.filter((sala) => sala.tipo === "infantil").length,
  };
}

export function useSalas() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: CHAVES_SALAS.todas,
    queryFn: listarSalas,
  });

  const resumoQuery = useQuery({
    queryKey: CHAVES_SALAS.todas,
    queryFn: listarSalas,
    select: calcularResumoSalas,
  });

  // Cache e invalidação do TanStack Query: qualquer alteração em salas
  // invalida a listagem de Configurações e a futura listagem ativa da Agenda.
  const invalidarSalas = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: CHAVES_SALAS.todas }),
      queryClient.invalidateQueries({
        queryKey: CHAVES_SALAS.ativasParaAgenda,
      }),
    ]);

  const criar = useMutation({
    mutationFn: criarSala,
    onSuccess: invalidarSalas,
  });

  const atualizar = useMutation({
    mutationFn: ({ id, dados }: { id: number; dados: SalaPayload }) =>
      atualizarSala(id, dados),
    onSuccess: invalidarSalas,
  });

  const inativar = useMutation({
    mutationFn: inativarSala,
    onSuccess: invalidarSalas,
  });

  const reativar = useMutation({
    mutationFn: reativarSala,
    onSuccess: invalidarSalas,
  });

  const excluir = useMutation({
    mutationFn: excluirSala,
    onSuccess: invalidarSalas,
  });

  return { query, resumoQuery, criar, atualizar, inativar, reativar, excluir };
}

export function useSalasAtivasParaAgenda() {
  return useQuery({
    queryKey: CHAVES_SALAS.ativasParaAgenda,
    queryFn: listarSalasAtivasParaAgenda,
  });
}
