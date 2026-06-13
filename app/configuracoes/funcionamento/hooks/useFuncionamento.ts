// app/configuracoes/funcionamento/hooks/useFuncionamento.ts
// Hook que encapsula a lógica de busca e mutação dos horários semanais

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  buscarHorarios,
  salvarFuncionamentoPontual,
  salvarHorarios,
} from "../services";
import type { Horario } from "../types";

export const CHAVE_FUNCIONAMENTO = ["funcionamento"] as const;

export function useFuncionamento() {
  const queryClient = useQueryClient();

  const query = useQuery<Horario[]>({
    queryKey: CHAVE_FUNCIONAMENTO,
    queryFn: buscarHorarios,
  });

  const mutation = useMutation({
    mutationFn: salvarHorarios,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAVE_FUNCIONAMENTO });
    },
  });

  const mutationPontual = useMutation({
    mutationFn: salvarFuncionamentoPontual,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAVE_FUNCIONAMENTO });
    },
  });

  return { query, mutation, mutationPontual };
}
