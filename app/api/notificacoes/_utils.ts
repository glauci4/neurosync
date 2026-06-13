import type { RowDataPacket } from "mysql2";
import {
  type ConexaoMySQL,
  carregarSessaoClinica,
} from "@/lib/auth/validarAcesso";

export async function validarAcessoNotificacoes(connection: ConexaoMySQL) {
  const acesso = await carregarSessaoClinica(connection);
  if (!acesso.ok) return acesso;

  return {
    ok: true as const,
    usuario: acesso.usuario,
  };
}

export interface LinhaNotificacao extends RowDataPacket {
  id: number;
  clinica_id: number;
  usuario_id: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  entidade_tipo: string | null;
  entidade_id: number | null;
  lida: number | boolean;
  lida_em: string | null;
  criado_em: string;
}

