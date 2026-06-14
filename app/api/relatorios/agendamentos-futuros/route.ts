import type { RowDataPacket } from "mysql2";
import { getConnection } from "@/lib/mysql";
import {
  aplicarFiltrosConsultas,
  type ConexaoMySQL,
  obterColunasTabela,
  obterDataHojeRelatorios,
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
      (!colunasConsultas.has("data_consulta") &&
        !colunasConsultas.has("data")) ||
      !colunasConsultas.has("horario_inicio") ||
      !colunasConsultas.has("horario_fim")
    ) {
      return Response.json({ success: true, data: [] });
    }
    const colunaDataConsulta = colunasConsultas.has("data_consulta")
      ? "data_consulta"
      : "data";

    const filtrosConsulta = aplicarFiltrosConsultas(
      {
        ...filtros,
        dataInicio: filtros.dataInicio || obterDataHojeRelatorios(),
        dataFim: null,
      },
      "c",
      colunasConsultas,
    );
    const where = [...filtrosConsulta.where];

    if (filtros.dataFim) {
      where.push(`DATE(c.${colunaDataConsulta}) <= ?`);
      filtrosConsulta.params.push(filtros.dataFim);
    }

    if (!filtros.status) {
      where.push("c.status IN ('agendado', 'remarcado')");
    }

    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT
          c.id, c.paciente_id, p.nome AS paciente_nome,
          c.psicologo_id, u.nome AS psicologo_nome,
          c.sala_id, COALESCE(s.nome, '-') AS sala_nome,
          c.${colunaDataConsulta} AS data_consulta, c.horario_inicio, c.horario_fim,
          c.tipo_atendimento, c.tipo_outro, c.status
       FROM consultas c
       INNER JOIN pacientes p ON p.id = c.paciente_id AND p.clinica_id = c.clinica_id
       INNER JOIN usuarios u ON u.id = c.psicologo_id AND u.clinica_id = c.clinica_id
       LEFT JOIN salas s ON s.id = c.sala_id AND s.clinica_id = c.clinica_id
       WHERE ${where.join(" AND ")}
       ORDER BY c.data_consulta ASC, c.horario_inicio ASC`,
      [usuario.clinica_id, ...filtrosConsulta.params],
    );

    return Response.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erro no relatório de agendamentos futuros:", error);
    return respostaErroInterno();
  } finally {
    if (connection) await connection.end();
  }
}
