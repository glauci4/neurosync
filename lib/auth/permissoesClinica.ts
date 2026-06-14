export {
  type ConexaoMySQL,
  type UsuarioClinicaAutenticado,
  usuarioEhAdminClinica,
  usuarioEhResponsavelClinica,
  validarAdministradorClinica,
  validarClinicaUsuario,
  validarInativacaoUsuario,
  validarPsicologo,
  validarSecretaria,
  validarTransferenciaPaciente,
  validarUsuarioAtivoClinica,
} from "./permissoes";

import type { ConexaoMySQL as ConexaoMySQLBase } from "./validarAcesso";
import { carregarSessaoClinica } from "./validarAcesso";

export async function validarAcessoClinica(
  connection: ConexaoMySQLBase,
  options: { admin?: boolean } = {},
) {
  const acesso = await carregarSessaoClinica(connection);
  if (!acesso.ok) return acesso;
  if (options.admin && !acesso.usuario.isAdminClinica) {
    return {
      ok: false as const,
      status: 403,
      error: "Acesso restrito ao psicólogo administrador da clínica",
    };
  }
  return acesso;
}
