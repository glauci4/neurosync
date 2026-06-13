import type { ResultSetHeader, RowDataPacket } from "mysql2";

import type { ConexaoMySQL } from "@/lib/auth/validarAcesso";
import {
  montarMensagemNotificacaoConsulta,
  obterTituloNotificacaoConsulta,
  type TipoNotificacaoConsulta,
} from "@/lib/notificacoes";

interface LinhaConsultaNotificacao extends RowDataPacket {
  id: number;
  clinica_id: number;
  paciente_id: number;
  paciente_nome: string;
  psicologo_id: number;
  psicologo_nome: string;
  psicologo_perfil_id: number;
  psicologo_ativo: number | boolean;
  sala_id: number | null;
  sala_nome: string | null;
  data_consulta_formatada: string;
  horario_inicio_formatado: string;
  status: string;
}

interface LinhaConsultaPendenteNotificacao extends RowDataPacket {
  id: number;
  paciente_nome: string;
  psicologo_id: number;
  psicologo_nome: string;
  psicologo_perfil_id: number;
  psicologo_ativo: number | boolean;
  sala_nome: string | null;
  data_consulta_formatada: string;
  horario_fim_formatado: string;
  status: string;
}

interface LinhaUsuarioNotificacao extends RowDataPacket {
  id: number;
}

export interface ResultadoGeracaoNotificacoesConsulta {
  tipo: TipoNotificacaoConsulta;
  consultas: number;
  criadas: number;
}

function formatarDataISOLocal(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function obterDataReferenciaDias(dias: number) {
  const data = new Date();
  data.setHours(0, 0, 0, 0);
  data.setDate(data.getDate() + dias);
  return formatarDataISOLocal(data);
}

async function obterColunasConsultas(connection: ConexaoMySQL) {
  const [colunas] = await connection.execute<RowDataPacket[]>(
    "SHOW COLUMNS FROM consultas",
  );
  return new Set(colunas.map((coluna) => String(coluna.Field)));
}

async function listarConsultasAlvo(
  connection: ConexaoMySQL,
  clinicaId: number,
  diasAntecedencia: number,
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
  const filtroDeletedAt = colunasConsultas.has("deleted_at")
    ? " AND c.deleted_at IS NULL"
    : "";
  const joinSala =
    colunaSala === "NULL" ? "" : `LEFT JOIN salas s ON s.id = ${colunaSala}`;
  const salaNomeExpr =
    colunaSala === "NULL" ? "NULL" : `COALESCE(s.nome, ${colunaSala})`;

  const [consultas] = await connection.execute<RowDataPacket[]>(
    `SELECT c.id, c.clinica_id, c.paciente_id, p.nome AS paciente_nome,
            c.psicologo_id, u.nome AS psicologo_nome, u.perfil_id AS psicologo_perfil_id,
            COALESCE(u.ativo, 1) AS psicologo_ativo,
            ${colunaSala} AS sala_id,
            ${salaNomeExpr} AS sala_nome,
            DATE_FORMAT(${colunaDataBase}, '%d/%m/%Y') AS data_consulta_formatada,
            TIME_FORMAT(${colunaHorarioInicioBase}, '%H:%i') AS horario_inicio_formatado,
            c.status
       FROM consultas c
       INNER JOIN pacientes p ON p.id = c.paciente_id
       INNER JOIN usuarios u ON u.id = c.psicologo_id
       ${joinSala}
      WHERE c.clinica_id = ?
        ${filtroDeletedAt}
        AND c.status NOT IN ('cancelado', 'cancelada', 'falta', 'concluido', 'concluida')
        AND DATE(${colunaDataBase}) = ?
      ORDER BY ${colunaDataBase} ASC, ${colunaHorarioInicioBase} ASC`,
    [clinicaId, obterDataReferenciaDias(diasAntecedencia)],
  );

  return consultas as LinhaConsultaNotificacao[];
}

async function listarConsultasPendentes(
  connection: ConexaoMySQL,
  clinicaId: number,
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
  const colunaHorarioFimBase = colunasConsultas.has("horario_fim")
    ? "c.horario_fim"
    : "ADDTIME(c.horario, '01:00:00')";
  const filtroDeletedAt = colunasConsultas.has("deleted_at")
    ? " AND c.deleted_at IS NULL"
    : "";
  const joinSala =
    colunaSala === "NULL" ? "" : `LEFT JOIN salas s ON s.id = ${colunaSala}`;
  const salaNomeExpr =
    colunaSala === "NULL" ? "NULL" : `COALESCE(s.nome, ${colunaSala})`;

  const [consultas] = await connection.execute<RowDataPacket[]>(
    `SELECT c.id, c.paciente_id, p.nome AS paciente_nome,
            c.psicologo_id, u.nome AS psicologo_nome, u.perfil_id AS psicologo_perfil_id,
            COALESCE(u.ativo, 1) AS psicologo_ativo,
            ${salaNomeExpr} AS sala_nome,
            DATE_FORMAT(${colunaDataBase}, '%d/%m/%Y') AS data_consulta_formatada,
            TIME_FORMAT(${colunaHorarioFimBase}, '%H:%i') AS horario_fim_formatado,
            c.status
       FROM consultas c
       INNER JOIN pacientes p ON p.id = c.paciente_id
       INNER JOIN usuarios u ON u.id = c.psicologo_id
       ${joinSala}
      WHERE c.clinica_id = ?
        ${filtroDeletedAt}
        AND c.status IN ('agendado', 'remarcado')
        AND TIMESTAMP(${colunaDataBase}, ${colunaHorarioFimBase}) < NOW()
      ORDER BY ${colunaDataBase} ASC, ${colunaHorarioFimBase} ASC`,
    [clinicaId],
  );

  return consultas as LinhaConsultaPendenteNotificacao[];
}

async function listarSecretariasAtivas(
  connection: ConexaoMySQL,
  clinicaId: number,
) {
  const [usuarios] = await connection.execute<RowDataPacket[]>(
    `SELECT id
       FROM usuarios
      WHERE clinica_id = ?
        AND perfil_id = 1
        AND COALESCE(ativo, 1) = 1`,
    [clinicaId],
  );

  return usuarios as LinhaUsuarioNotificacao[];
}

async function inserirNotificacaoSeNaoExistir(
  connection: ConexaoMySQL,
  params: {
    clinicaId: number;
    usuarioId: number;
    tipo: TipoNotificacaoConsulta;
    titulo: string;
    mensagem: string;
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
      SELECT ?, ?, ?, ?, ?, 'consulta', ?, 0, NOW()
       FROM DUAL
      WHERE NOT EXISTS (
        SELECT 1
          FROM notificacoes
         WHERE clinica_id = ?
           AND usuario_id = ?
           AND tipo = ?
           AND entidade_tipo = 'consulta'
           AND entidade_id = ?
      )`,
    [
      params.clinicaId,
      params.usuarioId,
      params.tipo,
      params.titulo,
      params.mensagem,
      params.entidadeId,
      params.clinicaId,
      params.usuarioId,
      params.tipo,
      params.entidadeId,
    ],
  );

  return resultado.affectedRows;
}

async function inserirNotificacaoConsultaPendenteSeNaoExistir(
  connection: ConexaoMySQL,
  params: {
    clinicaId: number;
    usuarioId: number;
    tipo: "consulta_pendente";
    titulo: string;
    mensagem: string;
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
      SELECT ?, ?, ?, ?, ?, 'consulta', ?, 0, NOW()
       FROM DUAL
      WHERE NOT EXISTS (
        SELECT 1
          FROM notificacoes
         WHERE clinica_id = ?
           AND usuario_id = ?
           AND tipo = ?
           AND entidade_tipo = 'consulta'
           AND entidade_id = ?
      )`,
    [
      params.clinicaId,
      params.usuarioId,
      params.tipo,
      params.titulo,
      params.mensagem,
      params.entidadeId,
      params.clinicaId,
      params.usuarioId,
      params.tipo,
      params.entidadeId,
    ],
  );

  return resultado.affectedRows;
}

async function gerarNotificacoesConsultaPorTipo(
  connection: ConexaoMySQL,
  clinicaId: number,
  tipo: TipoNotificacaoConsulta,
  diasAntecedencia: number,
) {
  const consultas = await listarConsultasAlvo(
    connection,
    clinicaId,
    diasAntecedencia,
  );
  const secretarias = await listarSecretariasAtivas(connection, clinicaId);
  const tituloSecretaria =
    tipo === "consulta_24h"
      ? "Você possui consultas agendadas para amanhã"
      : obterTituloNotificacaoConsulta(tipo);
  const tituloPsicologo =
    tipo === "consulta_24h"
      ? "Você possui uma consulta amanhã"
      : obterTituloNotificacaoConsulta(tipo);

  let criadas = 0;
  for (const consulta of consultas) {
    const mensagemSecretaria = montarMensagemNotificacaoConsulta({
      tipo,
      pacienteNome: consulta.paciente_nome,
      psicologoNome: consulta.psicologo_nome,
      salaNome: consulta.sala_nome,
      dataConsulta: consulta.data_consulta_formatada,
      horarioInicio: consulta.horario_inicio_formatado,
    });

    for (const secretaria of secretarias) {
      criadas += await inserirNotificacaoSeNaoExistir(connection, {
        clinicaId,
        usuarioId: Number(secretaria.id),
        tipo,
        titulo: tituloSecretaria,
        mensagem: mensagemSecretaria,
        entidadeId: Number(consulta.id),
      });
    }

    if (
      Number(consulta.psicologo_ativo) === 1 &&
      Number(consulta.psicologo_perfil_id) === 2
    ) {
      const mensagemPsicologo = montarMensagemNotificacaoConsulta({
        tipo,
        pacienteNome: consulta.paciente_nome,
        salaNome: consulta.sala_nome,
        dataConsulta: consulta.data_consulta_formatada,
        horarioInicio: consulta.horario_inicio_formatado,
      });

      criadas += await inserirNotificacaoSeNaoExistir(connection, {
        clinicaId,
        usuarioId: Number(consulta.psicologo_id),
        tipo,
        titulo: tituloPsicologo,
        mensagem: mensagemPsicologo,
        entidadeId: Number(consulta.id),
      });
    }
  }

  return {
    tipo,
    consultas: consultas.length,
    criadas,
  };
}

async function gerarNotificacoesConsultaPendente(
  connection: ConexaoMySQL,
  clinicaId: number,
) {
  const consultas = await listarConsultasPendentes(connection, clinicaId);
  const secretarias = await listarSecretariasAtivas(connection, clinicaId);
  const titulo = "Atendimento pendente de finalização";

  let criadas = 0;
  for (const consulta of consultas) {
    for (const secretaria of secretarias) {
      const mensagemSecretaria = `A consulta de ${consulta.paciente_nome} com ${consulta.psicologo_nome}, realizada em ${consulta.data_consulta_formatada} às ${consulta.horario_fim_formatado}, ainda não foi marcada como concluída.`;
      criadas += await inserirNotificacaoConsultaPendenteSeNaoExistir(
        connection,
        {
          clinicaId,
          usuarioId: Number(secretaria.id),
          tipo: "consulta_pendente",
          titulo,
          mensagem: mensagemSecretaria,
          entidadeId: Number(consulta.id),
        },
      );
    }

    if (
      Number(consulta.psicologo_ativo) === 1 &&
      Number(consulta.psicologo_perfil_id) === 2
    ) {
      const mensagemPsicologo = `A consulta de ${consulta.paciente_nome}, realizada em ${consulta.data_consulta_formatada} às ${consulta.horario_fim_formatado}, ainda não foi marcada como concluída.`;
      criadas += await inserirNotificacaoConsultaPendenteSeNaoExistir(
        connection,
        {
          clinicaId,
          usuarioId: Number(consulta.psicologo_id),
          tipo: "consulta_pendente",
          titulo,
          mensagem: mensagemPsicologo,
          entidadeId: Number(consulta.id),
        },
      );
    }
  }

  return {
    tipo: "consulta_pendente" as const,
    consultas: consultas.length,
    criadas,
  };
}

export async function gerarNotificacoesConsultas(
  connection: ConexaoMySQL,
  clinicaId: number,
) {
  const resultado5Dias = await gerarNotificacoesConsultaPorTipo(
    connection,
    clinicaId,
    "consulta_5_dias",
    5,
  );
  const resultado24h = await gerarNotificacoesConsultaPorTipo(
    connection,
    clinicaId,
    "consulta_24h",
    1,
  );

  return {
    consulta_5_dias: resultado5Dias.criadas,
    consulta_24h: resultado24h.criadas,
    total: resultado5Dias.criadas + resultado24h.criadas,
    consultas_5_dias: resultado5Dias.consultas,
    consultas_24h: resultado24h.consultas,
  };
}

export async function gerarNotificacoesConsultasPendentes(
  connection: ConexaoMySQL,
  clinicaId: number,
) {
  const resultado = await gerarNotificacoesConsultaPendente(
    connection,
    clinicaId,
  );

  return {
    consulta_pendente: resultado.criadas,
    total: resultado.criadas,
    consultas_pendentes: resultado.consultas,
  };
}

