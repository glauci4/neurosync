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

    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT
          id, nome, cpf, telefone, email, tipo, ativo,
          status_atendimento, criado_em, atualizado_em,
          TIMESTAMPDIFF(YEAR, data_nascimento, CURDATE()) AS idade
       FROM pacientes
       WHERE clinica_id = ?
         AND deleted_at IS NULL
         AND (status_atendimento = 'encerrado' OR ativo = 0)
       ORDER BY atualizado_em DESC, nome ASC`,
      [usuario.clinica_id],
    );

    return Response.json({
      success: true,
      data: rows,
      observacao:
        "Encerrados por período preciso exigem campo futuro como encerrado_em. Nesta versão a lista usa status atual.",
    });
  } catch (error) {
    console.error("Erro no relatório de pacientes encerrados:", error);
    return respostaErroInterno();
  } finally {
    if (connection) await connection.end();
  }
}
