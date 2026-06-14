import type { RowDataPacket } from "mysql2";
import type { getConnection } from "@/lib/mysql";

type ConexaoMySQL = Awaited<ReturnType<typeof getConnection>>;

export interface PsicologoTransferenciaOpcao {
  id: number;
  nome: string;
}

export interface ResumoInativacaoUsuario {
  pacientes_ativos_vinculados: number;
  pacientes_espera_vinculados: number;
  agendamentos_futuros: number;
  prontuarios_vinculados: number;
  total_pacientes_vinculados: number;
}

export interface ListaVinculosPacienteTransferencia {
  paciente_id: number;
  consulta_id_origem: number | null;
}

function dataHoraAtualLocal() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  const horas = String(agora.getHours()).padStart(2, "0");
  const minutos = String(agora.getMinutes()).padStart(2, "0");
  const segundos = String(agora.getSeconds()).padStart(2, "0");
  return {
    data: `${ano}-${mes}-${dia}`,
    hora: `${horas}:${minutos}:${segundos}`,
  };
}

export async function listarPsicologosAtivosTransferencia(
  connection: ConexaoMySQL,
  clinicaId: number,
  excluirUsuarioId: number,
) {
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT id, nome
     FROM usuarios
     WHERE clinica_id = ?
       AND perfil_id = 2
       AND COALESCE(ativo, 1) = 1
       AND id <> ?
     ORDER BY nome ASC`,
    [clinicaId, excluirUsuarioId],
  );

  return rows.map((row) => ({
    id: Number(row.id),
    nome: String(row.nome || ""),
  })) as PsicologoTransferenciaOpcao[];
}

export async function obterResumoInativacaoUsuario(
  connection: ConexaoMySQL,
  usuarioId: number,
  clinicaId: number,
) {
  const agora = dataHoraAtualLocal();

  const [pacientes] = await connection.execute<RowDataPacket[]>(
    `SELECT
        SUM(CASE WHEN COALESCE(p.ativo, 1) = 1 AND p.status_atendimento = 'em_atendimento' THEN 1 ELSE 0 END) AS pacientes_ativos_vinculados,
        SUM(CASE WHEN COALESCE(p.ativo, 1) = 1 AND p.status_atendimento = 'fila_espera' THEN 1 ELSE 0 END) AS pacientes_espera_vinculados,
        COUNT(*) AS total_pacientes_vinculados
     FROM pacientes p
     WHERE p.clinica_id = ?
       AND p.deleted_at IS NULL
       AND p.psicologo_responsavel_id = ?`,
    [clinicaId, usuarioId],
  );

  const [consultas] = await connection.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS agendamentos_futuros
     FROM consultas
     WHERE clinica_id = ?
       AND psicologo_id = ?
       AND deleted_at IS NULL
       AND status IN ('agendado', 'remarcado')
       AND (
         data_consulta > ?
         OR (data_consulta = ? AND horario_fim >= ?)
       )`,
    [clinicaId, usuarioId, agora.data, agora.data, agora.hora],
  );

  const [prontuarios] = await connection.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS prontuarios_vinculados
     FROM registros_clinicos
     WHERE clinica_id = ?
       AND psicologo_id = ?
       AND deleted_at IS NULL`,
    [clinicaId, usuarioId],
  );

  return {
    pacientes_ativos_vinculados: Number(
      pacientes[0]?.pacientes_ativos_vinculados || 0,
    ),
    pacientes_espera_vinculados: Number(
      pacientes[0]?.pacientes_espera_vinculados || 0,
    ),
    agendamentos_futuros: Number(consultas[0]?.agendamentos_futuros || 0),
    prontuarios_vinculados: Number(prontuarios[0]?.prontuarios_vinculados || 0),
    total_pacientes_vinculados: Number(
      pacientes[0]?.total_pacientes_vinculados || 0,
    ),
  } satisfies ResumoInativacaoUsuario;
}

export async function listarPacientesVinculadosParaTransferencia(
  connection: ConexaoMySQL,
  clinicaId: number,
  psicologoId: number,
) {
  const [pacientes] = await connection.execute<RowDataPacket[]>(
    `SELECT
        p.id AS paciente_id,
        (
          SELECT co.id
          FROM consultas co
          WHERE co.paciente_id = p.id
            AND co.clinica_id = ?
            AND co.deleted_at IS NULL
          ORDER BY co.data_consulta DESC, co.horario_inicio DESC, co.id DESC
          LIMIT 1
        ) AS consulta_id_origem
     FROM pacientes p
     WHERE p.clinica_id = ?
       AND p.deleted_at IS NULL
       AND p.psicologo_responsavel_id = ?
     ORDER BY p.id ASC
     FOR UPDATE`,
    [clinicaId, clinicaId, psicologoId],
  );

  return pacientes.map((row) => ({
    paciente_id: Number(row.paciente_id),
    consulta_id_origem: row.consulta_id_origem
      ? Number(row.consulta_id_origem)
      : null,
  })) as ListaVinculosPacienteTransferencia[];
}
