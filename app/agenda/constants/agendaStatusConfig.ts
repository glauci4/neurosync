import {
  CalendarCheck2,
  CalendarClock,
  CalendarOff,
  CalendarX2,
} from "lucide-react";
import type { ComponentType } from "react";
import { LuCalendarCheck } from "react-icons/lu";

export type AgendaStatus =
  | "agendado"
  | "remarcado"
  | "cancelado"
  | "falta"
  | "concluido";

export const AGENDA_STATUS_OFICIAIS: AgendaStatus[] = [
  "agendado",
  "remarcado",
  "cancelado",
  "falta",
  "concluido",
];

// Status da consulta. Não confundir com status clínico do paciente:
// fila_espera, em_atendimento e encerrado pertencem ao módulo Pacientes.
export const agendaStatusConfig = {
  agendado: {
    texto: "Agendado",
    icone: CalendarCheck2,
    descricao: "Consulta marcada, paciente virá",
    corEvento: "#9F64AF",
    cores: {
      fundo: "#F3EAF8",
      texto: "#5F2D6D",
      borda: "#D9BCE8",
      hover: "#EADCF2",
    },
    badge: "border-[#D9BCE8] bg-[#F3EAF8] text-[#5F2D6D] hover:bg-[#EADCF2]",
    regras: {
      podeEditar: true,
      podeRemarcar: false,
      podeCancelar: true,
      podeMarcarFalta: true,
      podeConcluir: true,
      ocupaAgenda: true,
      mantemHistorico: true,
    },
  },
  remarcado: {
    texto: "Remarcado",
    icone: CalendarClock,
    descricao: "Consulta foi reagendada",
    corEvento: "#7467D0",
    cores: {
      fundo: "#ECE9FF",
      texto: "#433082",
      borda: "#CBC5FF",
      hover: "#E1DCFF",
    },
    badge: "border-[#CBC5FF] bg-[#ECE9FF] text-[#433082] hover:bg-[#E1DCFF]",
    regras: {
      podeEditar: true,
      podeRemarcar: true,
      podeCancelar: true,
      podeMarcarFalta: true,
      podeConcluir: true,
      ocupaAgenda: true,
      mantemHistorico: true,
    },
  },
  cancelado: {
    texto: "Cancelado",
    icone: CalendarX2,
    descricao: "Avisou que não virá",
    corEvento: "#C84C57",
    cores: {
      fundo: "#FEECEC",
      texto: "#9F2F36",
      borda: "#F4B8BE",
      hover: "#FBDDE1",
    },
    badge: "border-[#F4B8BE] bg-[#FEECEC] text-[#9F2F36] hover:bg-[#FBDDE1]",
    regras: {
      podeEditar: false,
      podeRemarcar: false,
      podeCancelar: false,
      podeMarcarFalta: false,
      podeConcluir: false,
      ocupaAgenda: false,
      mantemHistorico: true,
    },
  },
  falta: {
    texto: "Falta",
    icone: CalendarOff,
    descricao: "Não compareceu sem aviso",
    corEvento: "#C47A22",
    cores: {
      fundo: "#FFF3E6",
      texto: "#9A5A17",
      borda: "#F4C98E",
      hover: "#FFE8C7",
    },
    badge: "border-[#F4C98E] bg-[#FFF3E6] text-[#9A5A17] hover:bg-[#FFE8C7]",
    regras: {
      podeEditar: false,
      podeRemarcar: false,
      podeCancelar: false,
      podeMarcarFalta: false,
      podeConcluir: false,
      ocupaAgenda: false,
      mantemHistorico: true,
    },
  },
  concluido: {
    texto: "Concluído",
    icone: LuCalendarCheck,
    descricao: "Consulta realizada",
    corEvento: "#3F9B66",
    cores: {
      fundo: "#EAF8F0",
      texto: "#2F7A4E",
      borda: "#B8E1C7",
      hover: "#DDF2E6",
    },
    badge: "border-[#B8E1C7] bg-[#EAF8F0] text-[#2F7A4E] hover:bg-[#DDF2E6]",
    regras: {
      podeEditar: false,
      podeRemarcar: false,
      podeCancelar: false,
      podeMarcarFalta: false,
      podeConcluir: false,
      ocupaAgenda: false,
      mantemHistorico: true,
      preparaProntuario: true,
    },
  },
} as const satisfies Record<
  AgendaStatus,
  {
    texto: string;
    icone: ComponentType<{ size?: number; className?: string }>;
    descricao: string;
    corEvento: string;
    cores: {
      fundo: string;
      texto: string;
      borda: string;
      hover: string;
    };
    badge: string;
    regras: {
      podeEditar: boolean;
      podeRemarcar: boolean;
      podeCancelar: boolean;
      podeMarcarFalta: boolean;
      podeConcluir: boolean;
      ocupaAgenda: boolean;
      mantemHistorico: boolean;
      preparaProntuario?: boolean;
    };
  }
>;

export const agendaStatusOpcoes = AGENDA_STATUS_OFICIAIS.map((valor) => {
  const config = agendaStatusConfig[valor];
  return {
    valor,
    label: config.texto,
    descricao: config.descricao,
    icone: config.icone,
  };
});

export function obterAgendaStatusConfig(status?: string) {
  if (status && status in agendaStatusConfig) {
    return agendaStatusConfig[status as AgendaStatus];
  }

  return agendaStatusConfig.agendado;
}

