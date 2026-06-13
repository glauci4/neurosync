export type TipoPacienteImportacao = "adulto" | "menor";

export type StatusLinhaImportacao =
  | "valido"
  | "invalido"
  | "duplicado"
  | "importado"
  | "ignorado";

export interface LinhaImportacaoPaciente {
  linha: number;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  data_nascimento: string;
  tipo: TipoPacienteImportacao | "";
  responsavel_nome: string;
  responsavel_cpf: string;
  observacoes: string;
  erros: string[];
  status: StatusLinhaImportacao;
}

export interface ResultadoLinhaImportacao {
  linha: number;
  nome: string;
  cpf: string;
  status: StatusLinhaImportacao;
  erros: string[];
  paciente_id?: number;
}

export interface ResumoImportacaoPacientes {
  total: number;
  importados: number;
  ignorados: number;
  invalidos: number;
}

export interface ImportarPacientesResponse {
  success: boolean;
  resumo: ResumoImportacaoPacientes;
  resultados: ResultadoLinhaImportacao[];
  message?: string;
}

export interface ImportarPacientesPayload {
  pacientes: LinhaImportacaoPaciente[];
}

