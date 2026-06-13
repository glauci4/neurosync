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

export async function validarResponsavelClinica(connection: ConexaoMySQLBase) {
  return carregarSessaoClinica(connection);
}

