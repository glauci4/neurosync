// app/inicio/types/index.ts

export type StatusConsultaInicio =
  | "agendado"
  | "em_andamento"
  | "concluido"
  | "pendente"
  | "cancelado"
  | "falta"
  | "remarcado";

export interface Consulta {
  id: number;
  horario: string;
  horarioFim?: string;
  paciente: string;
  psicologo?: string | null;
  sala: string;
  tipoAtendimento: string;
  status: StatusConsultaInicio;
}

export interface Metricas {
  consultasHoje: {
    total: number;
    concluidas: number;
    variacao: string;
    variacaoTipo: "up" | "down";
  };
  pacientesAtivos: {
    total: number;
    variacao: string;
    variacaoTipo: "up" | "down";
  };
  prontuarios: {
    total: number;
    label: string;
  };
  taxaPresenca: {
    total: number;
    variacao: string;
    variacaoTipo: "up" | "down";
  };
}
