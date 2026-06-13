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
          p.id, p.nome, p.telefone, p.email, p.tipo, p.ativo, p.status_atendimento,
          p.criado_em, p.atualizado_em,
          p.psicologo_responsavel_id,
          pr.nome AS psicologo_responsavel_nome,
          pr.crp AS psicologo_responsavel_crp,
          DATE_FORMAT(p.psicologo_responsavel_atribuido_em, '%d/%m/%Y %H:%i') AS psicologo_responsavel_atribuido_em,
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
          ) AS tempo_acompanhamento_dias,
          CASE
            WHEN p.status_atendimento = 'encerrado' OR p.ativo = 0 THEN p.atualizado_em
            ELSE NULL
          END AS encerrado_em
       FROM pacientes p
       LEFT JOIN usuarios pr ON pr.id = p.psicologo_responsavel_id
       WHERE p.clinica_id = ? AND ${filtrosPacientes.where.join(" AND ")}
       ORDER BY p.ativo DESC, p.nome ASC`,
      [usuario.clinica_id, ...filtrosPacientes.params],
    );

    return Response.json({
      success: true,
      data: rows,
      observacao:
        "Data de encerramento é aproximada com atualizado_em enquanto não existir encerrado_em no banco.",
    });
  } catch (error) {
    console.error("Erro no relatório de pacientes detalhados:", error);
    return respostaErroInterno();
  } finally {
    if (connection) await connection.end();
  }
}

