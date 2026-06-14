import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import { getConnection } from "@/lib/mysql";

type ConexaoMySQL = Awaited<ReturnType<typeof getConnection>>;

async function obterSessao(): Promise<{
  id: number;
  clinica_id: number;
} | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("usuario_neurosync");
  if (!cookie) return null;

  try {
    return JSON.parse(cookie.value);
  } catch {
    return null;
  }
}

async function validarResponsavelClinica(
  connection: ConexaoMySQL,
  usuarioId: number,
  clinicaId: number,
) {
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT u.perfil_id, c.responsavel_clinica_id
     FROM usuarios u
     INNER JOIN clinicas c ON c.id = u.clinica_id
     WHERE u.id = ? AND u.clinica_id = ?`,
    [usuarioId, clinicaId],
  );

  if (rows.length === 0) {
    return { ok: false, status: 404, error: "Usuário não encontrado" };
  }

  if (
    Number(rows[0].perfil_id) !== 2 ||
    Number(rows[0].responsavel_clinica_id) !== Number(usuarioId)
  ) {
    return {
      ok: false,
      status: 403,
      error: "Apenas o responsável pela clínica pode editar estas informações.",
    };
  }

  return { ok: true };
}

export async function POST() {
  const sessao = await obterSessao();
  if (!sessao) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  let connection: ConexaoMySQL | undefined;
  try {
    connection = await getConnection();
    const permissao = await validarResponsavelClinica(
      connection,
      sessao.id,
      sessao.clinica_id,
    );
    if (!permissao.ok) {
      return Response.json(
        { error: permissao.error },
        { status: permissao.status },
      );
    }

    const [usuarios] = await connection.execute<RowDataPacket[]>(
      "SELECT assinatura_profissional_url FROM usuarios WHERE id = ?",
      [sessao.id],
    );

    if (usuarios.length === 0) {
      return Response.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    const assinatura = usuarios[0].assinatura_profissional_url;
    if (!assinatura) {
      return Response.json(
        { error: "Seu perfil não possui assinatura profissional cadastrada" },
        { status: 400 },
      );
    }

    const [resultado] = await connection.execute<ResultSetHeader>(
      "UPDATE clinicas SET responsavel_tecnico_assinatura_url = ? WHERE id = ?",
      [assinatura, sessao.clinica_id],
    );

    if (resultado.affectedRows === 0) {
      return Response.json(
        { error: "Clínica não encontrada" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      message: "Assinatura técnica atualizada com sucesso",
      responsavel_tecnico_assinatura_url: assinatura,
    });
  } catch (error) {
    console.error("Erro ao atualizar assinatura técnica:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

export async function DELETE() {
  const sessao = await obterSessao();
  if (!sessao) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  let connection: ConexaoMySQL | undefined;
  try {
    connection = await getConnection();
    const permissao = await validarResponsavelClinica(
      connection,
      sessao.id,
      sessao.clinica_id,
    );
    if (!permissao.ok) {
      return Response.json(
        { error: permissao.error },
        { status: permissao.status },
      );
    }

    const [resultado] = await connection.execute<ResultSetHeader>(
      "UPDATE clinicas SET responsavel_tecnico_assinatura_url = NULL WHERE id = ?",
      [sessao.clinica_id],
    );

    if (resultado.affectedRows === 0) {
      return Response.json(
        { error: "Clínica não encontrada" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      message: "Assinatura técnica removida com sucesso",
    });
  } catch (error) {
    console.error("Erro ao remover assinatura técnica:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
