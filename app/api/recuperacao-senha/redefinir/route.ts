import type { RowDataPacket } from "mysql2";
import { getConnection } from "@/lib/mysql";
import {
  compararSenha,
  gerarHashSenha,
  validarSenhaForte,
} from "@/lib/validacoes";

type ConexaoMySQL = Awaited<ReturnType<typeof getConnection>>;

async function buscarRecuperacao(connection: ConexaoMySQL, token: string) {
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT rs.id, rs.usuario_id, rs.expira_em, rs.usado, u.senha_hash, u.ativo
       FROM recuperacao_senha rs
       INNER JOIN usuarios u ON u.id = rs.usuario_id
      WHERE rs.token = ?
      LIMIT 1`,
    [token],
  );

  return rows[0] || null;
}

export async function POST(request: Request) {
  let connection: ConexaoMySQL | undefined;

  try {
    const body = await request.json();
    const token = String(body.token || "").trim();
    const novaSenha = String(body.novaSenha || "");
    const confirmarSenha = String(body.confirmarSenha || "");

    if (!token) {
      return Response.json({ error: "Token inválido" }, { status: 400 });
    }

    if (!novaSenha || !confirmarSenha) {
      return Response.json(
        { error: "Preencha e confirme a nova senha." },
        { status: 400 },
      );
    }

    if (novaSenha !== confirmarSenha) {
      return Response.json(
        { error: "As senhas não coincidem." },
        { status: 400 },
      );
    }

    const validacao = validarSenhaForte(novaSenha);
    if (!validacao.valida) {
      return Response.json({ error: validacao.mensagem }, { status: 400 });
    }

    connection = await getConnection();
    const recuperacao = await buscarRecuperacao(connection, token);

    if (
      !recuperacao ||
      Number(recuperacao.usado) === 1 ||
      Number(recuperacao.ativo) === 0 ||
      new Date(String(recuperacao.expira_em)).getTime() < Date.now()
    ) {
      return Response.json(
        { error: "Token inválido ou expirado." },
        { status: 400 },
      );
    }

    const hashAtual = String(recuperacao.senha_hash || "");
    const senhaMesma = await compararSenha(novaSenha, hashAtual);
    if (senhaMesma) {
      return Response.json(
        { error: "A nova senha deve ser diferente da senha atual." },
        { status: 400 },
      );
    }

    const novoHash = await gerarHashSenha(novaSenha);
    await connection.beginTransaction();

    await connection.execute(
      "UPDATE usuarios SET senha_hash = ? WHERE id = ?",
      [novoHash, recuperacao.usuario_id],
    );

    await connection.execute(
      "UPDATE recuperacao_senha SET usado = 1 WHERE id = ?",
      [recuperacao.id],
    );

    await connection.commit();

    return Response.json({
      success: true,
      message: "Senha redefinida com sucesso.",
    });
  } catch (error) {
    if (connection) {
      await connection.rollback().catch(() => null);
    }
    console.error("Erro ao redefinir senha:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  } finally {
    if (connection) await connection.end();
  }
}
