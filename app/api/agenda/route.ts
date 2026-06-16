import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { reconciliarNotificacaoPacienteSemConsultaAgendada } from "@/app/api/notificacoes/eventos/utils";
import { getConnection } from "@/lib/mysql";
import { definirResponsavelNoAgendamento } from "./acompanhamento";
import {
  type ConexaoMySQL,
  obterUsuarioDoCookie,
  validarPayloadAgenda,
  validarRegrasAgenda,
} from "./validacoes";

async function obterColunasConsultas(connection: ConexaoMySQL) {
  const [colunas] = await connection.execute<RowDataPacket[]>(
    "SHOW COLUMNS FROM consultas",
  );
  return new Set(colunas.map((coluna) => String(coluna.Field)));
}

function erroSchemaSalaId() {
  return Response.json(
    {
      error:
        "A tabela consultas ainda não possui sala_id. Atualize o banco antes de agendar consultas.",
    },
    { status: 409 },
  );
}

export async function GET(request: Request) {
  const sessao = await obterUsuarioDoCookie();
  if (!sessao) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  let connection: ConexaoMySQL | undefined;
  try {
    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get("data_inicio");
    const dataFim = searchParams.get("data_fim");
    const psicologoId = Number(searchParams.get("psicologo_id") || 0);
    const salaId = Number(searchParams.get("sala_id") || 0);
    const pacienteId = Number(searchParams.get("paciente_id") || 0);
    const status = searchParams.get("status");
    const tipoAtendimento = searchParams.get("tipo_atendimento");

    connection = await getConnection();
    const colunasConsultas = await obterColunasConsultas(connection);
    const possuiSalaId = colunasConsultas.has("sala_id");
    const possuiSalaLegada = colunasConsultas.has("sala");
    const colunaSala = possuiSalaId
      ? "c.sala_id"
      : possuiSalaLegada
        ? "c.sala"
        : "NULL";
    const colunaDataBase = colunasConsultas.has("data_consulta")
      ? "c.data_consulta"
      : "c.data";
    const colunaHorarioInicioBase = colunasConsultas.has("horario_inicio")
      ? "c.horario_inicio"
      : "c.horario";
    const colunaHorarioFimBase = colunasConsultas.has("horario_fim")
      ? "c.horario_fim"
      : "ADDTIME(c.horario, '01:00:00')";
    const colunaData = `DATE_FORMAT(${colunaDataBase}, '%Y-%m-%d')`;
    const colunaHorarioInicio = `TIME_FORMAT(${colunaHorarioInicioBase}, '%H:%i:%s')`;
    const colunaHorarioFim = `TIME_FORMAT(${colunaHorarioFimBase}, '%H:%i:%s')`;
    const colunaTipoAtendimento = colunasConsultas.has("tipo_atendimento")
      ? "c.tipo_atendimento"
      : "'psicoterapia'";
    const colunaTipoOutro = colunasConsultas.has("tipo_outro")
      ? "c.tipo_outro"
      : "NULL";
    const colunaFechadoDia = colunasConsultas.has("fechado_dia")
      ? "c.fechado_dia"
      : "0";
    const filtroDeletedAt = colunasConsultas.has("deleted_at")
      ? " AND c.deleted_at IS NULL"
      : "";
    const joinSala =
      possuiSalaId || possuiSalaLegada
        ? `LEFT JOIN salas s ON s.id = ${colunaSala}`
        : "";

    let where = `c.clinica_id = ?${filtroDeletedAt}`;
    const params: Array<string | number> = [sessao.clinica_id];

    if (dataInicio) {
      where += ` AND ${colunaDataBase} >= ?`;
      params.push(dataInicio);
    }
    if (dataFim) {
      where += ` AND ${colunaDataBase} <= ?`;
      params.push(dataFim);
    }
    if (psicologoId) {
      where += " AND c.psicologo_id = ?";
      params.push(psicologoId);
    }
    if (salaId && (possuiSalaId || possuiSalaLegada)) {
      where += ` AND ${colunaSala} = ?`;
      params.push(salaId);
    } else if (salaId) {
      where += " AND 1 = 0";
    }
    if (pacienteId) {
      where += " AND c.paciente_id = ?";
      params.push(pacienteId);
    }
    if (status) {
      where += " AND c.status = ?";
      params.push(status);
    }
    if (tipoAtendimento && colunasConsultas.has("tipo_atendimento")) {
      where += " AND c.tipo_atendimento = ?";
      params.push(tipoAtendimento);
    } else if (tipoAtendimento) {
      where += " AND 1 = 0";
    }

    const [consultas] = await connection.execute<RowDataPacket[]>(
      `SELECT c.id, c.clinica_id, c.paciente_id, p.nome AS paciente_nome,
              c.psicologo_id, u.nome AS psicologo_nome, u.avatar_url AS psicologo_avatar_url,
              ${colunaSala} AS sala_id,
              COALESCE(s.nome, ${colunaSala}) AS sala_nome,
              ${colunaData} AS data_consulta,
              ${colunaHorarioInicio} AS horario_inicio,
              ${colunaHorarioFim} AS horario_fim,
              ${colunaTipoAtendimento} AS tipo_atendimento,
              ${colunaTipoOutro} AS tipo_outro,
              c.status, c.observacoes,
              ${colunaFechadoDia} AS fechado_dia,
              c.criado_em, c.atualizado_em,
              (
                SELECT rc.id
                FROM registros_clinicos rc
                WHERE rc.consulta_id = c.id
                  AND rc.clinica_id = c.clinica_id
                  AND rc.deleted_at IS NULL
                ORDER BY FIELD(rc.status, 'assinado', 'finalizado', 'rascunho'), rc.atualizado_em DESC, rc.id DESC
                LIMIT 1
              ) AS prontuario_id,
              (
                SELECT rc.status
                FROM registros_clinicos rc
                WHERE rc.consulta_id = c.id
                  AND rc.clinica_id = c.clinica_id
                  AND rc.deleted_at IS NULL
                ORDER BY FIELD(rc.status, 'assinado', 'finalizado', 'rascunho'), rc.atualizado_em DESC, rc.id DESC
                LIMIT 1
              ) AS prontuario_status
       FROM consultas c
       INNER JOIN pacientes p ON p.id = c.paciente_id
       INNER JOIN usuarios u ON u.id = c.psicologo_id
       ${joinSala}
       WHERE ${where}
       ORDER BY ${colunaDataBase} ASC, ${colunaHorarioInicioBase} ASC`,
      params,
    );

    return Response.json({ success: true, data: consultas });
  } catch (error) {
    console.error("Erro ao listar agenda:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

export async function POST(request: Request) {
  const sessao = await obterUsuarioDoCookie();
  if (!sessao) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  let connection: ConexaoMySQL | undefined;
  try {
    const body = await request.json();
    // Toda consulta criada pelo modal operacional nasce como agendada.
    // Mudanças de status são tratadas em fluxos próprios para não confundir
    // status da consulta com status clínico do paciente.
    const validacao = validarPayloadAgenda({ ...body, status: "agendado" });
    if ("erro" in validacao) {
      return Response.json({ error: validacao.erro }, { status: 400 });
    }

    connection = await getConnection();
    const colunasConsultas = await obterColunasConsultas(connection);
    const possuiSalaId = colunasConsultas.has("sala_id");
    if (!possuiSalaId) return erroSchemaSalaId();
    await connection.beginTransaction();

    // Regras clínicas críticas: antes de inserir, a Agenda valida vínculo com
    // Pacientes, Salas e Funcionamento para evitar horários inválidos.
    const erroRegra = await validarRegrasAgenda(
      connection,
      sessao.clinica_id,
      validacao.consulta,
    );
    if (erroRegra) {
      return Response.json({ error: erroRegra }, { status: 400 });
    }

    await connection.beginTransaction();

    const campos = [
      "clinica_id",
      "paciente_id",
      "psicologo_id",
      "sala_id",
      "data_consulta",
      "horario_inicio",
      "horario_fim",
      "tipo_atendimento",
      "tipo_outro",
      "status",
      "observacoes",
    ];
    const valores: Array<string | number | null> = [
      sessao.clinica_id,
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
      campos.push("data");
      valores.push(validacao.consulta.data_consulta);
    }
    if (colunasConsultas.has("horario")) {
      campos.push("horario");
      valores.push(validacao.consulta.horario_inicio);
    }
    if (colunasConsultas.has("sala")) {
      campos.push("sala");
      valores.push(validacao.consulta.sala_id);
    }

    const placeholders = campos.map(() => "?").join(", ");
    const [resultado] = await connection.execute<ResultSetHeader>(
      `INSERT INTO consultas (${campos.join(", ")}) VALUES (${placeholders})`,
      valores,
    );

    if (body.definir_responsavel) {
      const resultadoResponsavel = await definirResponsavelNoAgendamento(
        connection,
        {
          clinicaId: sessao.clinica_id,
          pacienteId: validacao.consulta.paciente_id,
          psicologoId: validacao.consulta.psicologo_id,
          consultaId: resultado.insertId,
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

    return Response.json({
      success: true,
      message: "Consulta agendada com sucesso",
      id: resultado.insertId,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback().catch(() => undefined);
    }
    console.error("Erro ao criar agendamento:", error);
    return Response.json(
      {
        success: false,
        message: "Não foi possível agendar a consulta.",
      },
      { status: 500 },
    );
  } finally {
    if (connection) await connection.end();
  }
}
