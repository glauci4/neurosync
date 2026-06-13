import { useQuery } from "@tanstack/react-query";
import { listarUsuariosSistema } from "../services/usuariosSistemaService";
import type { FiltrosUsuariosSistema } from "../types/usuariosSistema.types";

export const CHAVE_USUARIOS_SISTEMA = ["usuarios-sistema"] as const;

export function useUsuariosSistema(
  filtros: FiltrosUsuariosSistema,
  habilitado = true,
) {
  return useQuery({
    queryKey: [...CHAVE_USUARIOS_SISTEMA, filtros],
    queryFn: () => listarUsuariosSistema(filtros),
    enabled: habilitado,
  });
}
