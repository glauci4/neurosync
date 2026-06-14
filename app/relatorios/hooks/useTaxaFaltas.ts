"use client";

import { useQuery } from "@tanstack/react-query";
import { relatoriosService } from "../services/relatoriosService";
import type { FiltrosRelatorios } from "../types/relatorios.types";

export function useTaxaFaltas(
  filtros: FiltrosRelatorios,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["relatorios", "taxa-faltas", filtros],
    queryFn: () => relatoriosService.taxaFaltas(filtros),
    enabled: options.enabled ?? true,
  });
}
