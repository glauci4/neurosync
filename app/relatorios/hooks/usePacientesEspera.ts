"use client";

import { useQuery } from "@tanstack/react-query";
import { relatoriosService } from "../services/relatoriosService";
import type { FiltrosRelatorios } from "../types/relatorios.types";

export function usePacientesEspera(
  filtros: FiltrosRelatorios = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["relatorios", "pacientes-espera", filtros],
    queryFn: () => relatoriosService.pacientesEspera(filtros),
    enabled: options.enabled ?? true,
  });
}

