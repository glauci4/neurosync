// hooks/useInativarPaciente.ts
// Hook para inativar um paciente (apenas marcar ativo = false)
// Não faz exclusão lógica, apenas desativa o paciente, usado quando o paciente possui consultas ou quando o usuário deseja apenas arquivar.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAutenticacao } from "./useAutenticacao";

interface InativarResponse {
  success: boolean;
  message: string;
}

async function inativarPaciente(
  id: number,
  usuarioId: number,
): Promise<InativarResponse> {
  const response = await fetch(`/api/pacientes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ativo: false, usuario_id: usuarioId }),
  });
  const resultado = await response.json();
  if (!response.ok) {
    throw new Error(resultado.error || "Erro ao inativar paciente");
  }
  return resultado;
}

export function useInativarPaciente() {
  const queryClient = useQueryClient();
  const { usuario } = useAutenticacao();

  return useMutation({
    mutationFn: (id: number) => {
      if (!usuario?.id) throw new Error("Usuário não autenticado");
      return inativarPaciente(id, usuario.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pacientes"] });
      toast.info("Paciente inativado com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
