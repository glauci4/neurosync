// hooks/useAtualizarPaciente.ts
// Hook para atualizar os dados de um paciente via PUT. Inclui feedback com toast e invalidação de cache.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAutenticacao } from "./useAutenticacao";

// Interface para os dados de atualização do paciente
interface PacienteUpdateData {
  nome?: string;
  data_nascimento?: string;
  genero?: string;
  raca_etnia?: string;
  cpf?: string;
  telefone?: string;
  telefone_alternativo?: string;
  email?: string;
  tipo?: "adulto" | "menor";
  possui_deficiencia?: boolean;
  descricao_deficiencia?: string;
  renda_familiar?: number;
  possui_cadastro_unico?: boolean;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  observacoes?: string;
  ativo?: boolean;
  sem_numero?: boolean;
}

// Função que chama a API para atualizar o paciente
async function atualizarPaciente(
  id: number,
  dados: PacienteUpdateData,
  usuarioId: number,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/pacientes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...dados, usuario_id: usuarioId }),
  });

  const resultado = await response.json();

  if (!response.ok) {
    throw new Error(resultado.error || "Erro ao atualizar paciente");
  }

  return resultado;
}

// Hook principal
export function useAtualizarPaciente() {
  const queryClient = useQueryClient();
  const { usuario } = useAutenticacao();

  return useMutation({
    mutationFn: ({ id, dados }: { id: number; dados: PacienteUpdateData }) => {
      if (!usuario?.id) {
        throw new Error("Usuário não autenticado");
      }
      return atualizarPaciente(id, dados, usuario.id);
    },
    onSuccess: (_, variables) => {
      // Invalida as queries relacionadas para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ["pacientes"] });
      queryClient.invalidateQueries({ queryKey: ["paciente", variables.id] });
      toast.success("Paciente atualizado com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

