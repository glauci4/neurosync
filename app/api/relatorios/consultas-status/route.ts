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
          c.status,
          COUNT(*) AS total
       FROM consultas c
       WHERE ${filtrosConsulta.where.join(" AND ")}
       GROUP BY c.status
       ORDER BY total DESC`,
      [usuario.clinica_id, ...filtrosConsulta.params],
    );

    return Response.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erro no relatório de consultas por status:", error);
    return respostaErroInterno();
  } finally {
    if (connection) await connection.end();
  }
}
