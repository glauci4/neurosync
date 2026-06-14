import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reativarUsuarioSistema } from "../services/usuariosSistemaService";
import { CHAVE_USUARIOS_SISTEMA } from "./useUsuariosSistema";

export function useReativarUsuarioSistema() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reativarUsuarioSistema,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAVE_USUARIOS_SISTEMA });
      toast.success("Usuário reativado");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
