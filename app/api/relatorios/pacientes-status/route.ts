import type { RowDataPacket } from "mysql2";
import { getConnection } from "@/lib/mysql";
import {
  aplicarFiltrosPacientesRelatorios,
  type ConexaoMySQL,
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
    const filtrosPacientes = aplicarFiltrosPacientesRelatorios(filtros);

    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT
          COUNT(*) AS total,
          SUM(p.ativo = 1) AS ativos,
          SUM(p.ativo = 0) AS inativos,
          SUM(p.status_atendimento = 'fila_espera') AS fila_espera,
          SUM(p.status_atendimento = 'em_atendimento') AS em_atendimento,
          SUM(p.status_atendimento = 'encerrado') AS encerrados,
          ROUND(AVG(
            TIMESTAMPDIFF(
              DAY,
              COALESCE(p.psicologo_responsavel_atribuido_em, p.criado_em),
              COALESCE(
                CASE
                  WHEN p.status_atendimento = 'encerrado' OR p.ativo = 0 THEN p.atualizado_em
                  ELSE NULL
                END,
                NOW()
              )
            )
          ), 0) AS tempo_medio_acompanhamento_dias
       FROM pacientes p
       WHERE p.clinica_id = ? AND ${filtrosPacientes.where.join(" AND ")}`,
      [usuario.clinica_id, ...filtrosPacientes.params],
    );

    return Response.json({ success: true, data: rows[0] || {} });
  } catch (error) {
    console.error("Erro no relatório de pacientes por status:", error);
    return respostaErroInterno();
  } finally {
    if (connection) await connection.end();
  }
}

