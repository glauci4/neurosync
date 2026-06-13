// app/configuracoes/funcionamento/hooks/useExcecoes.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { buscarExcecoes, criarExcecao, excluirExcecao } from "../services";
import type { Excecao } from "../types";

export const CHAVE_EXCECOES_FUNCIONAMENTO = ["funcionamento-excecoes"] as const;

export function useExcecoes() {
  const queryClient = useQueryClient();

  const query = useQuery<Excecao[]>({
    queryKey: CHAVE_EXCECOES_FUNCIONAMENTO,
    queryFn: buscarExcecoes,
    staleTime: 5 * 60 * 1000,
  });

  const criar = useMutation({
    mutationFn: criarExcecao,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CHAVE_EXCECOES_FUNCIONAMENTO,
      });
    },
  });

  const excluir = useMutation({
    mutationFn: excluirExcecao,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CHAVE_EXCECOES_FUNCIONAMENTO,
      });
    },
  });

  return { query, criar, excluir };
}

