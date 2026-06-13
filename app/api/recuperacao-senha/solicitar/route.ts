import crypto from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { enviarEmailRecuperacao } from "@/lib/email";
import { getConnection } from "@/lib/mysql";
import { validarEmail } from "@/lib/validacoes";

type ConexaoMySQL = Awaited<ReturnType<typeof getConnection>>;

async function buscarUsuarioPorEmail(connection: ConexaoMySQL, email: string) {
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT id, nome, email, ativo
       FROM usuarios
      WHERE email = ?
      LIMIT 1`,
    [email],
  );

  return rows[0] || null;
}

export async function POST(request: Request) {
  let connection: ConexaoMySQL | undefined;

  try {
    const body = await request.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    if (!email || !validarEmail(email)) {
      return Response.json(
        { error: "Informe um e-mail válido." },
        { status: 400 },
      );
    }

    connection = await getConnection();
    const usuario = await buscarUsuarioPorEmail(connection, email);

    if (!usuario || Number(usuario.ativo) === 0) {
      return Response.json({
        success: true,
        message:
          "Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000);

    await connection.beginTransaction();

    await connection.execute(
      "DELETE FROM recuperacao_senha WHERE usuario_id = ? AND usado = 0",
      [usuario.id],
    );

    await connection.execute(
      `INSERT INTO recuperacao_senha (usuario_id, token, expira_em, usado)
       VALUES (?, ?, ?, 0)`,
      [usuario.id, token, expiraEm],
    );

    await enviarEmailRecuperacao(
      email,
      token,
      String(usuario.nome || "Usuário"),
    );

    await connection.commit();

    return Response.json({
      success: true,
      message:
        "Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.",
    });
  } catch (error) {
    if (connection) {
      await connection.rollback().catch(() => null);
    }
    console.error("Erro ao solicitar recuperação:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  } finally {
    if (connection) await connection.end();
  }
}
