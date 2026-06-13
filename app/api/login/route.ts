// app/api/login/route.ts
// API para autenticar usuário

import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { getConnection } from "@/lib/mysql";
import { compararSenha } from "@/lib/validacoes";

export async function POST(request: Request) {
  let connection = null;

  try {
    const { email, senha } = await request.json();

    console.log(`Tentativa de login para: ${email}`);

    if (!email || !senha) {
      return Response.json(
        { error: "E-mail e senha são obrigatórios" },
        { status: 400 },
      );
    }

    connection = await getConnection();
    const [colunasAtivo] = await connection.execute<RowDataPacket[]>(
      "SHOW COLUMNS FROM usuarios LIKE 'ativo'",
    );
    const [colunasUltimoAcesso] = await connection.execute<RowDataPacket[]>(
      "SHOW COLUMNS FROM usuarios LIKE 'ultimo_acesso'",
    );
    const [colunasAvatar] = await connection.execute<RowDataPacket[]>(
      "SHOW COLUMNS FROM usuarios LIKE 'avatar_url'",
    );
    const [colunasResponsavelClinica] = await connection.execute<
      RowDataPacket[]
    >("SHOW COLUMNS FROM clinicas LIKE 'responsavel_clinica_id'");
    const colunaAtivoExiste = colunasAtivo.length > 0;
    const colunaUltimoAcessoExiste = colunasUltimoAcesso.length > 0;
    const colunaAvatarExiste = colunasAvatar.length > 0;
    const colunaResponsavelExiste = colunasResponsavelClinica.length > 0;

    // Busca o usuário e junta com a tabela perfis para pegar o nome correto
    const [usuarios] = await connection.execute<RowDataPacket[]>(
      `SELECT u.id, u.nome, u.email, u.senha_hash, u.perfil_id, u.crp,
              u.clinica_id,
              ${colunaAtivoExiste ? "u.ativo" : "1 AS ativo"},
              ${colunaAvatarExiste ? "u.avatar_url" : "NULL AS avatar_url"},
              p.nome as perfil_nome,
              c.nome_fantasia AS nome_clinica,
              ${
                colunaResponsavelExiste
                  ? "c.responsavel_clinica_id"
                  : "NULL AS responsavel_clinica_id"
              }
       FROM usuarios u
       LEFT JOIN perfis p ON u.perfil_id = p.id
       LEFT JOIN clinicas c ON c.id = u.clinica_id
       WHERE u.email = ?`,
      [email],
    );

    console.log(`Usuários encontrados: ${usuarios.length}`);

    if (usuarios.length === 0) {
      return Response.json(
        { error: "E-mail ou senha inválidos" },
        { status: 401 },
      );
    }

    const usuario = usuarios[0];

    console.log("Usuário encontrado:", {
      id: usuario.id,
      nome: usuario.nome,
      perfil_id: usuario.perfil_id,
      perfil_nome: usuario.perfil_nome,
    });

    // Compara a senha digitada com o hash do banco
    const senhaValida = await compararSenha(senha, usuario.senha_hash);

    if (!senhaValida) {
      return Response.json(
        { error: "E-mail ou senha inválidos" },
        { status: 401 },
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

    if (colunaUltimoAcessoExiste) {
      await connection.execute(
        "UPDATE usuarios SET ultimo_acesso = CURRENT_TIMESTAMP WHERE id = ?",
        [usuario.id],
      );
    }

    const isResponsavelClinica =
      Boolean(usuario.responsavel_clinica_id) &&
      Number(usuario.id) === Number(usuario.responsavel_clinica_id);
    const isAdminClinica = isResponsavelClinica;

    // Retorna os dados do usuário
    // IMPORTANTE: perfil deve ser o nome vindo da tabela perfis (secretária ou psicólogo)
    const response = NextResponse.json({
      success: true,
      message: "Login realizado com sucesso",
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil_nome, // 'secretária' ou 'psicólogo'
        perfil_id: usuario.perfil_id, // 1 ou 2
        clinica_id: usuario.clinica_id,
        clinica: usuario.nome_clinica || null,
        avatar_url: usuario.avatar_url || null,
        isAdminClinica,
        isResponsavelClinica,
      },
    });

    response.cookies.set(
      "usuario_neurosync",
      JSON.stringify({
        id: usuario.id,
        email: usuario.email,
        clinica_id: usuario.clinica_id,
      }),
      {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      },
    );

    return response;
  } catch (error) {
    console.error("Erro no login:", error);
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

