import type { RowDataPacket } from "mysql2";
import { getConnection } from "@/lib/mysql";
import {
  aplicarFiltrosConsultas,
  type ConexaoMySQL,
  obterColunasTabela,
  obterFiltrosRelatorios,
  obterSessaoRelatorios,
  respostaErroInterno,
  respostaNaoAutenticado,
} from "../_utils";

export async function GET(request: Request) {
  let connection: ConexaoMySQL | undefined;

  try {
    connection = await getConnection();
    const usuario = await obterSessaoRelatorios(connection);
    if (!usuario) return respostaNaoAutenticado();

    const filtros = obterFiltrosRelatorios(request);
    const colunasConsultas = await obterColunasTabela(connection, "consultas");
    const filtrosConsulta = aplicarFiltrosConsultas(
      filtros,
      "c",
      colunasConsultas,
    );

    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT
          u.id AS psicologo_id,
          u.nome AS psicologo_nome,
          COUNT(c.id) AS total,
          SUM(c.status = 'concluido') AS concluidos,
          SUM(c.status = 'falta') AS faltas,
          SUM(c.status = 'cancelado') AS cancelados,
          SUM(c.status IN ('agendado', 'remarcado')) AS pendentes
       FROM consultas c
       INNER JOIN usuarios u ON u.id = c.psicologo_id
       WHERE ${filtrosConsulta.where.join(" AND ")}
       GROUP BY u.id, u.nome
       ORDER BY total DESC, u.nome ASC`,
      [usuario.clinica_id, ...filtrosConsulta.params],
    );

    return Response.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erro no relatório de atendimentos por psicólogo:", error);
    return respostaErroInterno();
  } finally {
    if (connection) await connection.end();
  }
}

