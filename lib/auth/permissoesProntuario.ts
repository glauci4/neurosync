import type { RowDataPacket } from "mysql2";
import type { ConexaoMySQL, SessaoClinicaAutenticada } from "./validarAcesso";
import { validarPsicologoPerfil } from "./validarAcesso";

export interface PacienteResponsavelProntuario extends RowDataPacket {
  id: number;
  clinica_id: number;
  psicologo_responsavel_id: number | null;
  psicologo_responsavel_nome: string | null;
  psicologo_responsavel_crp: string | null;
  psicologo_responsavel_atribuido_em: string | null;
  psicologo_responsavel_atribuido_por_id: number | null;
  psicologo_responsavel_atribuido_por_nome: string | null;
}

export function validarPerfilProntuario(
  sessao: SessaoClinicaAutenticada | null,
) {
  if (!sessao) return "Não autenticado";
  if (!sessao.ativo) return "Usuário inativo";
  if (!validarPsicologoPerfil(sessao.perfil_id)) {
    return "Acesso restrito a psicólogos";
  }
  return null;
}

type SessaoClinicaBasica = Pick<
  SessaoClinicaAutenticada,
  "id" | "clinica_id" | "perfil_id"
>;

export async function validarPacienteResponsavel(
  connection: ConexaoMySQL,
  pacienteId: number,
  sessao: SessaoClinicaAutenticada,
) {
  const [pacientes] = await connection.execute<RowDataPacket[]>(
    `SELECT p.id, p.clinica_id,
            p.psicologo_responsavel_id,
            pr.nome AS psicologo_responsavel_nome,
            pr.crp AS psicologo_responsavel_crp,
            DATE_FORMAT(p.psicologo_responsavel_atribuido_em, '%d/%m/%Y %H:%i') AS psicologo_responsavel_atribuido_em_formatada,
            atribuido_por.nome AS psicologo_responsavel_atribuido_por_nome
       FROM pacientes p
       LEFT JOIN usuarios pr ON pr.id = p.psicologo_responsavel_id
       LEFT JOIN usuarios atribuido_por ON atribuido_por.id = p.psicologo_responsavel_atribuido_por_id
      WHERE p.id = ? AND p.clinica_id = ? AND p.deleted_at IS NULL`,
    [pacienteId, sessao.clinica_id],
  );

  if (pacientes.length === 0) {
    return { erro: "Paciente não encontrado", status: 404 as const };
  }

  const paciente = pacientes[0] as PacienteResponsavelProntuario;
  if (
    !paciente.psicologo_responsavel_id ||
    Number(paciente.psicologo_responsavel_id) !== sessao.id
  ) {
    return {
      erro: "Você não possui permissão para acessar este prontuário.",
      status: 403 as const,
    };
  }

  return { paciente };
}

export async function validarAcessoProntuario(
  connection: ConexaoMySQL,
  id: number,
  sessao: SessaoClinicaAutenticada,
) {
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT pe.*, p.nome AS paciente_nome, u.nome AS psicologo_nome, u.crp,
            p.psicologo_responsavel_id,
            (
              SELECT phe.psicologo_id
              FROM registro_clinico_historico_edicoes phe
              WHERE phe.registro_clinico_id = pe.id
              ORDER BY phe.editado_em DESC, phe.id DESC
              LIMIT 1
            ) AS editado_por_id,
            (
              SELECT phe.nome_psicologo
              FROM registro_clinico_historico_edicoes phe
              WHERE phe.registro_clinico_id = pe.id
              ORDER BY phe.editado_em DESC, phe.id DESC
              LIMIT 1
            ) AS editado_por_nome,
            (
              SELECT phe.editado_em
              FROM registro_clinico_historico_edicoes phe
              WHERE phe.registro_clinico_id = pe.id
              ORDER BY phe.editado_em DESC, phe.id DESC
              LIMIT 1
            ) AS editado_em,
            (
              SELECT phe.assinatura_url
              FROM registro_clinico_historico_edicoes phe
              WHERE phe.registro_clinico_id = pe.id
              ORDER BY phe.editado_em DESC, phe.id DESC
              LIMIT 1
            ) AS assinatura_editor_url,
            (
              SELECT phe.crp_psicologo
              FROM registro_clinico_historico_edicoes phe
              WHERE phe.registro_clinico_id = pe.id
              ORDER BY phe.editado_em DESC, phe.id DESC
              LIMIT 1
            ) AS crp_editor
     FROM registros_clinicos pe
     INNER JOIN pacientes p ON p.id = pe.paciente_id
     INNER JOIN usuarios u ON u.id = pe.psicologo_id
     WHERE pe.id = ? AND pe.clinica_id = ? AND pe.deleted_at IS NULL
       AND p.clinica_id = pe.clinica_id
       AND p.deleted_at IS NULL
       AND p.psicologo_responsavel_id = ?`,
    [id, sessao.clinica_id, sessao.id],
  );

  const evolucao = rows[0] as
    | (RowDataPacket & {
        psicologo_responsavel_id?: number | null;
      })
    | undefined;

  if (!evolucao) {
    return {
      erro: "Você não possui permissão para acessar este prontuário.",
      status: 403 as const,
    };
  }

  return { evolucao };
}

export async function validarAcessoRelatorioClinico(
  connection: ConexaoMySQL,
  sessao: SessaoClinicaBasica,
) {
  if (!validarPsicologoPerfil(sessao.perfil_id)) {
    return {
      ok: false as const,
      status: 403,
      error: "Acesso restrito a psicólogos",
    };
  }

  const [responsavel] = await connection.execute<RowDataPacket[]>(
    `SELECT 1
     FROM clinicas c
     WHERE c.id = ? AND c.responsavel_clinica_id = ? LIMIT 1`,
    [sessao.clinica_id, sessao.id],
  );

  if (responsavel.length > 0) {
    return {
      ok: true as const,
      usuario: sessao,
    };
  }

  return {
    ok: true as const,
    usuario: sessao,
  };
}

export async function validarAcessoPacienteResponsavel(
  connection: ConexaoMySQL,
  pacienteId: number,
  sessao: SessaoClinicaAutenticada,
) {
  return validarPacienteResponsavel(connection, pacienteId, sessao);
}
