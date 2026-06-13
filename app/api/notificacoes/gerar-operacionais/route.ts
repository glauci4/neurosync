import { getConnection } from "@/lib/mysql";

import { validarAcessoNotificacoes } from "../_utils";
import {
  gerarNotificacoesPacienteSemConsultaAgendada,
  gerarNotificacoesPacienteSemResponsavel,
} from "../eventos/utils";

export async function POST() {
  let connection: Awaited<ReturnType<typeof getConnection>> | null = null;

  try {
    connection = await getConnection();
    const acesso = await validarAcessoNotificacoes(connection);
    if (!acesso.ok) {
      return Response.json({ error: acesso.error }, { status: acesso.status });
    }

    await connection.beginTransaction();
    const semResponsavel = await gerarNotificacoesPacienteSemResponsavel(
      connection,
      acesso.usuario.clinica_id,
    );
    const semConsultaAgendada =
      await gerarNotificacoesPacienteSemConsultaAgendada(
        connection,
        acesso.usuario.clinica_id,
      );
    await connection.commit();

    return Response.json({
      success: true,
      data: {
        paciente_sem_responsavel: semResponsavel.criadas,
        pacientes_sem_responsavel: semResponsavel.pacientes,
        paciente_sem_consulta_agendada: semConsultaAgendada.criadas,
        pacientes_sem_consulta_agendada: semConsultaAgendada.pacientes,
        total: semResponsavel.criadas + semConsultaAgendada.criadas,
      },
    });
  } catch (error) {
    if (connection) {
      await connection.rollback().catch(() => undefined);
    }

    console.error("Erro ao gerar notificações operacionais:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  } finally {
    if (connection) await connection.end();
  }
}
