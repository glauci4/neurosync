// app/pacientes/components/ListaPacientes.tsx
// Lista de pacientes com ações de fluxo de atendimento (iniciar, encerrar, retomar), exibe estado vazio com mensagem adequada conforme a aba atual (visibilidade ou status de atendimento).
// Recebe a prop `tipoVazio` para personalizar o estado vazio.

"use client";

import { AlertCircle } from "lucide-react";
import EstadoVazio from "./EstadoVazio";
import ItemPaciente from "./ItemPaciente";

// INTERFACE DOS PROPS

interface Paciente {
  id: number;
  nome: string;
  telefone: string;
  email: string | null;
  cpf: string | null;
  ativo: boolean;
  tipo: "adulto" | "menor";
  status_atendimento: "fila_espera" | "em_atendimento" | "encerrado";
  psicologo_responsavel_id?: number | null;
  psicologo_responsavel_nome?: string | null;
}

interface ListaPacientesProps {
  pacientes: Paciente[];
  isLoading: boolean;
  error?: string;
  status: "ativo" | "inativo" | "todos"; // Filtro de visibilidade (usado na página)
  tipoVazio?: "fila_espera" | "em_atendimento" | "encerrado" | "inativos"; // Tipo específico para estado vazio
  onRefetch: () => void;
  paginaAtual: number;
  totalPaginas: number;
  onMudarPagina: (pagina: number) => void;
  buscaAtiva?: boolean; // Indica se há busca ativa
  onAbrirDetalhes: (id: number) => void; // Abre o modal de detalhes
  onIniciarAtendimento: (id: number) => void;
  onEncerrarAtendimento: (id: number) => void;
  onRetomarAtendimento: (id: number) => void;
}

export default function ListaPacientes({
  pacientes,
  isLoading,
  error,
  status,
  tipoVazio,
  onRefetch,
  paginaAtual,
  totalPaginas,
  onMudarPagina,
  buscaAtiva = false,
  onAbrirDetalhes,
  onIniciarAtendimento,
  onEncerrarAtendimento,
  onRetomarAtendimento,
}: ListaPacientesProps) {
  // ESTADO DE CARREGAMENTO
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#9F64AF] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">Carregando pacientes...</p>
        </div>
      </div>
    );
  }

  // ESTADO DE ERRO
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <AlertCircle className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">
          Erro ao carregar
        </h3>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button
          type="button"
          onClick={() => onRefetch()}
          className="px-4 py-2 bg-[#9F64AF] text-white rounded-lg hover:bg-[#8B509B] transition"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // ESTADO VAZIO
  if (pacientes.length === 0) {
    const mensagemPersonalizada = buscaAtiva
      ? "Nenhum paciente encontrado para a busca realizada."
      : undefined;

    // Callback para abrir o modal de cadastro (apenas quando não há busca ativa)
    const onNovoPaciente = buscaAtiva
      ? undefined
      : () => {
          window.location.href = "/pacientes?cadastrar=1";
        };

    // Converte status 'todos' para 'ativo' para o EstadoVazio (que espera 'ativo' ou 'inativo')
    const statusParaEstadoVazio = status === "todos" ? "ativo" : status;

    return (
      <EstadoVazio
        status={statusParaEstadoVazio}
        tipoVazio={tipoVazio} // passando o tipo específico da aba
        onNovoPaciente={onNovoPaciente}
        mensagemPersonalizada={mensagemPersonalizada}
      />
    );
  }

  // LISTA DE PACIENTES
  return (
    <div className="space-y-3">
      {pacientes.map((paciente) => (
        <ItemPaciente
          key={paciente.id}
          paciente={paciente}
          onIniciarAtendimento={onIniciarAtendimento}
          onEncerrarAtendimento={onEncerrarAtendimento}
          onRetomarAtendimento={onRetomarAtendimento}
          onAbrirDetalhes={onAbrirDetalhes}
        />
      ))}

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            type="button"
            onClick={() => onMudarPagina(paginaAtual - 1)}
            disabled={paginaAtual === 1}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition bg-white"
          >
            Anterior
          </button>
          <span className="px-4 py-1.5 text-sm text-gray-700">
            Página {paginaAtual} de {totalPaginas}
          </span>
          <button
            type="button"
            onClick={() => onMudarPagina(paginaAtual + 1)}
            disabled={paginaAtual === totalPaginas}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition bg-white"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
