import type { RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import { getConnection } from "@/lib/mysql";

type ConexaoMySQL = Awaited<ReturnType<typeof getConnection>>;

async function obterUsuarioDoCookie() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("usuario_neurosync");
  if (!sessionCookie) return null;
  try {
    return JSON.parse(sessionCookie.value) as {
      id: number;
      email: string;
      clinica_id: number;
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const sessao = await obterUsuarioDoCookie();
  if (!sessao) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  let connection: ConexaoMySQL | undefined;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT id, clinica_id, nome, tipo, ativo, criado_em, atualizado_em
       FROM salas
       WHERE clinica_id = ? AND ativo = 1 AND deleted_at IS NULL
       ORDER BY nome ASC`,
      [sessao.clinica_id],
    );

    // Preparação para Agenda: esta listagem já nasce separada para que
    // agendamentos usem apenas salas ativas e nunca exibam salas excluídas.
    return Response.json(rows);
  } catch (error) {
    console.error("Erro ao listar salas ativas para agenda:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

