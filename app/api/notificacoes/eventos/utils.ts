import type { ResultSetHeader, RowDataPacket } from "mysql2";

import type { ConexaoMySQL } from "@/lib/auth/validarAcesso";
import {
  obterRotuloTipoNotificacao,
  type TipoNotificacao,
} from "@/lib/notificacoes";

interface LinhaUsuarioRecebedor extends RowDataPacket {
  id: number;
}

interface LinhaConsultaNotificacao extends RowDataPacket {
  id: number;
  paciente_id: number;
  paciente_nome: string;
  psicologo_id: number;
  psicologo_nome: string;
  psicologo_perfil_id: number;
  psicologo_ativo: number | boolean;
  sala_nome: string | null;
  data_consulta_formatada: string;
  horario_inicio_formatado: string;
}

interface LinhaPacienteSemResponsavel extends RowDataPacket {
  id: number;
  nome: string;
}

interface LinhaPacienteEmAtendimento extends RowDataPacket {
  id: number;
  nome: string;
  status_atendimento: string;
  psicologo_responsavel_id?: number | null;
}

function formatoMensagemDataHora(data: string, hora: string) {
  return `${data} às ${hora}`;
}

async function obterColunasConsultas(connection: ConexaoMySQL) {
  const [colunas] = await connection.execute<RowDataPacket[]>(
    "SHOW COLUMNS FROM consultas",
  );
  return new Set(colunas.map((coluna) => String(coluna.Field)));
}

async function obterRecipientesSecretariaEAdmin(
  connection: ConexaoMySQL,
  clinicaId: number,
) {
  const [usuarios] = await connection.execute<RowDataPacket[]>(
    `SELECT u.id
       FROM usuarios u
       INNER JOIN clinicas c ON c.id = u.clinica_id
      WHERE u.clinica_id = ?
        AND COALESCE(u.ativo, 1) = 1
        AND (u.perfil_id = 1 OR u.id = c.responsavel_clinica_id)`,
    [clinicaId],
  );

  return usuarios as LinhaUsuarioRecebedor[];
}

async function pacientePossuiConsultaAgendada(
  connection: ConexaoMySQL,
  clinicaId: number,
  pacienteId: number,
) {
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT id
       FROM consultas
      WHERE clinica_id = ?
        AND paciente_id = ?
        AND deleted_at IS NULL
        AND status IN ('agendado', 'remarcado')
      LIMIT 1`,
    [clinicaId, pacienteId],
  );

  return rows.length > 0;
}

async function removerNotificacaoPacienteSemConsultaAgendada(
  connection: ConexaoMySQL,
  params: {
    clinicaId: number;
    pacienteId: number;
  },
) {
  await connection.execute(
    `DELETE FROM notificacoes
      WHERE clinica_id = ?
        AND tipo = ?
        AND entidade_tipo = ?
        AND entidade_id = ?`,
    [
      params.clinicaId,
      "paciente_sem_responsavel",
      "paciente_sem_consulta_agendada",
      params.pacienteId,
    ],
  );
}

async function removerNotificacaoPacienteSemResponsavel(
  connection: ConexaoMySQL,
  params: {
    clinicaId: number;
    pacienteId: number;
  },
) {
  await connection.execute(
    `DELETE FROM notificacoes
      WHERE clinica_id = ?
        AND tipo = ?
        AND entidade_tipo = ?
        AND entidade_id = ?`,
    [
      params.clinicaId,
      "paciente_sem_responsavel",
      "paciente",
      params.pacienteId,
    ],
  );
}

export async function reconciliarNotificacaoPacienteSemConsultaAgendada(
  connection: ConexaoMySQL,
  params: {
    clinicaId: number;
    pacienteId: number;
  },
) {
  const [pacientes] = await connection.execute<RowDataPacket[]>(
    `SELECT id, nome, status_atendimento
       FROM pacientes
      WHERE id = ?
        AND clinica_id = ?
        AND deleted_at IS NULL`,
    [params.pacienteId, params.clinicaId],
  );

  const paciente = pacientes[0] as LinhaPacienteEmAtendimento | undefined;
  if (!paciente) return { criada: 0, removidas: 0 };

  const possuiConsultaAgendada = await pacientePossuiConsultaAgendada(
    connection,
    params.clinicaId,
    params.pacienteId,
  );

  if (
    paciente.status_atendimento !== "em_atendimento" ||
    possuiConsultaAgendada
  ) {
    await removerNotificacaoPacienteSemConsultaAgendada(connection, params);
    return { criada: 0, removidas: 1 };
  }

  const criada = await registrarNotificacaoPacienteSemConsultaAgendada(
    connection,
    {
      clinicaId: params.clinicaId,
      pacienteId: params.pacienteId,
      pacienteNome: String(paciente.nome || "Paciente"),
    },
  );

  return { criada, removidas: 0 };
}

export async function reconciliarNotificacaoPacienteSemResponsavel(
  connection: ConexaoMySQL,
  params: {
    clinicaId: number;
    pacienteId: number;
  },
) {
  const [pacientes] = await connection.execute<RowDataPacket[]>(
    `SELECT id, nome, status_atendimento, psicologo_responsavel_id
       FROM pacientes
      WHERE id = ?
        AND clinica_id = ?
        AND deleted_at IS NULL`,
    [params.pacienteId, params.clinicaId],
  );

  const paciente = pacientes[0] as LinhaPacienteEmAtendimento | undefined;
  if (!paciente) return { criada: 0, removidas: 0 };

  if (
    paciente.status_atendimento !== "em_atendimento" ||
    paciente.psicologo_responsavel_id
  ) {
    await removerNotificacaoPacienteSemResponsavel(connection, params);
    return { criada: 0, removidas: 1 };
  }

  const criada = await registrarNotificacaoPacienteSemResponsavel(connection, {
    clinicaId: params.clinicaId,
    pacienteId: params.pacienteId,
    pacienteNome: String(paciente.nome || "Paciente"),
  });

  return { criada, removidas: 0 };
}

async function inserirNotificacaoUnica(
  connection: ConexaoMySQL,
  params: {
    clinicaId: number;
    usuarioId: number;
    tipo: TipoNotificacao;
    titulo: string;
    mensagem: string;
    entidadeTipo: string;
    entidadeId: number;
  },
) {
  const [resultado] = await connection.execute<ResultSetHeader>(
    `INSERT INTO notificacoes (
        clinica_id,
        usuario_id,
        tipo,
        titulo,
        mensagem,
        entidade_tipo,
        entidade_id,
        lida,
        criado_em
      )
      SELECT ?, ?, ?, ?, ?, ?, ?, 0, NOW()
       FROM DUAL
      WHERE NOT EXISTS (
        SELECT 1
          FROM notificacoes
         WHERE clinica_id = ?
           AND usuario_id = ?
           AND tipo = ?
           AND entidade_tipo = ?
           AND entidade_id = ?
      )`,
    [
      params.clinicaId,
      params.usuarioId,
      params.tipo,
      params.titulo,
      params.mensagem,
      params.entidadeTipo,
      params.entidadeId,
      params.clinicaId,
      params.usuarioId,
      params.tipo,
      params.entidadeTipo,
      params.entidadeId,
    ],
  );

  return resultado.affectedRows;
}

async function consultarResumoConsulta(
  connection: ConexaoMySQL,
  clinicaId: number,
  consultaId: number,
) {
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
  const joinSala =
    colunaSala === "NULL" ? "" : `LEFT JOIN salas s ON s.id = ${colunaSala}`;
  const salaNomeExpr =
    colunaSala === "NULL" ? "NULL" : `COALESCE(s.nome, ${colunaSala})`;

  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT c.id, c.paciente_id, p.nome AS paciente_nome,
            c.psicologo_id, u.nome AS psicologo_nome, u.perfil_id AS psicologo_perfil_id,
            COALESCE(u.ativo, 1) AS psicologo_ativo,
            ${salaNomeExpr} AS sala_nome,
            DATE_FORMAT(${colunaDataBase}, '%d/%m/%Y') AS data_consulta_formatada,
            TIME_FORMAT(${colunaHorarioInicioBase}, '%H:%i') AS horario_inicio_formatado
       FROM consultas c
       INNER JOIN pacientes p ON p.id = c.paciente_id
       INNER JOIN usuarios u ON u.id = c.psicologo_id
       ${joinSala}
      WHERE c.id = ? AND c.clinica_id = ? AND c.deleted_at IS NULL`,
    [consultaId, clinicaId],
  );

  return rows[0] as LinhaConsultaNotificacao | undefined;
}

export async function notificarTransferenciaPaciente(
  connection: ConexaoMySQL,
  params: {
    clinicaId: number;
    pacienteNome: string;
    novoPsicologoId: number;
    historicoId: number;
  },
) {
  return inserirNotificacaoUnica(connection, {
    clinicaId: params.clinicaId,
    usuarioId: params.novoPsicologoId,
    tipo: "transferencia_paciente",
    titulo: obterRotuloTipoNotificacao("transferencia_paciente"),
    mensagem: `O paciente ${params.pacienteNome} foi transferido para seu acompanhamento.`,
    entidadeTipo: "paciente_acompanhamento_historico",
    entidadeId: params.historicoId,
  });
}

export async function notificarConsultaAlterada(
  connection: ConexaoMySQL,
  params: {
    clinicaId: number;
    consultaId: number;
    tipo: "consulta_remarcada" | "consulta_cancelada";
  },
) {
  const consulta = await consultarResumoConsulta(
    connection,
    params.clinicaId,
    params.consultaId,
  );
  if (!consulta) return 0;

  const recipients = await connection.execute<RowDataPacket[]>(
    `SELECT DISTINCT u.id
       FROM usuarios u
       INNER JOIN clinicas c ON c.id = u.clinica_id
      WHERE u.clinica_id = ?
        AND COALESCE(u.ativo, 1) = 1
        AND (u.perfil_id = 1 OR u.id = c.responsavel_clinica_id
             OR u.id = ?)`,
    [params.clinicaId, consulta.psicologo_id],
  );

  const listaRecipients = recipients[0] as LinhaUsuarioRecebedor[];
  const titulo = obterRotuloTipoNotificacao(params.tipo);
  const dataHora = formatoMensagemDataHora(
    consulta.data_consulta_formatada,
    consulta.horario_inicio_formatado,
  );
  const sala = consulta.sala_nome || "Sala não informada";

  let criadas = 0;
  for (const usuario of listaRecipients) {
    const psicologoRecebedor =
      Number(usuario.id) === Number(consulta.psicologo_id);
    const contextoConsulta = psicologoRecebedor
      ? `A consulta de ${consulta.paciente_nome}, na sala ${sala}`
      : `A consulta de ${consulta.paciente_nome} com ${consulta.psicologo_nome}, na sala ${sala}`;
    const mensagem =
      params.tipo === "consulta_cancelada"
        ? `${contextoConsulta}, em ${dataHora}, foi cancelada.`
        : `${contextoConsulta} foi remarcada para ${dataHora}.`;

    criadas += await inserirNotificacaoUnica(connection, {
      clinicaId: params.clinicaId,
      usuarioId: Number(usuario.id),
      tipo: params.tipo,
      titulo,
      mensagem,
      entidadeTipo: "consulta",
      entidadeId: params.consultaId,
    });
  }

  return criadas;
}

export async function gerarNotificacoesPacienteSemResponsavel(
  connection: ConexaoMySQL,
  clinicaId: number,
) {
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT p.id, p.nome
       FROM pacientes p
      WHERE p.clinica_id = ?
        AND p.deleted_at IS NULL
        AND p.status_atendimento = 'em_atendimento'
        AND p.psicologo_responsavel_id IS NULL`,
    [clinicaId],
  );

  const pacientes = rows as LinhaPacienteSemResponsavel[];
  const recipients = await obterRecipientesSecretariaEAdmin(
    connection,
    clinicaId,
  );

  let criadas = 0;
  for (const paciente of pacientes) {
    for (const usuario of recipients) {
      criadas += await inserirNotificacaoUnica(connection, {
        clinicaId,
        usuarioId: Number(usuario.id),
        tipo: "paciente_sem_responsavel",
        titulo: obterRotuloTipoNotificacao("paciente_sem_responsavel"),
        mensagem: `Existe um paciente em atendimento sem psicólogo responsável definido: ${paciente.nome}.`,
        entidadeTipo: "paciente",
        entidadeId: Number(paciente.id),
      });
    }
  }

  return {
    tipo: "paciente_sem_responsavel" as const,
    pacientes: pacientes.length,
    criadas,
  };
}

export async function registrarNotificacaoTransferenciaPaciente(
  connection: ConexaoMySQL,
  params: {
    clinicaId: number;
    pacienteNome: string;
    novoPsicologoId: number;
    historicoId: number;
  },
) {
  return notificarTransferenciaPaciente(connection, params);
}

export async function registrarNotificacaoConsultaAlterada(
  connection: ConexaoMySQL,
  params: {
    clinicaId: number;
    consultaId: number;
    tipo: "consulta_remarcada" | "consulta_cancelada";
  },
) {
  return notificarConsultaAlterada(connection, params);
}

export async function registrarNotificacaoPacienteSemResponsavel(
  connection: ConexaoMySQL,
  params: {
    clinicaId: number;
    pacienteId: number;
    pacienteNome: string;
  },
) {
  const recipients = await obterRecipientesSecretariaEAdmin(
    connection,
    params.clinicaId,
  );

  let criadas = 0;
  for (const usuario of recipients) {
    criadas += await inserirNotificacaoUnica(connection, {
      clinicaId: params.clinicaId,
      usuarioId: Number(usuario.id),
      tipo: "paciente_sem_responsavel",
      titulo: obterRotuloTipoNotificacao("paciente_sem_responsavel"),
      mensagem: `Existe um paciente em atendimento sem psicólogo responsável definido: ${params.pacienteNome}.`,
      entidadeTipo: "paciente",
      entidadeId: params.pacienteId,
    });
  }
  return criadas;
}

export async function registrarNotificacaoPacienteSemConsultaAgendada(
  connection: ConexaoMySQL,
  params: {
    clinicaId: number;
    pacienteId: number;
    pacienteNome: string;
  },
) {
  const recipients = await obterRecipientesSecretariaEAdmin(
    connection,
    params.clinicaId,
  );

  let criadas = 0;
  for (const usuario of recipients) {
    criadas += await inserirNotificacaoUnica(connection, {
      clinicaId: params.clinicaId,
      usuarioId: Number(usuario.id),
      tipo: "paciente_sem_responsavel",
      titulo: "Paciente sem consulta agendada",
      mensagem: `O paciente ${params.pacienteNome} está em atendimento, mas ainda não possui consulta agendada.`,
      entidadeTipo: "paciente_sem_consulta_agendada",
      entidadeId: params.pacienteId,
    });
  }

  return criadas;
}

export async function gerarNotificacoesPacienteSemConsultaAgendada(
  connection: ConexaoMySQL,
  clinicaId: number,
) {
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT id
       FROM pacientes
      WHERE clinica_id = ?
        AND deleted_at IS NULL
        AND status_atendimento = 'em_atendimento'`,
    [clinicaId],
  );

  const pacientes = rows as Array<{ id: number }>;
  let criadas = 0;
  let removidas = 0;

  for (const paciente of pacientes) {
    const resultado = await reconciliarNotificacaoPacienteSemConsultaAgendada(
      connection,
      {
        clinicaId,
        pacienteId: Number(paciente.id),
      },
    );
    criadas += resultado.criada;
    removidas += resultado.removidas;
  }

  return {
    tipo: "paciente_sem_consulta_agendada" as const,
    pacientes: pacientes.length,
    criadas,
    removidas,
  };
}
