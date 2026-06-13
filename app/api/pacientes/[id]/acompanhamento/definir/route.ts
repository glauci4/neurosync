import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { reconciliarNotificacaoPacienteSemResponsavel } from "@/app/api/notificacoes/eventos/utils";
import { buscarDadosRegistro, registrarLog } from "@/lib/auditoria";
import { validarAcessoClinica } from "@/lib/auth/permissoesClinica";
import { getConnection } from "@/lib/mysql";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface DefinirResponsavelPayload {
  psicologo_id?: number;
}

export async function POST(request: Request, context: RouteContext) {
  let connection: Awaited<ReturnType<typeof getConnection>> | undefined;

  try {
    connection = await getConnection();
    const sessao = await validarAcessoClinica(connection);
    if (!sessao.ok) {
      return Response.json({ error: sessao.error }, { status: sessao.status });
    }

    const { id } = await context.params;
    const pacienteId = Number(id);
    const body = (await request.json()) as DefinirResponsavelPayload;
    const psicologoId = Number(body.psicologo_id || 0);

    if (!pacienteId || Number.isNaN(pacienteId)) {
      return Response.json({ error: "Paciente inválido" }, { status: 400 });
    }

    if (!psicologoId) {
      return Response.json(
        { error: "Selecione um psicólogo responsável." },
        { status: 400 },
      );
    }

    await connection.beginTransaction();

    const [pacientes] = await connection.execute<RowDataPacket[]>(
      `SELECT id, clinica_id, nome, status_atendimento, psicologo_responsavel_id
       FROM pacientes
       WHERE id = ? AND clinica_id = ? AND deleted_at IS NULL
       FOR UPDATE`,
      [pacienteId, sessao.usuario.clinica_id],
    );

    if (pacientes.length === 0) {
      await connection.rollback();
      return Response.json(
        { error: "Paciente não encontrado" },
        { status: 404 },
      );
    }

    const paciente = pacientes[0];

    if (paciente.status_atendimento !== "em_atendimento") {
      await connection.rollback();
      return Response.json(
        {
          error:
            "O responsável só pode ser definido para pacientes em atendimento.",
        },
        { status: 400 },
      );
    }

    if (paciente.psicologo_responsavel_id) {
      await connection.rollback();
      return Response.json(
        { error: "Paciente já possui psicólogo responsável definido" },
        { status: 409 },
      );
    }

    const [psicologos] = await connection.execute<RowDataPacket[]>(
      `SELECT id, nome
       FROM usuarios
       WHERE id = ?
         AND clinica_id = ?
         AND perfil_id = 2
         AND COALESCE(ativo, 1) = 1
       LIMIT 1`,
      [psicologoId, sessao.usuario.clinica_id],
    );

    if (psicologos.length === 0) {
      await connection.rollback();
      return Response.json(
        {
          error:
            "O psicólogo selecionado não pertence à clínica ou está inativo.",
        },
        { status: 400 },
      );
    }

    const dadosAntigos = await buscarDadosRegistro("pacientes", pacienteId);

    const [resultado] = await connection.execute<ResultSetHeader>(
      `UPDATE pacientes
       SET psicologo_responsavel_id = ?,
           psicologo_responsavel_atribuido_em = NOW(),
           psicologo_responsavel_atribuido_por_id = ?,
           atualizado_em = NOW()
       WHERE id = ?
         AND clinica_id = ?
         AND deleted_at IS NULL
         AND psicologo_responsavel_id IS NULL`,
      [psicologoId, sessao.usuario.id, pacienteId, sessao.usuario.clinica_id],
    );

    if (resultado.affectedRows === 0) {
      await connection.rollback();
      return Response.json(
        {
          error:
            "Não foi possível definir o responsável. Atualize os dados e tente novamente.",
        },
        { status: 409 },
      );
    }

    const [resultadoHistorico] = await connection.execute<ResultSetHeader>(
      `INSERT INTO paciente_acompanhamento_historico (
         clinica_id,
         paciente_id,
         psicologo_origem_id,
         psicologo_destino_id,
         consulta_id_origem,
         transferido_por_id,
         tipo_evento,
         motivo,
         observacoes
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sessao.usuario.clinica_id,
        pacienteId,
        null,
        psicologoId,
        null,
        sessao.usuario.id,
        "primeira_atribuicao",
        "Definição manual do responsável",
        "Responsável definido pelo modal de detalhes do paciente.",
      ],
    );

    await connection.commit();

    await reconciliarNotificacaoPacienteSemResponsavel(connection, {
      clinicaId: sessao.usuario.clinica_id,
      pacienteId,
    }).catch((error) => {
      console.error(
        "Erro ao reconciliar notificação de paciente sem responsável:",
        error,
      );
    });

    const dadosNovos = await buscarDadosRegistro("pacientes", pacienteId);
    await registrarLog({
      usuario_id: sessao.usuario.id,
      tabela: "pacientes",
      registro_id: pacienteId,
      acao: "UPDATE",
      dados_antigos: dadosAntigos,
      dados_novos: dadosNovos,
    });

    return Response.json({
      success: true,
      message: "Responsável definido com sucesso",
      historicoId: resultadoHistorico.insertId,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback().catch(() => undefined);
    }
    console.error("Erro ao definir responsável do paciente:", error);
    return Response.json(
      { error: "Erro interno ao definir responsável" },
      { status: 500 },
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
