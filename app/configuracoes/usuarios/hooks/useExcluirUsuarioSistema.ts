import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { excluirUsuarioSistema } from "../services/usuariosSistemaService";
import { CHAVE_USUARIOS_SISTEMA } from "./useUsuariosSistema";

export function useExcluirUsuarioSistema() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: excluirUsuarioSistema,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAVE_USUARIOS_SISTEMA });
      toast.success("Usuário excluído");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
