import type { ResultSetHeader } from "mysql2";

import { getConnection } from "@/lib/mysql";

import { validarAcessoNotificacoes } from "../../_utils";

interface ParamsRoute {
  params: Promise<{ id: string }>;
}

export async function PATCH(_request: Request, context: ParamsRoute) {
  let connection: Awaited<ReturnType<typeof getConnection>> | null = null;

  try {
    const { id } = await context.params;
    const notificacaoId = Number(id);
    if (!Number.isInteger(notificacaoId) || notificacaoId <= 0) {
      return Response.json({ error: "Notificação inválida" }, { status: 400 });
    }

    connection = await getConnection();
    const acesso = await validarAcessoNotificacoes(connection);
    if (!acesso.ok) {
      return Response.json({ error: acesso.error }, { status: acesso.status });
    }

    const [resultado] = await connection.execute<ResultSetHeader>(
      `UPDATE notificacoes
          SET lida = 1,
              lida_em = COALESCE(lida_em, NOW())
        WHERE id = ? AND clinica_id = ? AND usuario_id = ?`,
      [notificacaoId, acesso.usuario.clinica_id, acesso.usuario.id],
    );

    if (resultado.affectedRows === 0) {
      return Response.json(
        { error: "Notificação não encontrada" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      message: "Notificação marcada como lida",
    });
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  } finally {
    if (connection) await connection.end();
  }
}

