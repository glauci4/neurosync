"use client";

import { useQuery } from "@tanstack/react-query";
import { relatoriosService } from "../services/relatoriosService";
import type { FiltrosRelatorios } from "../types/relatorios.types";

export function useRelatoriosResumo(
  filtros: FiltrosRelatorios,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["relatorios", "resumo", filtros],
    queryFn: () => relatoriosService.resumo(filtros),
    enabled: options.enabled ?? true,
  });
}

