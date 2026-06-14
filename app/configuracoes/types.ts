// app/configuracoes/types.ts
export interface PerfilData {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  crp: string;
  especialidade: string;
  avatar_url: string | null; // pode ser null
  assinatura_profissional_url?: string | null;
  perfil_id: number;
  perfil: string;
  ativo?: boolean | number | null;
  criado_em?: string | null;
  atualizado_em?: string | null;
  ultimo_acesso?: string | null;
  status?: string;
}

export interface ClinicaData {
  id: number;
  cnpj: string;
  nome_fantasia: string;
  razao_social: string;
  nome_sidebar?: string | null;
  telefone: string;
  whatsapp?: string | null;
  email: string;
  site?: string | null;
  descricao_institucional?: string | null;
  crp_clinica?: string | null;
  endereco: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
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
  total_campos_configurados?: number;
  total_campos_pendentes?: number;
}
