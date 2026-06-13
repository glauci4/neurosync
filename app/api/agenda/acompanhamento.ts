import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { ConexaoMySQL } from "./validacoes";

interface DefinirResponsavelParams {
  clinicaId: number;
  pacienteId: number;
  psicologoId: number;
  consultaId: number;
  usuarioId: number;
  motivo?: string | null;
}

interface DefinirResponsavelResultado {
  aplicado: boolean;
  jaPossuiaResponsavel: boolean;
  erro?: string;
}

async function pacientePossuiResponsavelAtivo(
  connection: ConexaoMySQL,
  pacienteId: number,
  clinicaId: number,
) {
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT psicologo_responsavel_id
     FROM pacientes
     WHERE id = ? AND clinica_id = ? AND deleted_at IS NULL
     FOR UPDATE`,
    [pacienteId, clinicaId],
  );

  if (rows.length === 0) {
    return { erro: "Paciente não encontrado" } as const;
  }

  return {
    psicologoResponsavelId: rows[0].psicologo_responsavel_id
      ? Number(rows[0].psicologo_responsavel_id)
      : null,
  } as const;
}

async function psicologoPertenceAClinica(
  connection: ConexaoMySQL,
  psicologoId: number,
  clinicaId: number,
) {
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT id
     FROM usuarios
     WHERE id = ? AND clinica_id = ? AND perfil_id = 2
     LIMIT 1`,
    [psicologoId, clinicaId],
  );

  return rows.length > 0;
}

async function historicoJaExiste(
  connection: ConexaoMySQL,
  pacienteId: number,
  consultaId: number,
) {
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT id
     FROM paciente_acompanhamento_historico
     WHERE paciente_id = ?
       AND tipo_evento = 'primeira_atribuicao'
       AND consulta_id_origem = ?
       AND deleted_at IS NULL
     LIMIT 1`,
    [pacienteId, consultaId],
  );

  return rows.length > 0;
}

export async function definirResponsavelNoAgendamento(
  connection: ConexaoMySQL,
  params: DefinirResponsavelParams,
): Promise<DefinirResponsavelResultado> {
  const paciente = await pacientePossuiResponsavelAtivo(
    connection,
    params.pacienteId,
    params.clinicaId,
  );
  if ("erro" in paciente) {
    return {
      aplicado: false,
      jaPossuiaResponsavel: false,
      erro: paciente.erro,
    };
  }

  if (paciente.psicologoResponsavelId) {
    return { aplicado: false, jaPossuiaResponsavel: true };
  }

  const psicologoValido = await psicologoPertenceAClinica(
    connection,
    params.psicologoId,
    params.clinicaId,
  );
  if (!psicologoValido) {
    return {
      aplicado: false,
      jaPossuiaResponsavel: false,
      erro: "Psicólogo não pertence à clínica",
    };
  }

  const [resultado] = await connection.execute<ResultSetHeader>(
    `UPDATE pacientes
     SET psicologo_responsavel_id = ?,
         psicologo_responsavel_atribuido_em = NOW(),
         psicologo_responsavel_atribuido_por_id = ?
     WHERE id = ?
       AND clinica_id = ?
       AND deleted_at IS NULL
       AND psicologo_responsavel_id IS NULL`,
    [params.psicologoId, params.usuarioId, params.pacienteId, params.clinicaId],
  );

  if (resultado.affectedRows === 0) {
    const atualizado = await pacientePossuiResponsavelAtivo(
      connection,
      params.pacienteId,
      params.clinicaId,
    );
    if ("erro" in atualizado) {
      return {
        aplicado: false,
        jaPossuiaResponsavel: false,
        erro: atualizado.erro,
      };
    }

    return {
      aplicado: false,
      jaPossuiaResponsavel: Boolean(atualizado.psicologoResponsavelId),
    };
  }

  if (
    !(await historicoJaExiste(connection, params.pacienteId, params.consultaId))
  ) {
    await connection.execute(
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
       ) VALUES (?, ?, ?, ?, ?, ?, 'primeira_atribuicao', ?, ?)`,
      [
        params.clinicaId,
        params.pacienteId,
        null,
        params.psicologoId,
        params.consultaId,
        params.usuarioId,
        params.motivo || "Definição no agendamento",
        "Vínculo criado a partir do agendamento com confirmação explícita.",
      ],
    );
  }

  return { aplicado: true, jaPossuiaResponsavel: false };
}

