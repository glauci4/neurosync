import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { validarAcessoClinica } from "@/lib/auth/permissoesClinica";
import { getConnection } from "@/lib/mysql";
import {
  gerarHashSenha,
  validarCPF,
  validarCRP,
  validarEmail,
  validarSenhaForte,
} from "@/lib/validacoes";

type ConexaoMySQL = Awaited<ReturnType<typeof getConnection>>;
type PerfilUsuarioSistema = "psicologo" | "secretaria";
type FiltroStatusUsuario = "ativo" | "inativo" | "todos";

interface CriarUsuarioPayload {
  nome?: string;
  email?: string;
  perfil?: PerfilUsuarioSistema;
  perfil_id?: number;
  telefone?: string | null;
  senha?: string;
  senhaInicial?: string;
  crp?: string | null;
  cpf?: string | null;
}

function somenteNumeros(valor?: string | null) {
  return String(valor || "").replace(/\D/g, "");
}

function normalizarTexto(valor?: string | null) {
  return String(valor || "").trim();
}

function perfilIdParaNome(perfilId: number): PerfilUsuarioSistema | null {
  if (perfilId === 2) return "psicologo";
  if (perfilId === 1) return "secretaria";
  return null;
}

function normalizarPerfil(body: CriarUsuarioPayload) {
  if (body.perfil === "psicologo" || body.perfil === "secretaria") {
    return body.perfil;
  }
  if (body.perfil_id) return perfilIdParaNome(Number(body.perfil_id));
  return null;
}

function montarUsuario(row: RowDataPacket) {
  const isResponsavelClinica =
    Boolean(row.responsavel_clinica_id) &&
    Number(row.id) === Number(row.responsavel_clinica_id);

  return {
    id: Number(row.id),
    nome: String(row.nome || ""),
    email: String(row.email || ""),
    telefone: row.telefone ? String(row.telefone) : null,
    perfil: String(row.perfil || ""),
    perfil_id: Number(row.perfil_id),
    ativo: Number(row.ativo) === 1,
    ultimo_acesso: row.ultimo_acesso || null,
    criado_em: row.criado_em || null,
    avatar_url: row.avatar_url || null,
    isResponsavelClinica,
    podeExcluir: !isResponsavelClinica && Number(row.total_vinculos || 0) === 0,
  };
}

export async function GET(request: Request) {
  let connection: ConexaoMySQL | undefined;

  try {
    connection = await getConnection();
    const acesso = await validarAcessoClinica(connection, { admin: true });
    if (!acesso.ok) {
      return Response.json({ error: acesso.error }, { status: acesso.status });
    }

    const url = new URL(request.url);
    const busca = normalizarTexto(url.searchParams.get("busca")).toLowerCase();
    const perfil = normalizarTexto(url.searchParams.get("perfil"));
    const status = (normalizarTexto(url.searchParams.get("status")) ||
      "todos") as FiltroStatusUsuario;

    const where = ["u.clinica_id = ?"];
    const params: Array<string | number> = [acesso.usuario.clinica_id];

    if (busca) {
      where.push("(LOWER(u.nome) LIKE ? OR LOWER(u.email) LIKE ?)");
      params.push(`%${busca}%`, `%${busca}%`);
    }

    if (perfil === "psicologo") where.push("u.perfil_id = 2");
    if (perfil === "secretaria") where.push("u.perfil_id = 1");

    if (status === "ativo") where.push("COALESCE(u.ativo, 1) = 1");
    if (status === "inativo") where.push("COALESCE(u.ativo, 1) = 0");

    const [usuarios] = await connection.execute<RowDataPacket[]>(
      `SELECT
          u.id, u.nome, u.email, u.telefone, u.perfil_id,
          COALESCE(p.nome, CASE WHEN u.perfil_id = 2 THEN 'psicologo' ELSE 'secretaria' END) AS perfil,
          COALESCE(u.ativo, 1) AS ativo,
          u.ultimo_acesso, u.criado_em, u.avatar_url,
          c.responsavel_clinica_id,
          (
            SELECT COUNT(*) FROM consultas co
            WHERE co.clinica_id = u.clinica_id AND co.psicologo_id = u.id
          )
          + (
            SELECT COUNT(*) FROM registros_clinicos pe
            WHERE pe.clinica_id = u.clinica_id AND pe.psicologo_id = u.id
          ) AS total_vinculos
       FROM usuarios u
       LEFT JOIN perfis p ON p.id = u.perfil_id
       INNER JOIN clinicas c ON c.id = u.clinica_id
       WHERE ${where.join(" AND ")}
       ORDER BY COALESCE(u.ativo, 1) DESC, u.nome ASC`,
      params,
    );

    return Response.json({
      success: true,
      data: usuarios.map(montarUsuario),
    });
  } catch (error) {
    console.error("Erro ao listar usuários do sistema:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

export async function POST(request: Request) {
  let connection: ConexaoMySQL | undefined;

  try {
    connection = await getConnection();
    const acesso = await validarAcessoClinica(connection, { admin: true });
    if (!acesso.ok) {
      return Response.json({ error: acesso.error }, { status: acesso.status });
    }

    const body: CriarUsuarioPayload = await request.json();
    const nome = normalizarTexto(body.nome);
    const email = normalizarTexto(body.email).toLowerCase();
    const telefone = somenteNumeros(body.telefone);
    const perfil = normalizarPerfil(body);
    const senha = String(body.senha || body.senhaInicial || "");
    const crp = normalizarTexto(body.crp);
    const cpf = somenteNumeros(body.cpf);

    if (!nome || nome.length < 3) {
      return Response.json(
        { error: "Nome deve ter pelo menos 3 caracteres" },
        { status: 400 },
      );
    }

    if (!email || !validarEmail(email)) {
      return Response.json({ error: "E-mail inválido" }, { status: 400 });
    }

    if (!perfil) {
      return Response.json({ error: "Perfil inválido" }, { status: 400 });
    }

    if (!senha) {
      return Response.json(
        { error: "Senha inicial é obrigatória" },
        { status: 400 },
      );
    }

    const validacaoSenha = validarSenhaForte(senha);
    if (!validacaoSenha.valida) {
      return Response.json(
        { error: `Senha fraca: ${validacaoSenha.mensagem}` },
        { status: 400 },
      );
    }

    if (telefone && ![10, 11].includes(telefone.length)) {
      return Response.json({ error: "Telefone inválido" }, { status: 400 });
    }

    if (perfil === "psicologo" && !validarCRP(crp)) {
      return Response.json(
        { error: 'CRP inválido. Formato esperado: "XX/XXXXX".' },
        { status: 400 },
      );
    }

    if (perfil === "secretaria" && !validarCPF(cpf)) {
      return Response.json({ error: "CPF inválido" }, { status: 400 });
    }

    const [emailsExistentes] = await connection.execute<RowDataPacket[]>(
      "SELECT id FROM usuarios WHERE email = ?",
      [email],
    );
    if (emailsExistentes.length > 0) {
      return Response.json(
        { error: "Este e-mail já está em uso" },
        { status: 409 },
      );
    }

    if (perfil === "secretaria") {
      const [cpfsExistentes] = await connection.execute<RowDataPacket[]>(
        "SELECT id FROM usuarios WHERE cpf = ?",
        [cpf],
      );
      if (cpfsExistentes.length > 0) {
        return Response.json(
          { error: "Este CPF já está cadastrado no sistema" },
          { status: 409 },
        );
      }
    }

    const senhaHash = await gerarHashSenha(senha);
    const perfilId = perfil === "psicologo" ? 2 : 1;
    const [resultado] = await connection.execute<ResultSetHeader>(
      `INSERT INTO usuarios
       (nome, email, senha_hash, perfil_id, crp, cpf, telefone, clinica_id, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        nome,
        email,
        senhaHash,
        perfilId,
        perfil === "psicologo" ? crp : null,
        perfil === "secretaria" ? cpf : null,
        telefone || null,
        acesso.usuario.clinica_id,
      ],
    );

    return Response.json(
      {
        success: true,
        message: "Usuário cadastrado",
        id: resultado.insertId,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao criar usuário do sistema:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

