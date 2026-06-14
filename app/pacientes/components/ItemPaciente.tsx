// app/pacientes/components/ItemPaciente.tsx
// Card de paciente clicável com botão de ação textual conforme status de atendimento.

"use client";

import { Mail, Smartphone, User } from "lucide-react"; // BadgeCheck removido da importação
import { HiOutlineIdentification } from "react-icons/hi";
import { formatarCPF, formatarTelefone } from "@/lib/utils";

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

interface ItemPacienteProps {
  paciente: Paciente;
  onIniciarAtendimento: (id: number) => void;
  onEncerrarAtendimento: (id: number) => void;
  onRetomarAtendimento: (id: number) => void;
  onAbrirDetalhes: (id: number) => void;
}

const acaoTexto: Record<string, string> = {
  fila_espera: "Iniciar atendimento",
  em_atendimento: "Encerrar atendimento",
  encerrado: "Retomar atendimento",
};

export default function ItemPaciente({
  paciente,
  onIniciarAtendimento,
  onEncerrarAtendimento,
  onRetomarAtendimento,
  onAbrirDetalhes,
}: ItemPacienteProps) {
  const status = paciente.status_atendimento;
  const isAtivo = paciente.ativo;
  const responsavelNome = paciente.psicologo_responsavel_nome?.trim();

  const handleAcao = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAtivo) return;
    if (status === "fila_espera") onIniciarAtendimento(paciente.id);
    else if (status === "em_atendimento") onEncerrarAtendimento(paciente.id);
    else if (status === "encerrado") onRetomarAtendimento(paciente.id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onAbrirDetalhes(paciente.id)}
      onKeyDown={(evento) => {
        if (evento.key === "Enter" || evento.key === " ") {
          evento.preventDefault();
          onAbrirDetalhes(paciente.id);
        }
      }}
      className="group flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 bg-white/80 p-4 backdrop-blur-sm transition-all duration-200 hover:bg-gray-50/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#9F64AF]/40"
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <User size={16} className="shrink-0 text-gray-400" />
          <h3 className="text-base font-semibold text-gray-800">
            {paciente.nome}
          </h3>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            {paciente.tipo === "adulto" ? "Adulto" : "Menor"}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              status === "fila_espera"
                ? "bg-yellow-100 text-yellow-700"
                : status === "em_atendimento"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
            }`}
          >
            {status === "fila_espera" && "Fila de Espera"}
            {status === "em_atendimento" && "Em Atendimento"}
            {status === "encerrado" && "Encerrado"}
          </span>
          {!isAtivo && (
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700">
              Inativo
            </span>
          )}
          {/* Badge do psicólogo responsável – sem ícone de verificação */}
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
              responsavelNome
                ? "bg-[#F3EAF8] text-[#6F4E7A]"
                : "bg-slate-100 text-slate-500"
            }`}
            title={
              responsavelNome
                ? `Psicólogo responsável: ${responsavelNome}`
                : "Sem responsável clínico"
            }
          >
            <span className="max-w-[180px] truncate">
              {responsavelNome ? responsavelNome : "Sem responsável"}
            </span>
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {paciente.telefone && (
            <div className="flex items-center gap-1 text-gray-500">
              <Smartphone size={12} />
              <span>{formatarTelefone(paciente.telefone)}</span>
            </div>
          )}
          {paciente.email && (
            <div className="flex items-center gap-1 text-gray-500">
              <Mail size={12} />
              <span className="max-w-[200px] truncate">{paciente.email}</span>
            </div>
          )}
          {paciente.cpf && (
            <div className="flex items-center gap-1 text-gray-500">
              <HiOutlineIdentification size={12} />
              <span>{formatarCPF(paciente.cpf)}</span>
            </div>
          )}
        </div>
      </div>

      {isAtivo && (
        <button
          type="button"
          onClick={handleAcao}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-[#9F64AF] hover:text-white"
        >
          {acaoTexto[status]}
        </button>
      )}
    </div>
  );
}
