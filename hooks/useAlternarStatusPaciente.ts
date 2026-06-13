// hooks/useAlternarStatusPaciente.ts
// Hook para inativar/reativar um paciente (alternar campo ativo entre 0 e 1). Após sucesso, invalida as queries de lista e do paciente individual, garantindo que o modal de detalhes mostre o estado correto imediatamente.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAutenticacao } from "./useAutenticacao";

interface AlternarStatusResponse {
  success: boolean;
  message: string;
}

async function alternarStatusPaciente(
  id: number,
  ativo: boolean,
  usuarioId: number,
): Promise<AlternarStatusResponse> {
  const response = await fetch(`/api/pacientes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ativo, usuario_id: usuarioId }),
  });
  const resultado = await response.json();
  if (!response.ok) {
    throw new Error(resultado.error || "Erro ao alterar status");
  }
  return resultado;
}

export function useAlternarStatusPaciente() {
  const queryClient = useQueryClient();
  const { usuario } = useAutenticacao();

  return useMutation({
    mutationFn: ({ id, ativo }: { id: number; ativo: boolean }) => {
      if (!usuario?.id) throw new Error("Usuário não autenticado");
      return alternarStatusPaciente(id, ativo, usuario.id);
    },
    onSuccess: (_, { id, ativo }) => {
      // Invalida a listagem geral e também os dados individuais do paciente
      queryClient.invalidateQueries({ queryKey: ["pacientes"] });
      queryClient.invalidateQueries({ queryKey: ["paciente", id] }); // ESSENCIAL
      const mensagem = ativo
        ? "Paciente reativado com sucesso"
        : "Paciente inativado com sucesso";
      toast.success(mensagem);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

