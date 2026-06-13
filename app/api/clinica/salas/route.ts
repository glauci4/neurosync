import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { validarAcessoClinica } from "@/lib/auth/permissoesClinica";
import { getConnection } from "@/lib/mysql";

type ConexaoMySQL = Awaited<ReturnType<typeof getConnection>>;
type TipoSala = "geral" | "infantil";

interface SalaPayload {
  nome?: string;
  tipo?: TipoSala;
}

function normalizarNome(nome?: string) {
  return String(nome || "").trim();
}

function validarPayloadSala(body: SalaPayload) {
  const nome = normalizarNome(body.nome);
  const tipo = body.tipo;

  if (!nome) return { erro: "Informe o nome da sala" };
  if (!tipo) return { erro: "Informe o tipo da sala" };
  if (!["geral", "infantil"].includes(tipo)) {
    return { erro: "Tipo de sala inválido" };
  }

  return { nome, tipo };
}

export async function GET() {
  let connection: ConexaoMySQL | undefined;
  try {
    connection = await getConnection();
    const acesso = await validarAcessoClinica(connection);
    if (!acesso.ok) {
      return Response.json({ error: acesso.error }, { status: acesso.status });
    }

    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT id, clinica_id, nome, tipo, ativo,
              EXISTS(
                SELECT 1
                FROM consultas
                WHERE consultas.sala_id = salas.id
                  AND consultas.deleted_at IS NULL
                LIMIT 1
              ) AS possui_consultas,
              criado_em, atualizado_em
       FROM salas
       WHERE clinica_id = ? AND deleted_at IS NULL
       ORDER BY ativo DESC, nome ASC`,
      [acesso.usuario.clinica_id],
    );

    return Response.json(rows);
  } catch (error) {
    console.error("Erro ao listar salas:", error);
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

    const body: SalaPayload = await request.json();
    const validacao = validarPayloadSala(body);
    if ("erro" in validacao) {
      return Response.json({ error: validacao.erro }, { status: 400 });
    }

    const [duplicadas] = await connection.execute<RowDataPacket[]>(
      `SELECT id FROM salas
       WHERE clinica_id = ? AND LOWER(TRIM(nome)) = LOWER(TRIM(?)) AND deleted_at IS NULL`,
      [acesso.usuario.clinica_id, validacao.nome],
    );

    if (duplicadas.length > 0) {
      return Response.json(
        { error: "Já existe uma sala com esse nome" },
        { status: 409 },
      );
    }

    const [resultado] = await connection.execute<ResultSetHeader>(
      `INSERT INTO salas (clinica_id, nome, tipo, ativo)
       VALUES (?, ?, ?, 1)`,
      [acesso.usuario.clinica_id, validacao.nome, validacao.tipo],
    );

    return Response.json({
      success: true,
      message: "Sala cadastrada",
      id: resultado.insertId,
    });
  } catch (error) {
    console.error("Erro ao criar sala:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
