import { getConnection } from "@/lib/mysql";

import { type LinhaNotificacao, validarAcessoNotificacoes } from "./_utils";

function formatarNotificacao(row: LinhaNotificacao) {
  return {
    id: Number(row.id),
    clinica_id: Number(row.clinica_id),
    usuario_id: Number(row.usuario_id),
    tipo: String(row.tipo),
    titulo: String(row.titulo),
    mensagem: String(row.mensagem),
    entidade_tipo: row.entidade_tipo || null,
    entidade_id: row.entidade_id ? Number(row.entidade_id) : null,
    lida: Number(row.lida) === 1,
    lida_em: row.lida_em || null,
    criado_em: row.criado_em,
  };
}

export async function GET() {
  let connection: Awaited<ReturnType<typeof getConnection>> | null = null;

  try {
    connection = await getConnection();
    const acesso = await validarAcessoNotificacoes(connection);
    if (!acesso.ok) {
      return Response.json({ error: acesso.error }, { status: acesso.status });
    }

    const [rows] = await connection.execute<import("mysql2").RowDataPacket[]>(
      `SELECT id, clinica_id, usuario_id, tipo, titulo, mensagem,
              entidade_tipo, entidade_id, lida, lida_em, criado_em
         FROM notificacoes
        WHERE clinica_id = ? AND usuario_id = ?
        ORDER BY lida ASC, criado_em DESC, id DESC`,
      [acesso.usuario.clinica_id, acesso.usuario.id],
    );

    const notificacoes = rows.map((row) =>
      formatarNotificacao(row as LinhaNotificacao),
    );
    const naoLidas = notificacoes.filter(
      (notificacao) => !notificacao.lida,
    ).length;
    const lidas = notificacoes.length - naoLidas;

    return Response.json({
      success: true,
      data: {
        notificacoes,
        totais: {
          total: notificacoes.length,
          nao_lidas: naoLidas,
          lidas,
        },
      },
    });
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  } finally {
    if (connection) await connection.end();
  }
}
