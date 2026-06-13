import { getConnection } from "@/lib/mysql";

import { validarAcessoNotificacoes } from "../_utils";
import { gerarNotificacoesConsultas } from "./utils";

export async function POST() {
  let connection: Awaited<ReturnType<typeof getConnection>> | null = null;

  try {
    connection = await getConnection();
    const acesso = await validarAcessoNotificacoes(connection);
    if (!acesso.ok) {
      return Response.json({ error: acesso.error }, { status: acesso.status });
    }

    await connection.beginTransaction();
    const resultados = await gerarNotificacoesConsultas(
      connection,
      acesso.usuario.clinica_id,
    );
    await connection.commit();

    return Response.json({
      success: true,
      data: resultados,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback().catch(() => undefined);
    }

    console.error("Erro ao gerar notificações de consulta:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  } finally {
    if (connection) await connection.end();
  }
}

