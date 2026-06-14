import type { ConexaoMySQL, SessaoClinicaAutenticada } from "./validarAcesso";
import {
  carregarSessaoClinica,
  determinarAdminClinica,
  determinarResponsavelClinica,
  validarPsicologoPerfil,
  validarSecretariaPerfil,
} from "./validarAcesso";

export type UsuarioClinicaAutenticado = SessaoClinicaAutenticada;
export type { ConexaoMySQL } from "./validarAcesso";

export function usuarioEhAdminClinica(
  usuario: Pick<
    UsuarioClinicaAutenticado,
    "perfil_id" | "id" | "responsavel_clinica_id"
  >,
) {
  return determinarAdminClinica(
    Number(usuario.perfil_id),
    Number(usuario.id),
    usuario.responsavel_clinica_id
      ? Number(usuario.responsavel_clinica_id)
      : null,
  );
}

export function usuarioEhResponsavelClinica(
  usuario: Pick<UsuarioClinicaAutenticado, "id" | "responsavel_clinica_id">,
) {
  return determinarResponsavelClinica(
    Number(usuario.id),
    usuario.responsavel_clinica_id
      ? Number(usuario.responsavel_clinica_id)
      : null,
  );
}

export async function validarUsuarioAtivoClinica(
  connection: ConexaoMySQL,
  sessao?: { id: number; email: string; clinica_id: number } | null,
) {
  return carregarSessaoClinica(connection, sessao);
}

export async function validarClinicaUsuario(
  connection: ConexaoMySQL,
  sessao?: { id: number; email: string; clinica_id: number } | null,
) {
  return carregarSessaoClinica(connection, sessao);
}

export async function validarAdministradorClinica(
  connection: ConexaoMySQL,
  sessao?: { id: number; email: string; clinica_id: number } | null,
) {
  const acesso = await carregarSessaoClinica(connection, sessao);
  if (!acesso.ok) return acesso;
  if (!acesso.usuario.isAdminClinica) {
    return {
      ok: false as const,
      status: 403,
      error: "Acesso restrito ao psicólogo administrador da clínica",
    };
  }
  return acesso;
}

export function validarPsicologo(usuario: { perfil_id: number }) {
  return validarPsicologoPerfil(usuario.perfil_id);
}

export function validarSecretaria(usuario: { perfil_id: number }) {
  return validarSecretariaPerfil(usuario.perfil_id);
}

export function validarUsuarioAtivo(usuario: {
  ativo?: boolean | number | null;
}) {
  return Number(usuario.ativo ?? 0) === 1;
}

export async function validarTransferenciaPaciente(
  connection: ConexaoMySQL,
  sessao?: { id: number; email: string; clinica_id: number } | null,
) {
  return validarAdministradorClinica(connection, sessao);
}

export async function validarInativacaoUsuario(
  connection: ConexaoMySQL,
  sessao?: { id: number; email: string; clinica_id: number } | null,
) {
  return validarAdministradorClinica(connection, sessao);
}
