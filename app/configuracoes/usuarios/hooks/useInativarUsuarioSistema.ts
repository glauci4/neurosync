import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  inativarUsuarioSistema,
  inativarUsuarioSistemaDetalhado,
} from "../services/usuariosSistemaService";
import { CHAVE_USUARIOS_SISTEMA } from "./useUsuariosSistema";

export function useInativarUsuarioSistema() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      input:
        | number
        | {
            id: number;
            transferir_admin_para_id?: number;
            inativar_clinica?: boolean;
            transferir_pacientes_para_id?: number;
            motivo_transferencia_pacientes?: string;
            observacoes_transferencia_pacientes?: string | null;
          },
    ) => {
      if (typeof input === "number") {
        return inativarUsuarioSistema(input);
      }

      return inativarUsuarioSistemaDetalhado(input.id, {
        transferir_admin_para_id: input.transferir_admin_para_id,
        inativar_clinica: input.inativar_clinica,
        transferir_pacientes_para_id: input.transferir_pacientes_para_id,
        motivo_transferencia_pacientes: input.motivo_transferencia_pacientes,
        observacoes_transferencia_pacientes:
          input.observacoes_transferencia_pacientes,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CHAVE_USUARIOS_SISTEMA });
      queryClient.invalidateQueries({ queryKey: ["paciente"] });
      queryClient.invalidateQueries({ queryKey: ["pacientes"] });
      toast.success(data?.message || "Usuário inativado");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
