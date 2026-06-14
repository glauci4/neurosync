// hooks/useExcluirPaciente.ts
// Hook para exclusão permanente (lógica) de paciente.
// Só deve ser usado quando o paciente NÃO possui consultas (podeExcluir = true). A rota DELETE decide se exclui logicamente (deleted_at) ou apenas inativa, mas este hook é chamado apenas para pacientes sem consultas (podeExcluir = true).

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAutenticacao } from "./useAutenticacao";

interface ExcluirResponse {
  success: boolean;
  message: string;
  tipo_operacao: "excluido" | "inativado";
}

async function excluirPaciente(
  id: number,
  usuarioId: number,
): Promise<ExcluirResponse> {
  const response = await fetch(`/api/pacientes/${id}?usuario_id=${usuarioId}`, {
    method: "DELETE",
  });
  const resultado = await response.json();
  if (!response.ok) {
    throw new Error(resultado.error || "Erro ao processar exclusão");
  }
  return resultado;
}

export function useExcluirPaciente() {
  const queryClient = useQueryClient();
  const { usuario } = useAutenticacao();

  return useMutation({
    mutationFn: (id: number) => {
      if (!usuario?.id) throw new Error("Usuário não autenticado");
      return excluirPaciente(id, usuario.id);
    },
    onSuccess: (data, variables) => {
      // Invalida a listagem de pacientes (qualquer filtro) e a query específica do paciente
      queryClient.invalidateQueries({ queryKey: ["pacientes"] });
      queryClient.invalidateQueries({ queryKey: ["paciente", variables] });

      // Exibe a mensagem retornada pela API (já apropriada para exclusão ou inativação)
      toast.success(data.message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
