import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { criarUsuarioSistema } from "../services/usuariosSistemaService";
import type { CriarUsuarioSistemaPayload } from "../types/usuariosSistema.types";
import { CHAVE_USUARIOS_SISTEMA } from "./useUsuariosSistema";

export function useCriarUsuarioSistema() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dados: CriarUsuarioSistemaPayload) =>
      criarUsuarioSistema(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAVE_USUARIOS_SISTEMA });
      toast.success("Usuário cadastrado");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
