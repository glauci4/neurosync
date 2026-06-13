export type TipoSala = "geral" | "infantil";

export interface Sala {
  id: number;
  clinica_id: number;
  nome: string;
  tipo: TipoSala;
  ativo: boolean | number;
  possui_consultas?: boolean | number;
  criado_em?: string;
  atualizado_em?: string;
  deleted_at?: string | null;
}

export interface SalaPayload {
  nome: string;
  tipo: TipoSala;
  ativo?: boolean;
}

export interface ResumoSalas {
  ativas: number;
  inativas: number;
  gerais: number;
  infantis: number;
}
