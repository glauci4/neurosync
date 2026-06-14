import { useMutation } from "@tanstack/react-query";
import { alterarSenha } from "../services/segurancaService";

export function useAlterarSenha() {
  return useMutation({
    mutationFn: alterarSenha,
  });
}
