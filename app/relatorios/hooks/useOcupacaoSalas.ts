"use client";

import { useQuery } from "@tanstack/react-query";
import { relatoriosService } from "../services/relatoriosService";
import type { FiltrosRelatorios } from "../types/relatorios.types";

export function useOcupacaoSalas(
  filtros: FiltrosRelatorios,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["relatorios", "ocupacao-salas", filtros],
    queryFn: () => relatoriosService.ocupacaoSalas(filtros),
    enabled: options.enabled ?? true,
  });
}

