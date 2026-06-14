import type { RowDataPacket } from "mysql2";
import { getConnection } from "@/lib/mysql";
import {
  type ConexaoMySQL,
  obterSessaoProntuario,
  validarPsicologo,
} from "../utils";

export async function GET() {
  let connection: ConexaoMySQL | undefined;

  try {
    connection = await getConnection();
    const sessao = await obterSessaoProntuario(connection);
    const erroPermissao = validarPsicologo(sessao);
    if (erroPermissao) {
      return Response.json({ error: erroPermissao }, { status: 403 });
    }
    const usuario = sessao as NonNullable<typeof sessao>;

    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT id, nome, crp
       FROM usuarios
       WHERE clinica_id = ? AND perfil_id = 2 AND id <> ?
       ORDER BY nome ASC`,
      [usuario.clinica_id, usuario.id],
    );

    return Response.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erro ao listar psicólogos para prontuário:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
