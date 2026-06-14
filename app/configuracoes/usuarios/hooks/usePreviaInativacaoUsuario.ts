import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { obterPreviaInativacaoUsuario } from "../services/usuariosSistemaService";

export function usePreviaInativacaoUsuario() {
  return useMutation({
    mutationFn: obterPreviaInativacaoUsuario,
    onError: (error: Error) => toast.error(error.message),
  });
}
