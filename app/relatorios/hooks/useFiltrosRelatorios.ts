"use client";

import { useQuery } from "@tanstack/react-query";
import { relatoriosService } from "../services/relatoriosService";

export function useFiltrosRelatorios() {
  return useQuery({
    queryKey: ["relatorios", "filtros"],
    queryFn: () => relatoriosService.filtros(),
    staleTime: 5 * 60 * 1000,
  });
}

