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
      {
        ...filtros,
        status: null,
      },
      "c",
      colunasConsultas,
    );

    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT
          COUNT(*) AS total_consultas,
          SUM(status = 'falta') AS total_faltas,
          ROUND((SUM(status = 'falta') / NULLIF(COUNT(*), 0)) * 100, 2) AS taxa_faltas
       FROM consultas c
       WHERE ${filtrosConsulta.where.join(" AND ")}`,
      [usuario.clinica_id, ...filtrosConsulta.params],
    );

    const [porPsicologo] = await connection.execute<RowDataPacket[]>(
      `SELECT
          u.id AS psicologo_id,
          u.nome AS psicologo_nome,
          COUNT(c.id) AS total_consultas,
          SUM(c.status = 'falta') AS total_faltas,
          ROUND((SUM(c.status = 'falta') / NULLIF(COUNT(c.id), 0)) * 100, 2) AS taxa_faltas
       FROM consultas c
       INNER JOIN usuarios u ON u.id = c.psicologo_id
       WHERE ${filtrosConsulta.where.join(" AND ")}
       GROUP BY u.id, u.nome
       ORDER BY taxa_faltas DESC, total_faltas DESC`,
      [usuario.clinica_id, ...filtrosConsulta.params],
    );

    return Response.json({
      success: true,
      data: {
        resumo: rows[0] || {
          total_consultas: 0,
          total_faltas: 0,
          taxa_faltas: 0,
        },
        por_psicologo: porPsicologo,
        observacao:
          "Taxa calculada por consultas registradas no período. Motivo/justificativa de falta exige campo futuro.",
      },
    });
  } catch (error) {
    console.error("Erro no relatório de taxa de faltas:", error);
    return respostaErroInterno();
  } finally {
    if (connection) await connection.end();
  }
}
