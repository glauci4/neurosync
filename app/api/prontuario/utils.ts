import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import {
  validarAcessoPacienteResponsavel as validarAcessoPacienteResponsavelCentral,
  validarAcessoProntuario as validarAcessoProntuarioCentral,
  validarPacienteResponsavel as validarPacienteResponsavelCentral,
} from "@/lib/auth/permissoesProntuario";
import type { SessaoClinicaAutenticada } from "@/lib/auth/validarAcesso";
import type { getConnection } from "@/lib/mysql";

export type ConexaoMySQL = Awaited<ReturnType<typeof getConnection>>;
export type StatusProntuario = "rascunho" | "finalizado" | "assinado";
export type TipoAtendimentoProntuario =
  | "triagem"
  | "psicoterapia"
  | "devolutiva"
  | "avaliacao"
  | "orientacao"
  | "retorno"
  | "alta"
  | "outro";

export const TIPOS_ATENDIMENTO_PRONTUARIO: TipoAtendimentoProntuario[] = [
  "triagem",
  "psicoterapia",
  "devolutiva",
  "avaliacao",
  "orientacao",
  "retorno",
  "alta",
  "outro",
];

export const MENSAGEM_CONSULTA_REALIZADA_OBRIGATORIA =
  "Só é possível criar um registro clínico a partir de uma consulta iniciada.";

const STATUS_CONSULTA_PRONTUARIO_LIBERADO = [
  "em_andamento",
  "iniciado",
  "iniciada",
  "concluido",
  "concluida",
  "realizado",
  "realizada",
];

const STATUS_CONSULTA_PRONTUARIO_HORARIO_ATUAL = [
  "agendado",
  "agendada",
  "remarcado",
  "remarcada",
  "pendente",
];

function placeholdersStatus(status: string[]) {
  return status.map(() => "?").join(", ");
}

function condicaoConsultaProntuarioLiberada() {
  return `(
    LOWER(TRIM(status)) IN (${placeholdersStatus(STATUS_CONSULTA_PRONTUARIO_LIBERADO)})
    OR (
      LOWER(TRIM(status)) IN (${placeholdersStatus(STATUS_CONSULTA_PRONTUARIO_HORARIO_ATUAL)})
      AND NOW() BETWEEN TIMESTAMP(data_consulta, horario_inicio)
                    AND TIMESTAMP(data_consulta, horario_fim)
    )
  )`;
}

function parametrosStatusConsultaProntuario() {
  return [
    ...STATUS_CONSULTA_PRONTUARIO_LIBERADO,
    ...STATUS_CONSULTA_PRONTUARIO_HORARIO_ATUAL,
  ];
}

export interface SessaoProntuario {
  id: number;
  email: string;
  clinica_id: number;
  nome: string;
  perfil_id: number;
  crp: string | null;
  assinatura_profissional_url: string | null;
  ativo: boolean;
}

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

export interface ProntuarioPayload {
  paciente_id?: number;
  consulta_id?: number | null;
  data_registro?: string;
  tipo_atendimento?: TipoAtendimentoProntuario;
  conteudo?: string;
  finalizar?: boolean;
}

export interface RegistroClinico extends RowDataPacket {
  id: number;
  clinica_id: number;
  paciente_id: number;
  psicologo_id: number;
  consulta_id: number | null;
  data_registro: string;
  tipo_atendimento: TipoAtendimentoProntuario;
  conteudo: string;
  status: StatusProntuario;
  assinatura_url: string | null;
  assinado_em: string | null;
  finalizado_em: string | null;
  editado_por_id: number | null;
  editado_por_nome: string | null;
  editado_em: string | null;
  assinatura_editor_url: string | null;
  crp_editor: string | null;
}

export type PermissaoProntuario = "visualizar" | "editar" | "dono";

export async function obterSessaoProntuario(
  connection: ConexaoMySQL,
): Promise<SessaoProntuario | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("usuario_neurosync");
  if (!sessionCookie) return null;

  try {
    const cookie = JSON.parse(sessionCookie.value) as {
      id: number;
      email: string;
      clinica_id: number;
    };

    const [colunasAtivo] = await connection.execute<RowDataPacket[]>(
      "SHOW COLUMNS FROM usuarios LIKE 'ativo'",
    );
    const possuiColunaAtivo = colunasAtivo.length > 0;

    const [usuarios] = await connection.execute<RowDataPacket[]>(
      `SELECT id, nome, email, clinica_id, perfil_id, crp,
              assinatura_profissional_url,
              ${possuiColunaAtivo ? "ativo" : "1"} AS ativo
       FROM usuarios
       WHERE id = ? AND clinica_id = ?`,
      [cookie.id, cookie.clinica_id],
    );

    if (usuarios.length === 0) return null;
    const usuario = usuarios[0];
    if (Number(usuario.ativo) === 0) return null;

    return {
      id: Number(usuario.id),
      email: String(usuario.email || cookie.email),
      clinica_id: Number(usuario.clinica_id),
      nome: String(usuario.nome || ""),
      perfil_id: Number(usuario.perfil_id),
      crp: usuario.crp ? String(usuario.crp) : null,
      assinatura_profissional_url: usuario.assinatura_profissional_url
        ? String(usuario.assinatura_profissional_url)
        : null,
      ativo: Number(usuario.ativo) === 1,
    };
  } catch {
    return null;
  }
}

export function validarPsicologo(sessao: SessaoProntuario | null) {
  // Permissão clínica crítica: secretárias não acessam nem manipulam
  // prontuários, mesmo forçando requisições contra a API.
  if (!sessao) return "Não autenticado";
  if (!sessao.ativo) return "Usuário inativo";
  if (sessao.perfil_id !== 2) return "Acesso restrito a psicólogos";
  return null;
}

export function limparTextoRegistroClinico(conteudo: string) {
  return conteudo
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function validarConteudoRegistroClinico(conteudo: string) {
  const texto = limparTextoRegistroClinico(conteudo);
  if (!texto) return "Descreva o registro clínico antes de continuar.";

  const letras = texto.match(/\p{L}/gu) || [];
  const numeros = texto.match(/\d/g) || [];
  const palavras = texto.toLowerCase().match(/\p{L}{3,}/gu) || [];
  const palavrasUnicas = new Set(palavras);

  if (texto.length < 30 || letras.length < 20) {
    return "O registro clínico deve conter uma descrição válida.";
  }

  if (/^[\d\W_]+$/u.test(texto) || numeros.length > letras.length * 0.35) {
    return "O registro clínico deve conter uma descrição válida.";
  }

  if (
    /(.)\1{4,}/iu.test(texto) ||
    /[bcdfghjklmnpqrstvwxyzç]{6,}/iu.test(texto) ||
    (palavras.length > 2 && palavrasUnicas.size / palavras.length < 0.35) ||
    (palavras.length <= 2 && texto.length < 60)
  ) {
    return "Evite preencher o registro com caracteres aleatórios.";
  }

  return null;
}

export function validarPayloadProntuario(body: ProntuarioPayload) {
  const paciente_id = Number(body.paciente_id || 0);
  const consulta_id = body.consulta_id ? Number(body.consulta_id) : null;
  const data_registro = String(body.data_registro || "").trim();
  const tipo_atendimento = String(
    body.tipo_atendimento || "",
  ).trim() as TipoAtendimentoProntuario;
  const conteudo = String(body.conteudo || "").trim();

  if (!paciente_id) return { erro: "Paciente é obrigatório" };
  if (!data_registro || !/^\d{4}-\d{2}-\d{2}$/.test(data_registro)) {
    return { erro: "Data é obrigatória" };
  }
  if (!TIPOS_ATENDIMENTO_PRONTUARIO.includes(tipo_atendimento)) {
    return { erro: "Tipo de atendimento inválido" };
  }
  const erroConteudo = validarConteudoRegistroClinico(conteudo);
  if (erroConteudo) return { erro: erroConteudo };

  return {
    dados: {
      paciente_id,
      consulta_id,
      data_registro,
      tipo_atendimento,
      conteudo,
    },
  };
}

export async function validarPacienteDaClinica(
  connection: ConexaoMySQL,
  pacienteId: number,
  clinicaId: number,
) {
  const [pacientes] = await connection.execute<RowDataPacket[]>(
    `SELECT id FROM pacientes
     WHERE id = ? AND clinica_id = ? AND ativo = 1 AND deleted_at IS NULL`,
    [pacienteId, clinicaId],
  );
  return pacientes.length > 0;
}

export async function validarElegibilidadePacienteProntuario(
  connection: ConexaoMySQL,
  pacienteId: number,
  consultaId: number | null,
  clinicaId: number,
) {
  const [pacientes] = await connection.execute<RowDataPacket[]>(
    `SELECT id, ativo, status_atendimento
     FROM pacientes
     WHERE id = ? AND clinica_id = ? AND deleted_at IS NULL`,
    [pacienteId, clinicaId],
  );

  if (pacientes.length === 0 || Number(pacientes[0].ativo) !== 1) {
    return "Paciente não encontrado ou inativo";
  }

  if (!consultaId) {
    return MENSAGEM_CONSULTA_REALIZADA_OBRIGATORIA;
  }

  const [consultas] = await connection.execute<RowDataPacket[]>(
    `SELECT id FROM consultas
     WHERE id = ? AND paciente_id = ? AND clinica_id = ?
       AND ${condicaoConsultaProntuarioLiberada()}
       AND deleted_at IS NULL`,
    [
      consultaId,
      pacienteId,
      clinicaId,
      ...parametrosStatusConsultaProntuario(),
    ],
  );

  return consultas.length > 0 ? null : MENSAGEM_CONSULTA_REALIZADA_OBRIGATORIA;
}

export async function validarConsultaDaClinica(
  connection: ConexaoMySQL,
  consultaId: number | null,
  pacienteId: number,
  clinicaId: number,
  psicologoId?: number | null,
) {
  if (!consultaId) return false;

  const filtroPsicologo = psicologoId ? " AND psicologo_id = ?" : "";
  const parametros = psicologoId
    ? [
        consultaId,
        pacienteId,
        psicologoId,
        clinicaId,
        ...parametrosStatusConsultaProntuario(),
      ]
    : [
        consultaId,
        pacienteId,
        clinicaId,
        ...parametrosStatusConsultaProntuario(),
      ];

  const [consultas] = await connection.execute<RowDataPacket[]>(
    `SELECT id FROM consultas
     WHERE id = ? AND paciente_id = ?${filtroPsicologo}
       AND clinica_id = ?
       AND ${condicaoConsultaProntuarioLiberada()}
       AND deleted_at IS NULL`,
    parametros,
  );

  return consultas.length > 0;
}

export async function validarPacienteResponsavel(
  connection: ConexaoMySQL,
  pacienteId: number,
  sessao: SessaoProntuario,
) {
  return validarPacienteResponsavelCentral(
    connection,
    pacienteId,
    sessao as unknown as SessaoClinicaAutenticada,
  );
}

export async function validarAcessoClinicoPaciente(
  connection: ConexaoMySQL,
  pacienteId: number,
  sessao: SessaoProntuario,
) {
  return validarAcessoPacienteResponsavelCentral(
    connection,
    pacienteId,
    sessao as unknown as SessaoClinicaAutenticada,
  );
}

export async function obterEvolucaoPorId(
  connection: ConexaoMySQL,
  id: number,
  sessao: SessaoProntuario,
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

  return rows[0] as (RegistroClinico & RowDataPacket) | undefined;
}

export async function validarAcessoProntuario(
  connection: ConexaoMySQL,
  id: number,
  sessao: SessaoProntuario,
) {
  return validarAcessoProntuarioCentral(
    connection,
    id,
    sessao as unknown as SessaoClinicaAutenticada,
  );
}

export function podeEditarEvolucao(evolucao: RowDataPacket | undefined) {
  return Boolean(evolucao && evolucao.status === "rascunho");
}

export function ehDonoEvolucao(
  evolucao: RowDataPacket | undefined,
  sessao: SessaoProntuario,
) {
  return Boolean(
    evolucao &&
      Number(evolucao.psicologo_id) === sessao.id &&
      Number(evolucao.clinica_id) === sessao.clinica_id,
  );
}

export async function softDeleteEvolucao(
  connection: ConexaoMySQL,
  id: number,
  sessao: SessaoProntuario,
) {
  const [resultado] = await connection.execute<ResultSetHeader>(
    `UPDATE registros_clinicos
     SET deleted_at = NOW()
     WHERE id = ? AND clinica_id = ?
       AND status <> 'assinado' AND deleted_at IS NULL`,
    [id, sessao.clinica_id],
  );

  return resultado.affectedRows > 0;
}
