// Tipos compartilhados do módulo de funcionamento

export interface Horario {
  id?: number;
  dia_semana: number; // 0 = Domingo … 6 = Sábado
  data_especifica?: string | null;
  tipo?: string;
  hora_inicio: string;
  hora_fim: string;
  intervalo_inicio: string | null;
  intervalo_fim: string | null;
  ativo: boolean;
}

export type AlvoMassa =
  | "todos"
  | "uteis"
  | "finsDeSemana"
  | "sabados"
  | "domingos"
  | "mesInteiro";

export interface AplicacaoMensalFuncionamento {
  mes: number | null; // null = todos os meses válidos do ano selecionado
  ano: number;
  dias_semana: number[];
  hora_inicio: string;
  hora_fim: string;
  intervalo_inicio: string | null;
  intervalo_fim: string | null;
}

export interface AplicacaoPontualFuncionamento extends Horario {
  data_especifica: string;
}

export interface Excecao {
  id: number;
  tipo: "feriado" | "ferias" | "bloqueio" | "excecao";
  data_especifica: string;
  data_fim?: string | null;
  hora_inicio?: string | null;
  hora_fim?: string | null;
  descricao?: string | null;
  ativo: number;
}
