// app/api/usuarios/me/route.ts
// API do perfil do usuário logado. Segurança e senha permanecem na aba Segurança.

import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import { getConnection } from "@/lib/mysql";
import { validarEmail } from "@/lib/validacoes";

type ConexaoMySQL = Awaited<ReturnType<typeof getConnection>>;

interface PerfilPayload {
  nome?: string;
  email?: string;
  telefone?: string;
  perfil_id?: number;
  perfil?: string;
  crp?: string;
  cpf?: string;
  senha?: string;
  senha_hash?: string;
  avatar_url?: string;
  assinatura_profissional_url?: string;
  // Compatibilidade de payload: não altera permissão, só preserva
  // campos que a tela pessoal pode enviar sem impacto administrativo.
}

async function obterUsuarioDoCookie(): Promise<{
  id: number;
  email: string;
  clinica_id: number;
} | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("usuario_neurosync");
  if (!sessionCookie) return null;
  try {
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
}

function normalizarTelefone(telefone?: string) {
  return String(telefone || "").replace(/\D/g, "");
}

function existeCampoProtegido(body: PerfilPayload) {
  return [
    "perfil_id",
    "perfil",
    "crp",
    "cpf",
    "senha",
    "senha_hash",
    "avatar_url",
    "assinatura_profissional_url",
  ].some((campo) => campo in body);
}

async function obterColunasUsuarios(connection: ConexaoMySQL) {
  const [colunas] = await connection.execute<RowDataPacket[]>(
    "SHOW COLUMNS FROM usuarios",
  );
  return new Set(colunas.map((coluna) => String(coluna.Field)));
}

function selecionarColuna(
  colunas: Set<string>,
  coluna: string,
  alias = coluna,
  fallback = "NULL",
) {
  // Compatibilidade crítica: bancos criados antes da evolução do Perfil
  // podem não ter telefone, CPF, avatar ou último acesso. O GET devolve a
  // mesma estrutura para o frontend sem quebrar o carregamento.
  return colunas.has(coluna)
    ? `u.${coluna} AS ${alias}`
    : `${fallback} AS ${alias}`;
}

export async function GET() {
  const sessao = await obterUsuarioDoCookie();
  if (!sessao) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  let connection: ConexaoMySQL | undefined;
  try {
    connection = await getConnection();
    const colunasUsuarios = await obterColunasUsuarios(connection);
    const camposOpcionais = [
      selecionarColuna(colunasUsuarios, "telefone"),
      selecionarColuna(colunasUsuarios, "cpf"),
      selecionarColuna(colunasUsuarios, "especialidade"),
      selecionarColuna(colunasUsuarios, "avatar_url"),
      selecionarColuna(colunasUsuarios, "assinatura_profissional_url"),
      selecionarColuna(colunasUsuarios, "ultimo_acesso"),
      selecionarColuna(colunasUsuarios, "ativo", "ativo", "1"),
      selecionarColuna(colunasUsuarios, "criado_em"),
      selecionarColuna(colunasUsuarios, "atualizado_em"),
      selecionarColuna(colunasUsuarios, "data_cadastro", "data_cadastro"),
    ].join(",\n              ");

    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT u.id, u.nome, u.email, u.perfil_id, u.crp,
              ${camposOpcionais},
              c.responsavel_clinica_id,
              p.nome as perfil_nome
       FROM usuarios u
       LEFT JOIN perfis p ON u.perfil_id = p.id
       LEFT JOIN clinicas c ON c.id = u.clinica_id
       WHERE u.id = ?`,
      [sessao.id],
    );

    if (rows.length === 0) {
      return Response.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    const usuario = rows[0];
    const isResponsavelClinica =
      Boolean(usuario.responsavel_clinica_id) &&
      Number(usuario.id) === Number(usuario.responsavel_clinica_id);
    const isAdminClinica = isResponsavelClinica;
    return Response.json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone || "",
      cpf: usuario.cpf || "",
      crp: usuario.crp || "",
      especialidade: usuario.especialidade || "",
      avatar_url: usuario.avatar_url || "",
      assinatura_profissional_url: usuario.assinatura_profissional_url || "",
      isAdminClinica,
      isResponsavelClinica,
      responsavel_clinica_id: usuario.responsavel_clinica_id || null,
      perfil: usuario.perfil_nome,
      perfil_id: usuario.perfil_id,
      ativo: Boolean(usuario.ativo),
      criado_em: usuario.criado_em || usuario.data_cadastro || null,
      atualizado_em: usuario.atualizado_em || null,
      ultimo_acesso: usuario.ultimo_acesso || null,
      status: usuario.ativo === 0 ? "Inativo" : "Ativo",
    });
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  } finally {
    if (connection) await connection.end();
  }
}

export async function PUT(request: Request) {
  const sessao = await obterUsuarioDoCookie();
  if (!sessao) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  let connection: ConexaoMySQL | undefined;
  try {
    const body: PerfilPayload = await request.json();

    // Permissão crítica: esta tela só altera dados pessoais básicos do próprio usuário.
    // Perfil, CRP, CPF, senha e avatar são bloqueados aqui para evitar alteração forçada.
    if (existeCampoProtegido(body)) {
      return Response.json(
        { error: "Campo não permitido para edição de perfil" },
        { status: 403 },
      );
    }

    const nome = String(body.nome || "").trim();
    const email =
      body.email !== undefined
        ? String(body.email || "")
            .trim()
            .toLowerCase()
        : undefined;
    const telefone = normalizarTelefone(body.telefone);

    if (!nome || nome.length < 3) {
      return Response.json(
        { error: "Nome deve ter pelo menos 3 caracteres" },
        { status: 400 },
      );
    }

    if (email !== undefined && (!email || !validarEmail(email))) {
      return Response.json({ error: "E-mail inválido" }, { status: 400 });
    }

    if (telefone && ![10, 11].includes(telefone.length)) {
      return Response.json({ error: "Telefone inválido" }, { status: 400 });
    }

    connection = await getConnection();

    if (email !== undefined) {
      const [emailExistente] = await connection.execute<RowDataPacket[]>(
        "SELECT id FROM usuarios WHERE email = ? AND id <> ?",
        [email, sessao.id],
      );
      if (emailExistente.length > 0) {
        return Response.json(
          { error: "Este e-mail já está em uso por outro usuário" },
          { status: 409 },
        );
      }
    }

    const campos = ["nome = ?"];
    const valores: Array<string | number | null> = [nome];

    if (email !== undefined) {
      campos.push("email = ?");
      valores.push(email);
    }

    if (body.telefone !== undefined) {
      campos.push("telefone = ?");
      valores.push(telefone || null);
    }

    valores.push(sessao.id);

    const [resultado] = await connection.execute<ResultSetHeader>(
      `UPDATE usuarios
       SET ${campos.join(", ")}
       WHERE id = ?`,
      valores,
    );

    if (resultado.affectedRows === 0) {
      return Response.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      message: "Perfil atualizado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  } finally {
    if (connection) await connection.end();
  }
}
