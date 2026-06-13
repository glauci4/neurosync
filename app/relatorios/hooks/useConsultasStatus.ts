"use client";

import { useQuery } from "@tanstack/react-query";
import { relatoriosService } from "../services/relatoriosService";
import type { FiltrosRelatorios } from "../types/relatorios.types";

export function useConsultasStatus(
  filtros: FiltrosRelatorios,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["relatorios", "consultas-status", filtros],
    queryFn: () => relatoriosService.consultasStatus(filtros),
    enabled: options.enabled ?? true,
  });
}

