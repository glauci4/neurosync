import type { RowDataPacket } from "mysql2";

import { getConnection } from "@/lib/mysql";

import { validarAcessoNotificacoes } from "../../_utils";
import { registrarNotificacaoPacienteSemConsultaAgendada } from "../utils";

export async function POST(request: Request) {
  let connection: Awaited<ReturnType<typeof getConnection>> | null = null;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      paciente_id?: number;
    };
    const pacienteId = Number(body.paciente_id || 0);
    if (!pacienteId) {
      return Response.json(
        { error: "Paciente inválido para notificação" },
        { status: 400 },
      );
    }

    connection = await getConnection();
    const acesso = await validarAcessoNotificacoes(connection);
    if (!acesso.ok) {
      return Response.json({ error: acesso.error }, { status: acesso.status });
    }

    const [pacientes] = await connection.execute<RowDataPacket[]>(
      `SELECT id, nome
         FROM pacientes
        WHERE id = ?
          AND clinica_id = ?
          AND deleted_at IS NULL`,
      [pacienteId, acesso.usuario.clinica_id],
    );

    if (pacientes.length === 0) {
      return Response.json(
        { error: "Paciente não encontrado" },
        { status: 404 },
      );
    }

    const paciente = pacientes[0];

    await connection.beginTransaction();
    const criadas = await registrarNotificacaoPacienteSemConsultaAgendada(
      connection,
      {
        clinicaId: acesso.usuario.clinica_id,
        pacienteId: Number(paciente.id),
        pacienteNome: String(paciente.nome || "Paciente"),
      },
    );
    await connection.commit();

    return Response.json({
      success: true,
      data: {
        criadas,
      },
    });
  } catch (error) {
    if (connection) {
      await connection.rollback().catch(() => undefined);
    }

    console.error(
      "Erro ao registrar notificação de paciente sem consulta agendada:",
      error,
    );
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  } finally {
    if (connection) await connection.end();
  }
}
