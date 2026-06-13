import type { RowDataPacket } from "mysql2";
import { getConnection } from "@/lib/mysql";
import { type ConexaoMySQL, obterUsuarioDoCookie } from "../validacoes";

export async function GET() {
  const sessao = await obterUsuarioDoCookie();
  if (!sessao) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  let connection: ConexaoMySQL | undefined;
  try {
    connection = await getConnection();

    // Filtros da Agenda ficam centralizados para evitar múltiplos fetchs na UI.
    const [pacientes] = await connection.execute<RowDataPacket[]>(
      `SELECT id, nome, status_atendimento, psicologo_responsavel_id
       FROM pacientes
       WHERE clinica_id = ? AND ativo = 1 AND deleted_at IS NULL
       ORDER BY nome ASC`,
      [sessao.clinica_id],
    );

    const [psicologos] = await connection.execute<RowDataPacket[]>(
      `SELECT id, nome
       FROM usuarios
       WHERE clinica_id = ? AND perfil_id = 2
       ORDER BY nome ASC`,
      [sessao.clinica_id],
    );

    const [salas] = await connection.execute<RowDataPacket[]>(
      `SELECT id, nome, tipo
       FROM salas
       WHERE clinica_id = ? AND ativo = 1 AND deleted_at IS NULL
       ORDER BY nome ASC`,
      [sessao.clinica_id],
    );

    return Response.json({
      success: true,
      data: {
        pacientes,
        psicologos,
        salas,
      },
    });
  } catch (error) {
    console.error("Erro ao listar filtros da agenda:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
