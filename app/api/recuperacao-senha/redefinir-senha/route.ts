// app/api/recuperacao-senha/redefinir/route.ts
// API para redefinir a senha usando o token  

import { getConnection } from "@/lib/mysql";
import { validarSenhaForte, gerarHashSenha } from "@/lib/validacoes";
import { RowDataPacket } from "mysql2";

export async function POST(request: Request) {
  let connection = null;

  try {
    const body = await request.json();
    const { token, novaSenha, confirmarSenha } = body;

    // Validações básicas
    if (!token || !novaSenha || !confirmarSenha) {
      return Response.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 },
      );
    }

    // Verifica se as senhas coincidem
    if (novaSenha !== confirmarSenha) {
      return Response.json(
        { error: "As senhas não coincidem" },
        { status: 400 },
      );
    }

    // Valida se a senha é forte
    const validacaoSenha = validarSenhaForte(novaSenha);
    if (!validacaoSenha.valida) {
      return Response.json({ error: validacaoSenha.mensagem }, { status: 400 });
    }

    connection = await getConnection();

    // Busca o token na tabela recuperacao_senha
    const [tokens] = await connection.execute<RowDataPacket[]>(
      `SELECT usuarios_id, expira_em FROM recuperacao_senha WHERE token = ?`,
      [token],
    );

    if (tokens.length === 0) {
      return Response.json({ error: "Token inválido" }, { status: 400 });
    }

    const tokenData = tokens[0];

    // Verifica se o token expirou
    const agora = new Date();
    const expiraEm = new Date(tokenData.expira_em);

    if (agora > expiraEm) {
      return Response.json(
        { error: "Este link expirou. Solicite uma nova recuperação" },
        { status: 400 },
      );
    }

    // Gera o hash da nova senha
    const hashSenha = await gerarHashSenha(novaSenha);

    // Atualiza a senha do usuário
    await connection.execute(
      "UPDATE usuarios SET senha_hash = ? WHERE id = ?",
      [hashSenha, tokenData.usuarios_id],
    );

    // Remove a linha da tabela recuperacao_senha
    await connection.execute("DELETE FROM recuperacao_senha WHERE token = ?", [
      token,
    ]);

    return Response.json({
      success: true,
      message: "Senha redefinida com sucesso!",
    });
  } catch (error) {
    console.error("Erro na redefinição de senha:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
