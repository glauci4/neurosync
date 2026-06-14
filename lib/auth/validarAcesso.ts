import type { RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import type { getConnection } from "@/lib/mysql";

export type ConexaoMySQL = Awaited<ReturnType<typeof getConnection>>;

export interface SessaoClinicaAutenticada {
  id: number;
  email: string;
  nome: string;
  clinica_id: number;
  perfil_id: number;
  ativo: boolean;
  responsavel_clinica_id: number | null;
  isAdminClinica: boolean;
  isResponsavelClinica: boolean;
}

export async function obterSessaoCookieClinica() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("usuario_neurosync");
  if (!sessionCookie) return null;

  try {
    return JSON.parse(sessionCookie.value) as {
      id: number;
      email: string;
      clinica_id: number;
    };
  } catch {
    return null;
  }
}

export function determinarAdminClinica(
  perfil_id: number,
  usuarioId: number,
  responsavelClinicaId: number | null,
) {
  return (
    Number(perfil_id) === 2 &&
    Boolean(responsavelClinicaId) &&
    Number(usuarioId) === Number(responsavelClinicaId)
  );
}

export function determinarResponsavelClinica(
  usuarioId: number,
  responsavelClinicaId: number | null,
) {
  return (
    Boolean(responsavelClinicaId) &&
    Number(usuarioId) === Number(responsavelClinicaId)
  );
}

export function validarUsuarioAtivo(
  usuario: RowDataPacket & { ativo?: boolean | number | null },
) {
  return Number(usuario.ativo ?? 0) === 1;
}

export function validarClinicaUsuario(usuario: { clinica_id?: number | null }) {
  return Boolean(usuario.clinica_id);
}

export function validarPsicologoPerfil(perfil_id: number) {
  return Number(perfil_id) === 2;
}

export function validarSecretariaPerfil(perfil_id: number) {
  return Number(perfil_id) === 1;
}

export async function carregarSessaoClinica(
  connection: ConexaoMySQL,
  sessaoCookie?: { id: number; email: string; clinica_id: number } | null,
): Promise<
  | { ok: true; usuario: SessaoClinicaAutenticada }
  | { ok: false; status: number; error: string }
> {
  const sessao = sessaoCookie || (await obterSessaoCookieClinica());
  if (!sessao) {
    return { ok: false, status: 401, error: "Não autenticado" };
  }

  if (!sessao.clinica_id) {
    return { ok: false, status: 403, error: "Usuário sem clínica vinculada" };
  }

  const [usuarios] = await connection.execute<RowDataPacket[]>(
    `SELECT u.id, u.nome, u.email, u.clinica_id, u.perfil_id,
            COALESCE(u.ativo, 1) AS ativo,
            c.responsavel_clinica_id
     FROM usuarios u
     INNER JOIN clinicas c ON c.id = u.clinica_id
     WHERE u.id = ? AND u.clinica_id = ?`,
    [sessao.id, sessao.clinica_id],
  );

  if (usuarios.length === 0) {
    return { ok: false, status: 401, error: "Sessão inválida" };
  }

  const usuario = usuarios[0];
  if (!validarUsuarioAtivo(usuario)) {
    return {
      ok: false,
      status: 403,
      error: "Usuário inativo. Entre em contato com o responsável da clínica.",
    };
  }

  const responsavel_clinica_id = usuario.responsavel_clinica_id
    ? Number(usuario.responsavel_clinica_id)
    : null;
  const isResponsavelClinica = determinarResponsavelClinica(
    Number(usuario.id),
    responsavel_clinica_id,
  );
  const isAdminClinica = determinarAdminClinica(
    Number(usuario.perfil_id),
    Number(usuario.id),
    responsavel_clinica_id,
  );

  return {
    ok: true,
    usuario: {
      id: Number(usuario.id),
      email: String(usuario.email || sessao.email),
      nome: String(usuario.nome || ""),
      clinica_id: Number(usuario.clinica_id),
      perfil_id: Number(usuario.perfil_id),
      ativo: true,
      responsavel_clinica_id,
      isAdminClinica,
      isResponsavelClinica,
    },
  };
}
