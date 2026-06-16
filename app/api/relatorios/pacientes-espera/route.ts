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
    const filtrosPacientes = aplicarFiltrosPacientesRelatorios({
      ...filtros,
      dataInicio: null,
      dataFim: null,
      status: "fila_espera",
    });

    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT
          p.id, p.nome, p.cpf, p.telefone, p.email, p.tipo, p.criado_em,
          p.status_atendimento,
          p.psicologo_responsavel_id,
          psicologo_resp.nome AS psicologo_responsavel_nome,
          TIMESTAMPDIFF(YEAR, p.data_nascimento, CURDATE()) AS idade,
          p.responsavel_nome AS responsavel_nome
       FROM pacientes p
       LEFT JOIN usuarios psicologo_resp ON psicologo_resp.id = p.psicologo_responsavel_id
       WHERE p.clinica_id = ? AND ${filtrosPacientes.where.join(" AND ")}
         AND p.ativo = 1
         AND p.status_atendimento = 'fila_espera'
       ORDER BY p.criado_em ASC, p.nome ASC`,
      [usuario.clinica_id, ...filtrosPacientes.params],
    );

    return Response.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erro no relatório de pacientes em espera:", error);
    return respostaErroInterno();
  } finally {
    if (connection) await connection.end();
  }
}
