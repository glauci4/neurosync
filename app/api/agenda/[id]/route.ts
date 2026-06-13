import type { ResultSetHeader, RowDataPacket } from "mysql2";
import {
  reconciliarNotificacaoPacienteSemConsultaAgendada,
  registrarNotificacaoConsultaAlterada,
} from "@/app/api/notificacoes/eventos/utils";
import { getConnection } from "@/lib/mysql";
import { definirResponsavelNoAgendamento } from "../acompanhamento";
import {
  agendaDiaEstaFechada,
  type ConexaoMySQL,
  type ConsultaValidada,
  obterUsuarioDoCookie,
  STATUS_CONSULTA,
  softDeleteConsulta,
  validarPayloadAgenda,
  validarRegrasAgenda,
} from "../validacoes";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function obterColunasConsultas(connection: ConexaoMySQL) {
  const [colunas] = await connection.execute<RowDataPacket[]>(
    "SHOW COLUMNS FROM consultas",
  );
  return new Set(colunas.map((coluna) => String(coluna.Field)));
}

async function consultasPossuiSalaId(connection: ConexaoMySQL) {
  const colunas = await obterColunasConsultas(connection);
  return colunas.has("sala_id");
}

function ehAtualizacaoParcialStatus(body: Record<string, unknown>) {
  const chavesPermitidas = new Set(["status", "observacoes"]);
  const chaves = Object.keys(body);
  return (
    chaves.length > 0 &&
    chaves.every((chave) => chavesPermitidas.has(chave)) &&
    "status" in body
  );
}

function erroSchemaSalaId() {
  return Response.json(
    {
      error:
        "A tabela consultas ainda não possui sala_id. Atualize o banco antes de editar consultas.",
    },
    { status: 409 },
  );
}

async function obterConsulta(
  connection: ConexaoMySQL,
  id: number,
  clinicaId: number,
) {
  const possuiSalaId = await consultasPossuiSalaId(connection);
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT id, clinica_id, paciente_id, psicologo_id,
            ${possuiSalaId ? "sala_id" : "NULL"} AS sala_id,
            data_consulta, horario_inicio, horario_fim,
            tipo_atendimento, tipo_outro, status, observacoes,
            fechado_dia, criado_em, atualizado_em
     FROM consultas
     WHERE id = ? AND clinica_id = ? AND deleted_at IS NULL`,
    [id, clinicaId],
  );
  return rows[0] as
    | (ConsultaValidada & RowDataPacket & { id: number })
    | undefined;
}

export async function GET(_request: Request, context: RouteContext) {
  const sessao = await obterUsuarioDoCookie();
  if (!sessao) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await context.params;
  const consultaId = Number(id);
  if (!consultaId) {
    return Response.json({ error: "Consulta inválida" }, { status: 400 });
  }

  let connection: ConexaoMySQL | undefined;
  try {
    connection = await getConnection();
    const possuiSalaId = await consultasPossuiSalaId(connection);
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT c.id, c.clinica_id, c.paciente_id, p.nome AS paciente_nome,
              c.psicologo_id, u.nome AS psicologo_nome,
              ${possuiSalaId ? "c.sala_id" : "NULL"} AS sala_id,
              ${possuiSalaId ? "s.nome" : "NULL"} AS sala_nome,
              c.data_consulta, c.horario_inicio, c.horario_fim,
              c.tipo_atendimento, c.tipo_outro, c.status, c.observacoes,
              c.fechado_dia, c.criado_em, c.atualizado_em
       FROM consultas c
       INNER JOIN pacientes p ON p.id = c.paciente_id
       INNER JOIN usuarios u ON u.id = c.psicologo_id
       ${possuiSalaId ? "LEFT JOIN salas s ON s.id = c.sala_id" : ""}
       WHERE c.id = ? AND c.clinica_id = ? AND c.deleted_at IS NULL`,
      [consultaId, sessao.clinica_id],
    );

    if (rows.length === 0) {
      return Response.json(
        { error: "Consulta não encontrada" },
        { status: 404 },
      );
    }

    return Response.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Erro ao buscar consulta:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const sessao = await obterUsuarioDoCookie();
  if (!sessao) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await context.params;
  const consultaId = Number(id);
  if (!consultaId) {
    return Response.json({ error: "Consulta inválida" }, { status: 400 });
  }

  let connection: ConexaoMySQL | undefined;
  try {
    const bodyBruto = await request.json().catch(() => null);
    const body = bodyBruto && typeof bodyBruto === "object" ? bodyBruto : null;
    connection = await getConnection();
    const colunasConsultas = await obterColunasConsultas(connection);
    const possuiSalaId = colunasConsultas.has("sala_id");
    if (!possuiSalaId) return erroSchemaSalaId();

    const atual = await obterConsulta(
      connection,
      consultaId,
      sessao.clinica_id,
    );
    if (!atual) {
      return Response.json(
        { error: "Consulta não encontrada" },
        { status: 404 },
      );
    }

    if (!body) {
      return Response.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const atualizacaoParcialStatus = ehAtualizacaoParcialStatus(body);
    if (atualizacaoParcialStatus) {
      const status = String(body.status || "").trim();
      if (
        !STATUS_CONSULTA.includes(status as (typeof STATUS_CONSULTA)[number])
      ) {
        return Response.json(
          { error: "Status inválido para consulta." },
          { status: 400 },
        );
      }

      await connection.beginTransaction();

      const atualizacoes = ["status = ?"];
      const valores: Array<string | number | null> = [status];

      if ("observacoes" in body) {
        atualizacoes.push("observacoes = ?");
        valores.push(
          body.observacoes === null ? null : String(body.observacoes),
        );
      }

      valores.push(consultaId, sessao.clinica_id);

      const [resultado] = await connection.execute<ResultSetHeader>(
        `UPDATE consultas
         SET ${atualizacoes.join(", ")}
         WHERE id = ? AND clinica_id = ? AND deleted_at IS NULL`,
        valores,
      );

      if (resultado.affectedRows === 0) {
        await connection.rollback();
        return Response.json(
          { error: "Consulta não encontrada" },
          { status: 404 },
        );
      }

      await connection.commit();

      await reconciliarNotificacaoPacienteSemConsultaAgendada(connection, {
        clinicaId: sessao.clinica_id,
        pacienteId: atual.paciente_id,
      }).catch((error) => {
        console.error(
          "Erro ao reconciliar notificação de paciente sem consulta agendada:",
          error,
        );
      });

      if (["remarcado", "cancelado"].includes(status)) {
        await registrarNotificacaoConsultaAlterada(connection, {
          clinicaId: sessao.clinica_id,
          consultaId,
          tipo:
            status === "cancelado"
              ? "consulta_cancelada"
              : "consulta_remarcada",
        }).catch((error) => {
          console.error(
            "Erro ao registrar notificação de alteração de consulta:",
            error,
          );
        });
      }

      return Response.json({
        success: true,
        message: "Consulta atualizada com sucesso",
      });
    }

    if (
      await agendaDiaEstaFechada(
        connection,
        sessao.clinica_id,
        atual.data_consulta,
      )
    ) {
      return Response.json(
        {
          error:
            "Esta agenda já foi fechada e está disponível apenas para histórico.",
        },
        { status: 400 },
      );
    }

    const validacao = validarPayloadAgenda(body, atual);
    if ("erro" in validacao) {
      return Response.json({ error: validacao.erro }, { status: 400 });
    }

    const erroRegra = await validarRegrasAgenda(
      connection,
      sessao.clinica_id,
      validacao.consulta,
      consultaId,
    );
    if (erroRegra) {
      return Response.json({ error: erroRegra }, { status: 400 });
    }

    await connection.beginTransaction();

    const atualizacoes = [
      "paciente_id = ?",
      "psicologo_id = ?",
      "sala_id = ?",
      "data_consulta = ?",
      "horario_inicio = ?",
      "horario_fim = ?",
      "tipo_atendimento = ?",
      "tipo_outro = ?",
      "status = ?",
      "observacoes = ?",
    ];
    const valores: Array<string | number | null> = [
      validacao.consulta.paciente_id,
      validacao.consulta.psicologo_id,
      validacao.consulta.sala_id,
      validacao.consulta.data_consulta,
      validacao.consulta.horario_inicio,
      validacao.consulta.horario_fim,
      validacao.consulta.tipo_atendimento,
      validacao.consulta.tipo_outro,
      validacao.consulta.status,
      validacao.consulta.observacoes,
    ];

    if (colunasConsultas.has("data")) {
      atualizacoes.push("data = ?");
      valores.push(validacao.consulta.data_consulta);
    }
    if (colunasConsultas.has("horario")) {
      atualizacoes.push("horario = ?");
      valores.push(validacao.consulta.horario_inicio);
    }
    if (colunasConsultas.has("sala")) {
      atualizacoes.push("sala = ?");
      valores.push(validacao.consulta.sala_id);
    }

    valores.push(consultaId, sessao.clinica_id);

    const [resultado] = await connection.execute<ResultSetHeader>(
      `UPDATE consultas
       SET ${atualizacoes.join(", ")}
       WHERE id = ? AND clinica_id = ? AND deleted_at IS NULL`,
      valores,
    );

    if (resultado.affectedRows === 0) {
      await connection.rollback();
      return Response.json(
        { error: "Consulta não encontrada" },
        { status: 404 },
      );
    }

    if (body.definir_responsavel) {
      const resultadoResponsavel = await definirResponsavelNoAgendamento(
        connection,
        {
          clinicaId: sessao.clinica_id,
          pacienteId: validacao.consulta.paciente_id,
          psicologoId: validacao.consulta.psicologo_id,
          consultaId,
          usuarioId: sessao.id,
        },
      );

      if (resultadoResponsavel.erro) {
        await connection.rollback();
        return Response.json(
          { error: resultadoResponsavel.erro },
          { status: 400 },
        );
      }
    }

    await connection.commit();

    await reconciliarNotificacaoPacienteSemConsultaAgendada(connection, {
      clinicaId: sessao.clinica_id,
      pacienteId: validacao.consulta.paciente_id,
    }).catch((error) => {
      console.error(
        "Erro ao reconciliar notificação de paciente sem consulta agendada:",
        error,
      );
    });

    if (
      atual.status !== validacao.consulta.status &&
      ["remarcado", "cancelado"].includes(validacao.consulta.status)
    ) {
      await registrarNotificacaoConsultaAlterada(connection, {
        clinicaId: sessao.clinica_id,
        consultaId,
        tipo:
          validacao.consulta.status === "cancelado"
            ? "consulta_cancelada"
            : "consulta_remarcada",
      }).catch((error) => {
        console.error(
          "Erro ao registrar notificação de alteração de consulta:",
          error,
        );
      });
    }

    return Response.json({
      success: true,
      message: "Consulta atualizada com sucesso",
    });
  } catch (error) {
    if (connection) {
      await connection.rollback().catch(() => undefined);
    }
    console.error("Erro ao atualizar consulta:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const sessao = await obterUsuarioDoCookie();
  if (!sessao) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await context.params;
  const consultaId = Number(id);
  if (!consultaId) {
    return Response.json({ error: "Consulta inválida" }, { status: 400 });
  }

  let connection: ConexaoMySQL | undefined;
  try {
    connection = await getConnection();
    const atual = await obterConsulta(
      connection,
      consultaId,
      sessao.clinica_id,
    );
    if (!atual) {
      return Response.json(
        { error: "Consulta não encontrada" },
        { status: 404 },
      );
    }
    if (
      await agendaDiaEstaFechada(
        connection,
        sessao.clinica_id,
        atual.data_consulta,
      )
    ) {
      return Response.json(
        {
          error:
            "Esta agenda já foi fechada e está disponível apenas para histórico.",
        },
        { status: 400 },
      );
    }
    // Soft delete: a consulta deixa de aparecer na Agenda comum sem apagar
    // histórico necessário para prontuários e auditorias futuras.
    const removida = await softDeleteConsulta(
      connection,
      consultaId,
      sessao.clinica_id,
    );

    if (!removida) {
      return Response.json(
        { error: "Consulta não encontrada" },
        { status: 404 },
      );
    }

    await reconciliarNotificacaoPacienteSemConsultaAgendada(connection, {
      clinicaId: sessao.clinica_id,
      pacienteId: atual.paciente_id,
    }).catch((error) => {
      console.error(
        "Erro ao reconciliar notificação de paciente sem consulta agendada:",
        error,
      );
    });

    return Response.json({
      success: true,
      message: "Consulta removida com sucesso",
    });
  } catch (error) {
    console.error("Erro ao remover consulta:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
