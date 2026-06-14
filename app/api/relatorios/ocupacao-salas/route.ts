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
    if (
      !colunasConsultas.has("sala_id") ||
      !colunasConsultas.has("horario_inicio") ||
      !colunasConsultas.has("horario_fim")
    ) {
      const [salas] = await connection.execute<RowDataPacket[]>(
        `SELECT
            id AS sala_id,
            nome AS sala_nome,
            tipo AS sala_tipo,
            ativo,
            0 AS total_consultas,
            0 AS concluidas,
            0 AS futuras_ou_pendentes,
            0 AS faltas,
            0 AS canceladas,
            0 AS horas_ocupadas,
            NULL AS horarios_mais_utilizados
         FROM salas
         WHERE clinica_id = ? AND deleted_at IS NULL
         ORDER BY ativo DESC, nome ASC`,
        [usuario.clinica_id],
      );

      return Response.json({
        success: true,
        data: salas,
        observacao:
          "Ocupação indisponível até a base possuir vínculo de sala e horários nas consultas.",
      });
    }

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
          s.id AS sala_id,
          s.nome AS sala_nome,
          s.tipo AS sala_tipo,
          s.ativo,
          COUNT(c.id) AS total_consultas,
          SUM(c.status = 'concluido') AS concluidas,
          SUM(c.status IN ('agendado', 'remarcado')) AS futuras_ou_pendentes,
          SUM(c.status = 'falta') AS faltas,
          SUM(c.status = 'cancelado') AS canceladas,
          ROUND(SUM(TIMESTAMPDIFF(MINUTE, c.horario_inicio, c.horario_fim)) / 60, 2) AS horas_ocupadas,
          GROUP_CONCAT(
            DISTINCT TIME_FORMAT(c.horario_inicio, '%H:00')
            ORDER BY c.horario_inicio
            SEPARATOR ', '
          ) AS horarios_mais_utilizados
       FROM salas s
       LEFT JOIN consultas c
         ON c.sala_id = s.id
        AND ${filtrosConsulta.where.join(" AND ")}
      WHERE s.clinica_id = ? AND s.deleted_at IS NULL
       GROUP BY s.id, s.nome, s.tipo, s.ativo
       ORDER BY horas_ocupadas DESC, total_consultas DESC, s.nome ASC`,
      [usuario.clinica_id, ...filtrosConsulta.params, usuario.clinica_id],
    );

    return Response.json({
      success: true,
      data: rows,
      observacao:
        "Ocupação baseada em consultas registradas. Taxa percentual real por capacidade operacional exige regra futura de capacidade/funcionamento.",
    });
  } catch (error) {
    console.error("Erro no relatório de ocupação de salas:", error);
    return respostaErroInterno();
  } finally {
    if (connection) await connection.end();
  }
}
