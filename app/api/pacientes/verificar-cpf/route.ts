import type { RowDataPacket } from "mysql2";
import { carregarSessaoClinica } from "@/lib/auth/validarAcesso";
import { getConnection } from "@/lib/mysql";

export async function GET(request: Request) {
  let connection = null;
  try {
    connection = await getConnection();
    const sessao = await carregarSessaoClinica(connection);
    if (!sessao.ok) {
      return Response.json({ error: sessao.error }, { status: sessao.status });
    }

    const { searchParams } = new URL(request.url);
    const cpf = searchParams.get("cpf")?.replace(/\D/g, "");
    const paciente_id = searchParams.get("paciente_id");

    if (!cpf) {
      return Response.json({ error: "CPF é obrigatório" }, { status: 400 });
    }

    if (cpf.length !== 11) {
      return Response.json({ exists: false });
    }

    const sql =
      "SELECT id FROM pacientes WHERE cpf = ?" +
      (paciente_id ? " AND id != ?" : "");
    const params: Array<string | number> = [cpf];

    if (paciente_id) {
      params.push(Number(paciente_id));
    }

    const [rows] = await connection.execute<RowDataPacket[]>(sql, params);
    return Response.json({ exists: rows.length > 0 });
  } catch (error) {
    console.error("Erro ao verificar CPF:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
