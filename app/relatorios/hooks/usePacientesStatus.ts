"use client";

import { useQuery } from "@tanstack/react-query";
import { relatoriosService } from "../services/relatoriosService";
import type { FiltrosRelatorios } from "../types/relatorios.types";

export function usePacientesStatus(
  filtros: FiltrosRelatorios = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["relatorios", "pacientes-status", filtros],
    queryFn: () => relatoriosService.pacientesStatus(filtros),
    enabled: options.enabled ?? true,
  });
}

