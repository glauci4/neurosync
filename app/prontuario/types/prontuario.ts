export type StatusProntuario = "rascunho" | "finalizado" | "assinado";

export type TipoAtendimentoProntuario =
  | "triagem"
  | "psicoterapia"
  | "devolutiva"
  | "avaliacao"
  | "orientacao"
  | "retorno"
  | "alta"
  | "outro";

export interface RegistroClinico {
  id: number;
  paciente_id: number;
  paciente_nome: string;
  psicologo_id: number;
  psicologo_nome: string;
  crp: string | null;
  consulta_id: number | null;
  data_registro: string;
  tipo_atendimento: TipoAtendimentoProntuario;
  conteudo: string;
  status: StatusProntuario;
  assinatura_url: string | null;
  assinado_em: string | null;
  finalizado_em: string | null;
  criado_em: string;
  atualizado_em: string;
  permissao_acesso?: "dono" | "visualizar" | "editar";
  editado_por_id: number | null;
  editado_por_nome: string | null;
  editado_em: string | null;
  assinatura_editor_url: string | null;
  crp_editor: string | null;
}

export interface RegistroClinicoPayload {
  paciente_id: number;
  consulta_id?: number | null;
  data_registro: string;
  tipo_atendimento: TipoAtendimentoProntuario;
  conteudo: string;
  finalizar?: boolean;
}

