import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { registrarNotificacaoTransferenciaPaciente } from "@/app/api/notificacoes/eventos/utils";
import { validarAcessoClinica } from "@/lib/auth/permissoesClinica";
import { getConnection } from "@/lib/mysql";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface TransferirPayload {
  psicologo_destino_id?: number;
  motivo?: string;
  observacoes?: string | null;
}

function normalizarTexto(valor?: string | null) {
  return String(valor || "")
    .trim()
    .replace(/\s+/g, " ");
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
    const body = (await request.json()) as TransferirPayload;

    if (!pacienteId || Number.isNaN(pacienteId)) {
      return Response.json({ error: "Paciente inválido" }, { status: 400 });
    }

    const psicologoDestinoId = Number(body.psicologo_destino_id || 0);
    const motivo = normalizarTexto(body.motivo);
    const observacoes = normalizarTexto(body.observacoes);

    if (!psicologoDestinoId) {
      return Response.json(
        { error: "Selecione o novo psicólogo responsável" },
        { status: 400 },
      );
    }
    if (!motivo || motivo.length < 5) {
      return Response.json(
        { error: "Informe um motivo válido para a transferência" },
        { status: 400 },
      );
    }

    await connection.beginTransaction();

    const [pacientes] = await connection.execute<RowDataPacket[]>(
      `SELECT id, clinica_id, nome, psicologo_responsavel_id
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
    const responsavelAtualId = paciente.psicologo_responsavel_id
      ? Number(paciente.psicologo_responsavel_id)
      : null;

    if (!responsavelAtualId) {
      await connection.rollback();
      return Response.json(
        { error: "Paciente não possui responsável clínico definido" },
        { status: 400 },
      );
    }

    const isAdminClinica =
      Number(sessao.usuario.perfil_id) === 2 &&
      Number(sessao.usuario.id) ===
        Number(sessao.usuario.responsavel_clinica_id);
    const isResponsavelAtual =
      Number(sessao.usuario.perfil_id) === 2 &&
      Number(sessao.usuario.id) === responsavelAtualId;

    if (!isAdminClinica && !isResponsavelAtual) {
      await connection.rollback();
      return Response.json(
        {
          error:
            "Apenas o psicólogo responsável atual ou o psicólogo administrador podem transferir o acompanhamento.",
        },
        { status: 403 },
      );
    }

    if (responsavelAtualId === psicologoDestinoId) {
      await connection.rollback();
      return Response.json(
        { error: "Selecione um psicólogo diferente do responsável atual" },
        { status: 400 },
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
      [psicologoDestinoId, sessao.usuario.clinica_id],
    );

    if (psicologos.length === 0) {
      await connection.rollback();
      return Response.json(
        {
          error:
            "O psicólogo selecionado não pertence à clínica, está inativo ou não possui permissão para acompanhamento clínico.",
        },
        { status: 400 },
      );
    }

    const [resultado] = await connection.execute<ResultSetHeader>(
      `UPDATE pacientes
       SET psicologo_responsavel_id = ?,
           psicologo_responsavel_atribuido_em = NOW(),
           psicologo_responsavel_atribuido_por_id = ?
       WHERE id = ?
         AND clinica_id = ?
         AND deleted_at IS NULL
         AND psicologo_responsavel_id = ?`,
      [
        psicologoDestinoId,
        sessao.usuario.id,
        pacienteId,
        sessao.usuario.clinica_id,
        responsavelAtualId,
      ],
    );

    if (resultado.affectedRows === 0) {
      await connection.rollback();
      return Response.json(
        {
          error:
            "Não foi possível transferir o acompanhamento. Atualize os dados e tente novamente.",
        },
        { status: 409 },
      );
    }

    const [ultimaConsulta] = await connection.execute<RowDataPacket[]>(
      `SELECT id
       FROM consultas
       WHERE paciente_id = ?
         AND clinica_id = ?
         AND deleted_at IS NULL
       ORDER BY data_consulta DESC, horario_inicio DESC, id DESC
       LIMIT 1`,
      [pacienteId, sessao.usuario.clinica_id],
    );

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
       ) VALUES (?, ?, ?, ?, ?, ?, 'transferencia_manual', ?, ?)`,
      [
        sessao.usuario.clinica_id,
        pacienteId,
        responsavelAtualId,
        psicologoDestinoId,
        ultimaConsulta[0]?.id || null,
        sessao.usuario.id,
        motivo,
        observacoes || null,
      ],
    );

    await connection.commit();

    await registrarNotificacaoTransferenciaPaciente(connection, {
      clinicaId: sessao.usuario.clinica_id,
      pacienteNome: String(paciente.nome || "Paciente"),
      novoPsicologoId: psicologoDestinoId,
      historicoId: resultadoHistorico.insertId,
    }).catch((error) => {
      console.error("Erro ao registrar notificação de transferência:", error);
    });

    return Response.json({
      success: true,
      message: "Acompanhamento transferido com sucesso",
    });
  } catch (error) {
    if (connection) {
      await connection.rollback().catch(() => undefined);
    }
    console.error("Erro ao transferir acompanhamento:", error);
    return Response.json(
      { error: "Erro interno ao transferir acompanhamento" },
      { status: 500 },
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

