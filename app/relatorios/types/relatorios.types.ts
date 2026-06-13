export interface FiltrosRelatorios {
  data_inicio?: string;
  data_fim?: string;
  psicologo_id?: number;
  sala_id?: number;
  status?: string;
  paciente_id?: number;
  letra_inicial?: string;
  psicologo_responsavel_id?: number;
}

export type CategoriaRelatorio =
  | "visao_geral"
  | "agenda"
  | "pacientes"
  | "salas";

export interface OpcaoRelatorio {
  id: number;
  nome: string;
  tipo?: string;
}

export interface FiltrosRelatoriosResponse {
  success: boolean;
  data: {
    psicologos: OpcaoRelatorio[];
    salas: OpcaoRelatorio[];
    pacientes: Array<
      OpcaoRelatorio & {
        ativo: number;
        status_atendimento: string;
        psicologo_responsavel_nome?: string | null;
      }
    >;
    status_consulta: string[];
    status_paciente: string[];
    tipos_atendimento: string[];
  };
}

export interface RelatoriosResumo {
  pacientes: {
    total: number;
    ativos: number;
    inativos: number;
    fila_espera: number;
    em_atendimento: number;
    encerrados: number;
  };
  consultas: {
    total: number;
    agendadas: number;
    remarcadas: number;
    canceladas: number;
    faltas: number;
    concluidas: number;
    taxa_faltas: number | null;
  };
  agendamentos_futuros: number;
  tempo_medio_acompanhamento_dias: number | null;
  salas: {
    total: number;
    ativas: number;
    inativas: number;
  };
  observacoes: string[];
}

export interface AtendimentosPsicologo {
  psicologo_id: number;
  psicologo_nome: string;
  total: number;
  concluidos: number;
  faltas: number;
  cancelados: number;
  pendentes: number;
}

export interface VisaoGeralRelatorioDados {
  atendimentosPorPsicologo?: AtendimentosPsicologo[];
  pacientesStatus?: PacientesStatus | null;
  pacientesEspera?: PacienteEspera[];
  agendamentosFuturos?: AgendamentoFuturo[];
}

export interface ConsultaStatus {
  status: string;
  total: number;
}

export interface PacientesStatus {
  total: number;
  ativos: number;
  inativos: number;
  fila_espera: number;
  em_atendimento: number;
  encerrados: number;
  tempo_medio_acompanhamento_dias: number | null;
}

export interface TaxaFaltas {
  resumo: {
    total_consultas: number;
    total_faltas: number;
    taxa_faltas: number | null;
  };
  por_psicologo: Array<{
    psicologo_id: number;
    psicologo_nome: string;
    total_consultas: number;
    total_faltas: number;
    taxa_faltas: number | null;
  }>;
  observacao: string;
}

export interface OcupacaoSala {
  sala_id: number;
  sala_nome: string;
  sala_tipo: string;
  ativo: number;
  total_consultas: number;
  concluidas: number;
  futuras_ou_pendentes: number;
  faltas: number;
  canceladas: number;
  horas_ocupadas: number | null;
  horarios_mais_utilizados: string | null;
}

export interface AgendamentoFuturo {
  id: number;
  paciente_id: number;
  paciente_nome: string;
  psicologo_id: number;
  psicologo_nome: string;
  sala_id: number;
  sala_nome: string;
  data_consulta: string;
  horario_inicio: string;
  horario_fim: string;
  tipo_atendimento: string;
  tipo_outro: string | null;
  status: string;
}

export interface PacienteEspera {
  id: number;
  nome: string;
  cpf: string | null;
  telefone: string;
  email: string | null;
  tipo: string;
  criado_em: string;
  idade: number;
  status_atendimento: string;
  responsavel_nome: string | null;
  psicologo_responsavel_nome?: string | null;
}

export interface PacienteDetalhado {
  id: number;
  nome: string;
  telefone: string;
  email: string | null;
  tipo: string;
  ativo: number;
  status_atendimento: string;
  criado_em: string;
  atualizado_em: string;
  encerrado_em: string | null;
  psicologo_responsavel_id: number | null;
  psicologo_responsavel_nome: string | null;
  psicologo_responsavel_crp: string | null;
  psicologo_responsavel_atribuido_em: string | null;
  tempo_acompanhamento_dias: number | null;
}

export interface ApiRelatoriosResponse<T> {
  success: boolean;
  data: T;
  observacao?: string;
}

export interface RelatorioPrintLinha {
  [coluna: string]: string | number | null;
}

export interface RelatorioPrintSecao {
  titulo: string;
  colunas: string[];
  linhas: RelatorioPrintLinha[];
}

export interface RelatorioPrintConfig {
  titulo: string;
  secoes: RelatorioPrintSecao[];
}

