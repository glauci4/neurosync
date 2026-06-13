"use client";

import { useQuery } from "@tanstack/react-query";
import { relatoriosService } from "../services/relatoriosService";
import type { FiltrosRelatorios } from "../types/relatorios.types";

export function useAtendimentosPorPsicologo(
  filtros: FiltrosRelatorios,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["relatorios", "atendimentos-por-psicologo", filtros],
    queryFn: () => relatoriosService.atendimentosPorPsicologo(filtros),
    enabled: options.enabled ?? true,
  });
}

