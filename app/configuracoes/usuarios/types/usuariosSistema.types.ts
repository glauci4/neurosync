export type PerfilUsuarioSistema = "psicologo" | "secretaria";
export type FiltroPerfilUsuario = "todos" | PerfilUsuarioSistema;
export type FiltroStatusUsuario = "todos" | "ativo" | "inativo";

export interface UsuarioSistema {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  perfil: string;
  perfil_id: number;
  ativo: boolean;
  ultimo_acesso: string | null;
  criado_em: string | null;
  avatar_url: string | null;
  isResponsavelClinica: boolean;
  podeExcluir: boolean;
}

export interface PsicologoTransferenciaOpcao {
  id: number;
  nome: string;
}

export interface ResumoInativacaoUsuario {
  pacientes_ativos_vinculados: number;
  pacientes_espera_vinculados: number;
  agendamentos_futuros: number;
  prontuarios_vinculados: number;
  total_pacientes_vinculados: number;
}

export interface PreviaInativacaoUsuario {
  usuario: {
    id: number;
    nome: string;
    perfil_id: number;
    ativo: boolean;
    isResponsavelClinica: boolean;
  };
  resumo: ResumoInativacaoUsuario;
  deve_transferir_pacientes: boolean;
  deve_transferir_administracao: boolean;
  deve_inativar_clinica: boolean;
  psicologos_transferencia: PsicologoTransferenciaOpcao[];
}

export interface FiltrosUsuariosSistema {
  busca: string;
  perfil: FiltroPerfilUsuario;
  status: FiltroStatusUsuario;
}

export interface UsuariosSistemaResponse {
  success: boolean;
  data: UsuarioSistema[];
}

export interface CriarUsuarioSistemaPayload {
  nome: string;
  email: string;
  perfil: PerfilUsuarioSistema;
  senhaInicial: string;
  crp?: string | null;
  cpf?: string | null;
}

export interface AlterarStatusUsuarioSistemaDetalhadoPayload {
  ativo: boolean;
  transferir_admin_para_id?: number;
  inativar_clinica?: boolean;
  transferir_pacientes_para_id?: number;
  motivo_transferencia_pacientes?: string;
  observacoes_transferencia_pacientes?: string | null;
}
