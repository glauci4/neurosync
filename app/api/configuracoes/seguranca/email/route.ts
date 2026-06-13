import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getConnection } from "@/lib/mysql";
import { compararSenha, validarEmail } from "@/lib/validacoes";

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

export async function PATCH(request: Request) {
  let connection: ConexaoMySQL | undefined;

  try {
    const sessao = await obterSessao();
    if (!sessao) {
      return Response.json({ error: "Não autenticado" }, { status: 401 });
    }

    connection = await getConnection();
    const body = await request.json();
    const novoEmail = String(body.novoEmail || "")
      .trim()
      .toLowerCase();
    const senhaAtual = String(body.senhaAtual || "");

    if (!novoEmail || !validarEmail(novoEmail)) {
      return Response.json(
        { error: "Informe um e-mail válido." },
        { status: 400 },
      );
    }

    if (!senhaAtual) {
      return Response.json(
        { error: "Confirme sua senha para alterar o e-mail." },
        { status: 400 },
      );
    }

    const [usuarios] = await connection.execute<RowDataPacket[]>(
      `SELECT id, nome, email, senha_hash, perfil_id, clinica_id, ativo
       FROM usuarios
       WHERE id = ?
       LIMIT 1`,
      [sessao.id],
    );

    const usuario = usuarios[0];
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

    const emailAtual = String(usuario.email || "").toLowerCase();
    if (novoEmail === emailAtual) {
      return Response.json(
        { error: "O novo e-mail deve ser diferente do e-mail atual." },
        { status: 400 },
      );
    }

    const senhaConfere = await compararSenha(senhaAtual, usuario.senha_hash);
    if (!senhaConfere) {
      return Response.json(
        { error: "Senha atual incorreta." },
        { status: 400 },
      );
    }

    const [emailExistente] = await connection.execute<RowDataPacket[]>(
      "SELECT id FROM usuarios WHERE email = ? AND id <> ?",
      [novoEmail, sessao.id],
    );
    if (emailExistente.length > 0) {
      return Response.json(
        { error: "Este e-mail já está cadastrado." },
        { status: 409 },
      );
    }

    const [resultado] = await connection.execute<ResultSetHeader>(
      "UPDATE usuarios SET email = ? WHERE id = ?",
      [novoEmail, sessao.id],
    );

    if (resultado.affectedRows === 0) {
      return Response.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "E-mail alterado com sucesso.",
      usuario: {
        email: novoEmail,
      },
    });

    response.cookies.set(
      "usuario_neurosync",
      JSON.stringify({
        id: Number(usuario.id),
        email: novoEmail,
        clinica_id: Number(usuario.clinica_id),
      }),
      {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      },
    );

    return response;
  } catch (error) {
    console.error("Erro ao alterar e-mail:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  } finally {
    if (connection) await connection.end();
  }
}

