import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import { getConnection } from "@/lib/mysql";
import {
  compararSenha,
  gerarHashSenha,
  validarSenhaForte,
} from "@/lib/validacoes";

type ConexaoMySQL = Awaited<ReturnType<typeof getConnection>>;

async function obterSessao() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("usuario_neurosync");
  if (!cookie) return null;

  try {
    return JSON.parse(cookie.value) as {
      id: number;
      email: string;
      clinica_id: number;
    };
  } catch {
    return null;
  }
}

async function buscarUsuarioAtivo(connection: ConexaoMySQL, usuarioId: number) {
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT id, senha_hash, ativo
     FROM usuarios
     WHERE id = ?
     LIMIT 1`,
    [usuarioId],
  );

  return rows[0] || null;
}

export async function PATCH(request: Request) {
  let connection: ConexaoMySQL | undefined;

  try {
    const sessao = await obterSessao();
    if (!sessao) {
      return Response.json({ error: "Não autenticado" }, { status: 401 });
    }

    connection = await getConnection();

    const body = await request.json();
    const senhaAtual = String(body.senhaAtual || "");
    const novaSenha = String(body.novaSenha || "");
    const confirmarNovaSenha = String(body.confirmarNovaSenha || "");

    if (!senhaAtual) {
      return Response.json(
        { error: "Informe sua senha atual." },
        { status: 400 },
      );
    }

    if (!novaSenha) {
      return Response.json({ error: "Informe a nova senha." }, { status: 400 });
    }

    if (!confirmarNovaSenha || confirmarNovaSenha !== novaSenha) {
      return Response.json(
        { error: "As senhas não coincidem." },
        { status: 400 },
      );
    }

    if (senhaAtual === novaSenha) {
      return Response.json(
        { error: "A nova senha deve ser diferente da senha atual." },
        { status: 400 },
      );
    }

    const validacaoSenha = validarSenhaForte(novaSenha);
    if (!validacaoSenha.valida) {
      return Response.json({ error: validacaoSenha.mensagem }, { status: 400 });
    }

    const usuario = await buscarUsuarioAtivo(connection, sessao.id);

    if (!usuario) {
      return Response.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    if (Number(usuario.ativo) === 0) {
      return Response.json(
        {
          error:
            "Usuário inativo. Entre em contato com o responsável da clínica.",
        },
        { status: 403 },
      );
    }

    const senhaConfere = await compararSenha(senhaAtual, usuario.senha_hash);
    if (!senhaConfere) {
      return Response.json(
        { error: "Senha atual incorreta." },
        { status: 400 },
      );
    }

    const novoHash = await gerarHashSenha(novaSenha);
    const [resultado] = await connection.execute<ResultSetHeader>(
      "UPDATE usuarios SET senha_hash = ? WHERE id = ?",
      [novoHash, sessao.id],
    );

    if (resultado.affectedRows === 0) {
      return Response.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      message: "Senha alterada com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  } finally {
    if (connection) await connection.end();
  }
}
