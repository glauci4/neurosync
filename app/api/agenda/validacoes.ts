import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import type { getConnection } from "@/lib/mysql";

export type ConexaoMySQL = Awaited<ReturnType<typeof getConnection>>;

export const STATUS_CONSULTA = [
  "agendado",
  "remarcado",
  "cancelado",
  "falta",
  "concluido",
] as const;

export const TIPOS_ATENDIMENTO = [
  "triagem",
  "psicoterapia",
  "devolutiva",
  "avaliacao",
  "orientacao",
  "retorno",
  "alta",
  "outro",
] as const;

export type StatusConsulta = (typeof STATUS_CONSULTA)[number];
export type TipoAtendimento = (typeof TIPOS_ATENDIMENTO)[number];

export interface AgendaPayload {
  paciente_id?: number;
  psicologo_id?: number;
  sala_id?: number;
  data_consulta?: string;
  horario_inicio?: string;
  horario_fim?: string;
  tipo_atendimento?: TipoAtendimento;
  tipo_outro?: string | null;
  status?: StatusConsulta;
  observacoes?: string | null;
  definir_responsavel?: boolean;
}

export interface ConsultaValidada {
  paciente_id: number;
  psicologo_id: number;
  sala_id: number;
  data_consulta: string;
  horario_inicio: string;
  horario_fim: string;
  tipo_atendimento: TipoAtendimento;
  tipo_outro: string | null;
  status: StatusConsulta;
  observacoes: string | null;
}

export interface DisponibilidadeAgenda {
  disponivel: boolean;
  motivo?: string;
  codigo?:
    | "sem_funcionamento"
    | "fora_funcionamento"
    | "intervalo"
    | "ferias"
    | "feriado"
    | "bloqueio"
    | "horario_invalido";
  expediente?: {
    inicio: string;
    fim: string;
    intervalo_inicio: string | null;
    intervalo_fim: string | null;
    origem: "pontual" | "especial";
  };
  bloqueiosParciais: Array<{
    id: number;
    tipo: "bloqueio";
    inicio: string;
    fim: string;
    descricao: string | null;
  }>;
}

export async function obterUsuarioDoCookie() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("usuario_neurosync");
  if (!sessionCookie) return null;

  try {
    return JSON.parse(sessionCookie.value) as {
      id: number;
      email: string;
      clinica_id: number;
    };
  } catch {
    return null;
  }
}

function normalizarHora(hora?: string) {
  const valor = String(hora || "").trim();
  if (/^\d{2}:\d{2}$/.test(valor)) return `${valor}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(valor)) return valor;
  return "";
}

function dataValida(data?: string) {
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const [ano, mes, dia] = data.split("-").map(Number);
  const parsed = new Date(ano, mes - 1, dia);
  return (
    parsed.getFullYear() === ano &&
    parsed.getMonth() === mes - 1 &&
    parsed.getDate() === dia
  );
}

function hojeISO() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function horaCurta(valor?: string | null) {
  return String(valor || "").slice(0, 5) || null;
}

function intervaloSobrepoe(
  inicioA: string,
  fimA: string,
  inicioB: string,
  fimB: string,
) {
  return inicioA < fimB && inicioB < fimA;
}

async function pacientePossuiConsultaConflitante(
  connection: ConexaoMySQL,
  clinicaId: number,
  consulta: ConsultaValidada,
  ignorarConsultaId?: number,
) {
  const filtroIgnorar = ignorarConsultaId ? "AND id <> ?" : "";
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT id
       FROM consultas
      WHERE clinica_id = ?
        AND paciente_id = ?
        AND data_consulta = ?
        AND deleted_at IS NULL
        AND status IN ('agendado', 'remarcado')
        AND NOT (? > horario_fim OR ? < horario_inicio)
        ${filtroIgnorar}
      LIMIT 1`,
    ignorarConsultaId
      ? [
          clinicaId,
          consulta.paciente_id,
          consulta.data_consulta,
          consulta.horario_inicio,
          consulta.horario_fim,
          ignorarConsultaId,
        ]
      : [
          clinicaId,
          consulta.paciente_id,
          consulta.data_consulta,
          consulta.horario_inicio,
          consulta.horario_fim,
        ],
  );

  return rows.length > 0;
}

const TABELAS_PERMITIDAS_PARA_SCHEMA = new Set([
  "usuarios",
  "salas",
  "consultas",
]);

async function tabelaTemColuna(
  connection: ConexaoMySQL,
  tabela: string,
  coluna: string,
) {
  if (!TABELAS_PERMITIDAS_PARA_SCHEMA.has(tabela)) return false;

  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tabela, coluna],
  );

  return Number(rows[0]?.total || 0) > 0;
}

export function validarPayloadAgenda(
  body: AgendaPayload,
  base?: Partial<ConsultaValidada>,
) {
  const paciente_id = Number(body.paciente_id ?? base?.paciente_id);
  const psicologo_id = Number(body.psicologo_id ?? base?.psicologo_id);
  const sala_id = Number(body.sala_id ?? base?.sala_id);
  const data_consulta = String(
    body.data_consulta ?? base?.data_consulta ?? "",
  ).trim();
  const horario_inicio = normalizarHora(
    body.horario_inicio ?? base?.horario_inicio,
  );
  const horario_fim = normalizarHora(body.horario_fim ?? base?.horario_fim);
  const tipo_atendimento = String(
    body.tipo_atendimento ?? base?.tipo_atendimento ?? "",
  ) as TipoAtendimento;
  const status = String(body.status ?? base?.status ?? "agendado") as
    | StatusConsulta
    | "";
  const tipo_outro = String(body.tipo_outro ?? base?.tipo_outro ?? "").trim();

  if (!paciente_id) return { erro: "Informe o paciente" };
  if (!psicologo_id) return { erro: "Informe o psicólogo" };
  if (!sala_id) return { erro: "Informe a sala" };
  if (!dataValida(data_consulta)) return { erro: "Data da consulta inválida" };
  if (data_consulta < hojeISO()) {
    return { erro: "Não é possível agendar em uma data anterior" };
  }
  if (!horario_inicio || !horario_fim) {
    return { erro: "Informe horário de início e fim" };
  }
  if (horario_inicio >= horario_fim) {
    return { erro: "Horário de início deve ser menor que o fim" };
  }
  if (!TIPOS_ATENDIMENTO.includes(tipo_atendimento)) {
    return { erro: "Tipo de atendimento inválido" };
  }
  if (tipo_atendimento === "outro" && !tipo_outro) {
    return { erro: "Informe o tipo de atendimento quando selecionar outro" };
  }
  if (!STATUS_CONSULTA.includes(status as StatusConsulta)) {
    return { erro: "Status da consulta inválido" };
  }

  return {
    consulta: {
      paciente_id,
      psicologo_id,
      sala_id,
      data_consulta,
      horario_inicio,
      horario_fim,
      tipo_atendimento,
      tipo_outro: tipo_atendimento === "outro" ? tipo_outro : null,
      status: status as StatusConsulta,
      observacoes: body.observacoes ?? base?.observacoes ?? null,
    } satisfies ConsultaValidada,
  };
}

export async function validarRegrasAgenda(
  connection: ConexaoMySQL,
  clinicaId: number,
  consulta: ConsultaValidada,
  ignorarConsultaId?: number,
) {
  const [pacientes] = await connection.execute<RowDataPacket[]>(
    `SELECT id, status_atendimento
     FROM pacientes
     WHERE id = ? AND clinica_id = ? AND ativo = 1 AND deleted_at IS NULL`,
    [consulta.paciente_id, clinicaId],
  );
  if (pacientes.length === 0) {
    return "Paciente não existe, está inativo ou foi excluído";
  }
  if (String(pacientes[0].status_atendimento || "") !== "em_atendimento") {
    return "Paciente não está em atendimento para agendamento comum";
  }

  const usuariosTemAtivo = await tabelaTemColuna(
    connection,
    "usuarios",
    "ativo",
  );
  const filtroUsuarioAtivo = usuariosTemAtivo ? "AND ativo = 1" : "";
  const [psicologos] = await connection.execute<RowDataPacket[]>(
    `SELECT id FROM usuarios
     WHERE id = ? AND clinica_id = ? AND perfil_id = 2 ${filtroUsuarioAtivo}`,
    [consulta.psicologo_id, clinicaId],
  );
  if (psicologos.length === 0) {
    return "Psicólogo não existe, está inativo ou não pertence à clínica";
  }

  const [salas] = await connection.execute<RowDataPacket[]>(
    `SELECT id FROM salas
     WHERE id = ? AND clinica_id = ? AND ativo = 1 AND deleted_at IS NULL`,
    [consulta.sala_id, clinicaId],
  );
  if (salas.length === 0) {
    return "Sala não existe, está inativa ou foi excluída";
  }

  // Histórico diário: quando a agenda do dia foi fechada, ela fica somente
  // para consulta histórica e não aceita novas ações operacionais.
  const [diaFechado] = await connection.execute<RowDataPacket[]>(
    `SELECT id FROM consultas
     WHERE clinica_id = ? AND data_consulta = ? AND fechado_dia = 1
       AND deleted_at IS NULL
       ${ignorarConsultaId ? "AND id <> ?" : ""}
     LIMIT 1`,
    ignorarConsultaId
      ? [clinicaId, consulta.data_consulta, ignorarConsultaId]
      : [clinicaId, consulta.data_consulta],
  );
  if (diaFechado.length > 0) {
    return "Esta agenda já foi fechada e está disponível apenas para histórico.";
  }

  const disponibilidade = await obterDisponibilidadeAgenda(
    connection,
    clinicaId,
    consulta.data_consulta,
    consulta.horario_inicio,
    consulta.horario_fim,
  );
  if (!disponibilidade.disponivel) {
    return disponibilidade.motivo || "Horário fora do funcionamento da clínica";
  }

  if (
    await pacientePossuiConsultaConflitante(
      connection,
      clinicaId,
      consulta,
      ignorarConsultaId,
    )
  ) {
    return "Já existe uma consulta agendada para este paciente neste horário.";
  }

  const paramsComuns = [
    clinicaId,
    consulta.data_consulta,
    consulta.horario_inicio,
    consulta.horario_fim,
  ];
  const filtroIgnorar = ignorarConsultaId ? "AND id <> ?" : "";

  const [conflitoSala] = await connection.execute<RowDataPacket[]>(
    `SELECT id FROM consultas
     WHERE clinica_id = ? AND data_consulta = ? AND deleted_at IS NULL
       AND status NOT IN ('cancelado', 'falta')
       AND (? < horario_fim AND ? > horario_inicio)
       AND sala_id = ? ${filtroIgnorar}
     LIMIT 1`,
    ignorarConsultaId
      ? [...paramsComuns, consulta.sala_id, ignorarConsultaId]
      : [...paramsComuns, consulta.sala_id],
  );
  if (conflitoSala.length > 0) {
    return "Já existe uma consulta para esta sala neste horário.";
  }

  const [conflitoPsicologo] = await connection.execute<RowDataPacket[]>(
    `SELECT id FROM consultas
     WHERE clinica_id = ? AND data_consulta = ? AND deleted_at IS NULL
       AND status NOT IN ('cancelado', 'falta')
       AND (? < horario_fim AND ? > horario_inicio)
       AND psicologo_id = ? ${filtroIgnorar}
     LIMIT 1`,
    ignorarConsultaId
      ? [...paramsComuns, consulta.psicologo_id, ignorarConsultaId]
      : [...paramsComuns, consulta.psicologo_id],
  );
  if (conflitoPsicologo.length > 0) {
    return "O psicólogo já possui consulta neste horário.";
  }

  return null;
}

export async function obterDisponibilidadeAgenda(
  connection: ConexaoMySQL,
  clinicaId: number,
  dataConsulta: string,
  horarioInicio?: string,
  horarioFim?: string,
): Promise<DisponibilidadeAgenda> {
  const inicioConsulta = normalizarHora(horarioInicio).slice(0, 5);
  const fimConsulta = normalizarHora(horarioFim).slice(0, 5);

  if (!dataValida(dataConsulta)) {
    return {
      disponivel: false,
      motivo: "Data da consulta inválida",
      codigo: "horario_invalido",
      bloqueiosParciais: [],
    };
  }

  const [excecoes] = await connection.execute<RowDataPacket[]>(
    `SELECT id, tipo, data_especifica, data_fim, hora_inicio, hora_fim,
            intervalo_inicio, intervalo_fim, descricao, ativo
     FROM horarios_funcionamento
     WHERE clinica_id = ? AND tipo <> 'funcionamento' AND ativo = 1
       AND DATE(data_especifica) <= ?
       AND DATE(COALESCE(data_fim, data_especifica)) >= ?
     ORDER BY FIELD(tipo, 'ferias', 'bloqueio', 'excecao', 'feriado'), id ASC`,
    [clinicaId, dataConsulta, dataConsulta],
  );

  const ferias = excecoes.find((e) => e.tipo === "ferias");
  if (ferias) {
    return {
      disponivel: false,
      motivo: "A clínica está em férias nesta data.",
      codigo: "ferias",
      bloqueiosParciais: [],
    };
  }

  const bloqueioTotal = excecoes.find(
    (e) => e.tipo === "bloqueio" && !e.hora_inicio && !e.hora_fim,
  );
  if (bloqueioTotal) {
    return {
      disponivel: false,
      motivo: "Esta data está bloqueada no funcionamento da clínica.",
      codigo: "bloqueio",
      bloqueiosParciais: [],
    };
  }

  const bloqueiosParciais = excecoes
    .filter((e) => e.tipo === "bloqueio" && e.hora_inicio && e.hora_fim)
    .map((e) => ({
      id: Number(e.id),
      tipo: "bloqueio" as const,
      inicio: horaCurta(e.hora_inicio) || "",
      fim: horaCurta(e.hora_fim) || "",
      descricao: e.descricao ? String(e.descricao) : null,
    }));

  const horarioEspecial = excecoes.find(
    (e) => e.tipo === "excecao" && e.hora_inicio && e.hora_fim,
  );

  const [funcionamentoPontualRows] = await connection.execute<RowDataPacket[]>(
    `SELECT id, hora_inicio, hora_fim, intervalo_inicio, intervalo_fim, ativo
     FROM horarios_funcionamento
     WHERE clinica_id = ? AND tipo = 'funcionamento' AND ativo = 1
       AND data_especifica = ?
     ORDER BY id DESC
     LIMIT 1`,
    [clinicaId, dataConsulta],
  );

  const funcionamentoPontual = funcionamentoPontualRows[0];
  const expedienteBase = horarioEspecial || funcionamentoPontual;
  const origem = horarioEspecial ? "especial" : "pontual";
  const inicioExpediente = horaCurta(expedienteBase?.hora_inicio);
  const fimExpediente = horaCurta(expedienteBase?.hora_fim);
  const intervaloInicio = horaCurta(expedienteBase?.intervalo_inicio);
  const intervaloFim = horaCurta(expedienteBase?.intervalo_fim);

  if (
    !expedienteBase ||
    (!horarioEspecial && Number(expedienteBase.ativo) !== 1) ||
    !inicioExpediente ||
    !fimExpediente
  ) {
    return {
      disponivel: false,
      motivo: "Não há funcionamento configurado para esta data.",
      codigo: "sem_funcionamento",
      bloqueiosParciais,
    };
  }

  const expediente = {
    inicio: inicioExpediente,
    fim: fimExpediente,
    intervalo_inicio: intervaloInicio,
    intervalo_fim: intervaloFim,
    origem: origem as "pontual" | "especial",
  };

  if (!inicioConsulta || !fimConsulta) {
    return {
      disponivel: true,
      expediente,
      bloqueiosParciais,
    };
  }

  if (inicioConsulta >= fimConsulta) {
    return {
      disponivel: false,
      motivo: "Horário final deve ser maior que o horário inicial",
      codigo: "horario_invalido",
      expediente,
      bloqueiosParciais,
    };
  }

  if (inicioConsulta < inicioExpediente || fimConsulta > fimExpediente) {
    return {
      disponivel: false,
      motivo: "Horário fora do funcionamento da clínica.",
      codigo: "fora_funcionamento",
      expediente,
      bloqueiosParciais,
    };
  }

  if (
    intervaloInicio &&
    intervaloFim &&
    intervaloSobrepoe(
      inicioConsulta,
      fimConsulta,
      intervaloInicio,
      intervaloFim,
    )
  ) {
    return {
      disponivel: false,
      motivo: "Consulta não pode ser agendada durante o intervalo.",
      codigo: "intervalo",
      expediente,
      bloqueiosParciais,
    };
  }

  const bloqueioConflitante = bloqueiosParciais.find((bloqueio) =>
    intervaloSobrepoe(
      inicioConsulta,
      fimConsulta,
      bloqueio.inicio,
      bloqueio.fim,
    ),
  );
  if (bloqueioConflitante) {
    return {
      disponivel: false,
      motivo: "Este horário está bloqueado no funcionamento da clínica.",
      codigo: "bloqueio",
      expediente,
      bloqueiosParciais,
    };
  }

  return {
    disponivel: true,
    expediente,
    bloqueiosParciais,
  };
}

export async function agendaDiaEstaFechada(
  connection: ConexaoMySQL,
  clinicaId: number,
  dataConsulta: string,
) {
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT id FROM consultas
     WHERE clinica_id = ? AND data_consulta = ? AND fechado_dia = 1
       AND deleted_at IS NULL
     LIMIT 1`,
    [clinicaId, dataConsulta],
  );
  return rows.length > 0;
}

export async function softDeleteConsulta(
  connection: ConexaoMySQL,
  id: number,
  clinicaId: number,
) {
  const [resultado] = await connection.execute<ResultSetHeader>(
    `UPDATE consultas SET deleted_at = NOW()
     WHERE id = ? AND clinica_id = ? AND deleted_at IS NULL`,
    [id, clinicaId],
  );
  return resultado.affectedRows > 0;
}
