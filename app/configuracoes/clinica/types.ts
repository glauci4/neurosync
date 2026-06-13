export interface ClinicaData {
  id: number;
  cnpj: string;
  nome_fantasia: string;
  razao_social: string;
  nome_sidebar?: string | null;
  telefone: string | null;
  whatsapp?: string | null;
  email: string | null;
  site?: string | null;
  descricao_institucional?: string | null;
  crp_clinica?: string | null;
  endereco: string | null;
  numero: string | null;
  complemento?: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  logo_url: string | null;
  favicon_url?: string | null;
  responsavel_tecnico_nome?: string | null;
  responsavel_tecnico_crp?: string | null;
  responsavel_tecnico_assinatura_url?: string | null;
  responsavel_tecnico_cargo?: string | null;
  permitir_multiplos_psicologos?: boolean | number;
  permitir_compartilhamento_prontuario?: boolean | number;
  exigir_assinatura_evolucoes?: boolean | number;
  bloquear_edicao_apos_assinatura?: boolean | number;
  tempo_maximo_edicao_evolucao?: number | null;
  habilitar_auditoria_clinica?: boolean | number;
  permite_edicao?: boolean;
  total_campos_preenchidos?: number;
  total_campos_pendentes?: number;
}

export interface ClinicaFormState {
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  nome_sidebar: string;
  telefone: string;
  whatsapp: string;
  email: string;
  site: string;
  descricao_institucional: string;
  crp_clinica: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  responsavel_tecnico_nome: string;
  responsavel_tecnico_crp: string;
  responsavel_tecnico_cargo: string;
}

export interface ConfiguracoesInternasFormState {
  permitir_multiplos_psicologos: boolean;
  permitir_compartilhamento_prontuario: boolean;
  exigir_assinatura_evolucoes: boolean;
  bloquear_edicao_apos_assinatura: boolean;
  tempo_maximo_edicao_evolucao: number | null;
  habilitar_auditoria_clinica: boolean;
}

export interface UploadIdentidadeResponse {
  success: boolean;
  message: string;
  logo_url?: string | null;
  favicon_url?: string | null;
}

export interface ClinicaPermissoes {
  podeVisualizarBasico: boolean;
  podeEditar: boolean;
  isAdmin: boolean;
}

export interface ClinicaResponse {
  success: boolean;
  data: ClinicaData;
  permissoes: ClinicaPermissoes;
}

export interface ClinicaUpdatePayload {
  nome_fantasia?: string;
  razao_social?: string;
  nome_sidebar?: string | null;
  cnpj?: string;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  site?: string | null;
  descricao_institucional?: string | null;
  crp_clinica?: string | null;
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  responsavel_tecnico_nome?: string | null;
  responsavel_tecnico_crp?: string | null;
  responsavel_tecnico_cargo?: string | null;
  permitir_multiplos_psicologos?: boolean;
  permitir_compartilhamento_prontuario?: boolean;
  exigir_assinatura_evolucoes?: boolean;
  bloquear_edicao_apos_assinatura?: boolean;
  tempo_maximo_edicao_evolucao?: number | null;
  habilitar_auditoria_clinica?: boolean;
}

export type TipoIdentidadeVisualClinica = "logo" | "favicon";

export interface ResumoOperacionalClinica {
  camposPreenchidos: number;
  contatoAtivo: number;
  identidadePronta: number;
  responsavelCompleto: number;
  regrasAtivas: number;
}

