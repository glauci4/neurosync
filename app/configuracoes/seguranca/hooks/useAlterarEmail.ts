import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CHAVE_PERFIL_USUARIO } from "../../perfil-profissional/hooks/usePerfilUsuario";
import { alterarEmail } from "../services/segurancaService";

export function useAlterarEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: alterarEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAVE_PERFIL_USUARIO });
    },
  });
}

