"use client";

import { useQuery } from "@tanstack/react-query";
import { relatoriosService } from "../services/relatoriosService";
import type { FiltrosRelatorios } from "../types/relatorios.types";

export function useAgendamentosFuturos(
  filtros: FiltrosRelatorios,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["relatorios", "agendamentos-futuros", filtros],
    queryFn: () => relatoriosService.agendamentosFuturos(filtros),
    enabled: options.enabled ?? true,
  });
}

