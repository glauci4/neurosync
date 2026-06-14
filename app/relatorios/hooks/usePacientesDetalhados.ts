"use client";

import { useQuery } from "@tanstack/react-query";
import { relatoriosService } from "../services/relatoriosService";
import type { FiltrosRelatorios } from "../types/relatorios.types";

export function usePacientesDetalhados(
  filtros: FiltrosRelatorios = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["relatorios", "pacientes-detalhados", filtros],
    queryFn: () => relatoriosService.pacientesDetalhados(filtros),
    enabled: options.enabled ?? true,
  });
}
