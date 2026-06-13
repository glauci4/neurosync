import type { RowDataPacket } from "mysql2";
import { getConnection } from "@/lib/mysql";

type ConexaoMySQL = Awaited<ReturnType<typeof getConnection>>;

export async function GET(request: Request) {
  let connection: ConexaoMySQL | undefined;

  try {
    const url = new URL(request.url);
    const token = String(url.searchParams.get("token") || "").trim();

    if (!token) {
      return Response.json(
        { error: "Token inválido", valid: false },
        { status: 400 },
      );
    }

    connection = await getConnection();
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT rs.id, rs.usuario_id, rs.expira_em, rs.usado, u.ativo
         FROM recuperacao_senha rs
         INNER JOIN usuarios u ON u.id = rs.usuario_id
        WHERE rs.token = ?
        LIMIT 1`,
      [token],
    );

    const recuperacao = rows[0];
    if (
      !recuperacao ||
      Number(recuperacao.usado) === 1 ||
      Number(recuperacao.ativo) === 0 ||
      new Date(String(recuperacao.expira_em)).getTime() < Date.now()
    ) {
      return Response.json({ success: true, valid: false });
    }

    return Response.json({ success: true, valid: true });
  } catch (error) {
    console.error("Erro ao validar token:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  } finally {
    if (connection) await connection.end();
  }
}
