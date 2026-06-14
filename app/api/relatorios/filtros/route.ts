import type { RowDataPacket } from "mysql2";
import { getConnection } from "@/lib/mysql";
import {
  type ConexaoMySQL,
  obterSessaoRelatorios,
  respostaErroInterno,
  respostaNaoAutenticado,
} from "../_utils";

export async function GET() {
  let connection: ConexaoMySQL | undefined;

  try {
    connection = await getConnection();
    const usuario = await obterSessaoRelatorios(connection);
    if (!usuario) return respostaNaoAutenticado();

    const [psicologos] = await connection.execute<RowDataPacket[]>(
      `SELECT id, nome
       FROM usuarios
       WHERE clinica_id = ? AND perfil_id = 2 AND COALESCE(ativo, 1) = 1
       ORDER BY nome ASC`,
      [usuario.clinica_id],
    );

    const [salas] = await connection.execute<RowDataPacket[]>(
      `SELECT id, nome, tipo
       FROM salas
       WHERE clinica_id = ? AND deleted_at IS NULL
       ORDER BY ativo DESC, nome ASC`,
      [usuario.clinica_id],
    );

    const [pacientes] = await connection.execute<RowDataPacket[]>(
      `SELECT p.id, p.nome, p.ativo, p.status_atendimento,
              pr.nome AS psicologo_responsavel_nome
       FROM pacientes p
       LEFT JOIN usuarios pr ON pr.id = p.psicologo_responsavel_id
       WHERE p.clinica_id = ? AND p.deleted_at IS NULL
       ORDER BY p.nome ASC`,
      [usuario.clinica_id],
    );

    return Response.json({
      success: true,
      data: {
        psicologos,
        salas,
        pacientes,
        status_consulta: [
          "agendado",
          "remarcado",
          "cancelado",
          "falta",
          "concluido",
        ],
        status_paciente: ["fila_espera", "em_atendimento", "encerrado"],
        tipos_atendimento: [
          "triagem",
          "psicoterapia",
          "devolutiva",
          "avaliacao",
          "orientacao",
          "retorno",
          "alta",
          "outro",
        ],
      },
    });
  } catch (error) {
    console.error("Erro ao buscar filtros de relatórios:", error);
    return respostaErroInterno();
  } finally {
    if (connection) await connection.end();
  }
}
