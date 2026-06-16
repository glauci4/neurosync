export type ConsultaHistoricoPaciente = {
  id: number;
  data_consulta: string;
  horario_inicio: string;
  horario_fim: string;
  status: string;
  tipo_atendimento: string;
  tipo_outro?: string | null;
  observacoes?: string | null;
  sala_nome?: string | null;
  psicologo_nome?: string | null;
  prontuario_id?: number | null;
  prontuario_status?: "rascunho" | "finalizado" | "assinado" | string | null;
};

export type HistoricoConsultasPacientePrintConfig = {
  pacienteNome: string;
  consultas: ConsultaHistoricoPaciente[];
};
