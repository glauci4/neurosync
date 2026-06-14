import type { RowDataPacket } from "mysql2";
import { getConnection } from "@/lib/mysql";
import {
  aplicarFiltrosConsultas,
  type ConexaoMySQL,
  obterColunasTabela,
  obterDataMinimaFutura,
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

    const [pacientes] = await connection.execute<RowDataPacket[]>(
      `SELECT
          COUNT(*) AS total,
          SUM(ativo = 1) AS ativos,
          SUM(ativo = 0) AS inativos,
          SUM(status_atendimento = 'fila_espera') AS fila_espera,
          SUM(status_atendimento = 'em_atendimento') AS em_atendimento,
          SUM(status_atendimento = 'encerrado') AS encerrados
       FROM pacientes
       WHERE clinica_id = ? AND deleted_at IS NULL`,
      [usuario.clinica_id],
    );

    const [consultas] = await connection.execute<RowDataPacket[]>(
      `SELECT
          COUNT(*) AS total,
          SUM(status = 'agendado') AS agendadas,
          SUM(status = 'remarcado') AS remarcadas,
          SUM(status = 'cancelado') AS canceladas,
          SUM(status = 'falta') AS faltas,
          SUM(status = 'concluido') AS concluidas,
          ROUND((SUM(status = 'falta') / NULLIF(COUNT(*), 0)) * 100, 2) AS taxa_faltas
       FROM consultas c
       WHERE ${filtrosConsulta.where.join(" AND ")}`,
      [usuario.clinica_id, ...filtrosConsulta.params],
    );

    const colunaDataConsulta = colunasConsultas.has("data_consulta")
      ? "data_consulta"
      : colunasConsultas.has("data")
        ? "data"
        : null;
    let agendamentosFuturosTotal = 0;

    if (colunaDataConsulta && colunasConsultas.has("status")) {
      const filtrosAgendamentosFuturos = aplicarFiltrosConsultas(
        {
          ...filtros,
          dataInicio: obterDataMinimaFutura(filtros.dataInicio),
        },
        "c",
        colunasConsultas,
      );
      const whereAgendamentosFuturos = [...filtrosAgendamentosFuturos.where];

      if (!filtros.status) {
        whereAgendamentosFuturos.push("c.status IN ('agendado', 'remarcado')");
      }

      const [agendamentosFuturos] = await connection.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS total
         FROM consultas c
         WHERE ${whereAgendamentosFuturos.join(" AND ")}`,
        [usuario.clinica_id, ...filtrosAgendamentosFuturos.params],
      );

      agendamentosFuturosTotal = Number(agendamentosFuturos[0]?.total || 0);
    }

    const [salas] = await connection.execute<RowDataPacket[]>(
      `SELECT
          COUNT(*) AS total,
          SUM(ativo = 1) AS ativas,
          SUM(ativo = 0) AS inativas
       FROM salas
       WHERE clinica_id = ? AND deleted_at IS NULL`,
      [usuario.clinica_id],
    );

    const [acompanhamento] = await connection.execute<RowDataPacket[]>(
      `SELECT
          ROUND(AVG(
            TIMESTAMPDIFF(
              DAY,
              COALESCE(psicologo_responsavel_atribuido_em, criado_em),
              COALESCE(
                CASE
                  WHEN status_atendimento = 'encerrado' OR ativo = 0 THEN atualizado_em
                  ELSE NULL
                END,
                NOW()
              )
            )
          ), 0) AS tempo_medio_acompanhamento_dias
       FROM pacientes
       WHERE clinica_id = ? AND deleted_at IS NULL AND psicologo_responsavel_id IS NOT NULL`,
      [usuario.clinica_id],
    );

    return Response.json({
      success: true,
      data: {
        pacientes: pacientes[0] || {},
        consultas: consultas[0] || {},
        agendamentos_futuros: agendamentosFuturosTotal,
        tempo_medio_acompanhamento_dias:
          acompanhamento[0]?.tempo_medio_acompanhamento_dias ?? null,
        salas: salas[0] || {},
        observacoes: [
          "Tempo médio de acompanhamento usa a data de atribuição do responsável clínico e a data de encerramento estimada quando disponível.",
          "Pacientes encerrados por período preciso ainda dependem de campo dedicado de encerramento.",
        ],
      },
    });
  } catch (error) {
    console.error("Erro no resumo de relatórios:", error);
    return respostaErroInterno();
  } finally {
    if (connection) await connection.end();
  }
}
