import type { ResultSetHeader } from "mysql2";

import { getConnection } from "@/lib/mysql";

import { validarAcessoNotificacoes } from "../_utils";

export async function PATCH() {
  let connection: Awaited<ReturnType<typeof getConnection>> | null = null;

  try {
    connection = await getConnection();
    const acesso = await validarAcessoNotificacoes(connection);
    if (!acesso.ok) {
      return Response.json({ error: acesso.error }, { status: acesso.status });
    }

    const [resultado] = await connection.execute<ResultSetHeader>(
      `UPDATE notificacoes
          SET lida = 1,
              lida_em = COALESCE(lida_em, NOW())
        WHERE clinica_id = ? AND usuario_id = ? AND lida = 0`,
      [acesso.usuario.clinica_id, acesso.usuario.id],
    );

    return Response.json({
      success: true,
      message: "Todas as notificações foram marcadas como lidas",
      atualizadas: resultado.affectedRows,
    });
  } catch (error) {
    console.error("Erro ao marcar todas como lidas:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  } finally {
    if (connection) await connection.end();
  }
}

