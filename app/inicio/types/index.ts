// app/inicio/types/index.ts

export interface Consulta {
  id: number;
  horario: string;
  paciente: string;
  sala: string;
  status: 'agendado' | 'concluido' | 'falta';
}

export interface Metricas {
  consultasHoje: {
    total: number;
    concluidas: number;
    variacao: string;
    variacaoTipo: 'up' | 'down';
  };
  pacientesAtivos: {
    total: number;
    variacao: string;
    variacaoTipo: 'up' | 'down';
  };
  prontuarios: {
    total: number;
    label: string;
  };
  taxaPresenca: {
    total: number;
    variacao: string;
    variacaoTipo: 'up' | 'down';
  };
}