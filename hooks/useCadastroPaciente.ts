// hooks/useCadastroPaciente.ts
// Hook personalizado para gerenciar o cadastro de pacientes via React Query
// Fornece estado de carregamento, erro, sucesso e função para resetar os estados. Utiliza toast para notificações elegantes no lugar de alert.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner"; // Biblioteca de notificações estilizadas
import { useAutenticacao } from "./useAutenticacao";

// Interface dos dados enviados para a API

interface DadosPaciente {
  tipo: "adulto" | "menor";
  nome: string;
  data_nascimento: string;
  genero: string;
  raca_etnia: string;
  cpf?: string;
  telefone: string;
  telefone_alternativo?: string;
  email?: string;
  possui_deficiencia: boolean;
  descricao_deficiencia?: string;
  renda_familiar?: number | null;
  possui_cadastro_unico: boolean;
  cep?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  observacoes?: string;
  responsavel?: {
    nome: string;
    cpf?: string;
    telefone: string;
    grau_parentesco: string;
    mesmo_endereco_paciente?: boolean;
    sem_numero?: boolean; // Indica que o endereço não tem número
    cep?: string;
    rua?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
  };
  contato_emergencia?: {
    nome: string;
    telefone: string;
    parentesco?: string;
  };
}

// Função que realiza a chamada HTTP para a API de pacientes
// @param dados - Dados do paciente (adulto ou menor)
// @param usuarioId - ID do usuário autenticado (para associar à clínica)
// @returns Promise com o resultado da API

async function criarPaciente(dados: DadosPaciente, usuarioId: number) {
  const response = await fetch("/api/pacientes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...dados, usuario_id: usuarioId }),
  });
  const resultado = await response.json();
  if (!response.ok) {
    // Lança um erro com a mensagem vinda da API ou genérica
    throw new Error(resultado.error || "Erro ao cadastrar paciente");
  }
  return resultado;
}

// Hook principal que encapsula a mutação com React Query
// @returns Objeto contendo:
//   mutate: função para disparar o cadastro
//   isPending: booleano indicando carregamento
//   error: objeto de erro (se houver)
//   isSuccess: booleano indicando sucesso
//   reset: função para limpar o estado da mutação (erro, isSuccess, etc.)

export function useCadastroPaciente() {
  const queryClient = useQueryClient();
  const { usuario } = useAutenticacao();

  const mutation = useMutation({
    // Função de mutation: recebe os dados e chama a API com o ID do usuário atual
    mutationFn: (dados: DadosPaciente) => {
      if (!usuario?.id) {
        throw new Error("Usuário não autenticado");
      }
      return criarPaciente(dados, usuario.id);
    },
    // Em caso de sucesso, invalida a query de pacientes e exibe toast de sucesso
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pacientes"] });
      toast.success("Paciente cadastrado com sucesso!");
    },
    // Em caso de erro, exibe toast com a mensagem de erro
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Retorna todos os objetos da mutation mais a função reset
  // O reset serve para limpar os estados (error, isSuccess, etc.) após o uso
  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset, // Permite resetar os estados do formulário
  };
}
