// app/api/usuarios/me/senha/route.ts

import type { RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import { getConnection } from "@/lib/mysql";
import { compararSenha, gerarHashSenha } from "@/lib/validacoes";

// Função assíncrona para ler o cookie de sessão
async function obterUsuarioDoCookie() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("usuario_neurosync");
  if (!sessionCookie) return null;
  try {
    const dados = JSON.parse(sessionCookie.value) as {
      id: number;
      email: string;
      clinica_id: number;
    };
    return dados;
  } catch {
    return null;
  }
}

export async function PUT(request: Request) {
  const sessao = await obterUsuarioDoCookie();
  if (!sessao) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { senhaAtual, novaSenha } = await request.json();

  if (!senhaAtual || !novaSenha) {
    return Response.json(
      { error: "Senha atual e nova senha são obrigatórias" },
      { status: 400 },
    );
  }

  if (novaSenha.length < 8) {
    return Response.json(
      { error: "A nova senha deve ter pelo menos 8 caracteres" },
      { status: 400 },
    );
  }

  let connection: Awaited<ReturnType<typeof getConnection>> | null = null;
  try {
    connection = await getConnection();

    // Busca o hash atual
    const [rows] = await connection.execute<RowDataPacket[]>(
      "SELECT senha_hash FROM usuarios WHERE id = ?",
      [sessao.id],
    );

    if (rows.length === 0) {
      return Response.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    const hashAtual = rows[0].senha_hash;

    // Verifica se a senha atual está correta
    const senhaConfere = await compararSenha(senhaAtual, hashAtual);
    if (!senhaConfere) {
      return Response.json({ error: "Senha atual incorreta" }, { status: 400 });
    }

    // Gera novo hash e atualiza
    const novoHash = await gerarHashSenha(novaSenha);
    await connection.execute(
      "UPDATE usuarios SET senha_hash = ? WHERE id = ?",
      [novoHash, sessao.id],
    );

    return Response.json({
      success: true,
      message: "Senha alterada com sucesso",
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
