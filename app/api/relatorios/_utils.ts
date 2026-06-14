import type { RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import type { getConnection } from "@/lib/mysql";

export type ConexaoMySQL = Awaited<ReturnType<typeof getConnection>>;

export interface SessaoRelatorios {
  id: number;
  nome: string;
  email: string;
  clinica_id: number;
  perfil_id: number;
  ativo: boolean;
}

export interface FiltrosRelatorios {
  dataInicio: string | null;
  dataFim: string | null;
  psicologoId: number | null;
  salaId: number | null;
  pacienteId: number | null;
  letraInicial: string | null;
  psicologoResponsavelId: number | null;
  status: string | null;
  tipoAtendimento: string | null;
}

export async function obterColunasTabela(
  connection: ConexaoMySQL,
  tabela: string,
) {
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tabela],
  );

  return new Set(rows.map((row) => String(row.COLUMN_NAME)));
}

export async function obterSessaoRelatorios(
  connection: ConexaoMySQL,
): Promise<SessaoRelatorios | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("usuario_neurosync");
  if (!sessionCookie) return null;

  try {
    const cookie = JSON.parse(sessionCookie.value) as {
      id: number;
      email?: string;
      clinica_id?: number;
    };

    const [usuarios] = await connection.execute<RowDataPacket[]>(
      `SELECT id, nome, email, clinica_id, perfil_id, COALESCE(ativo, 1) AS ativo
       FROM usuarios
       WHERE id = ?`,
      [cookie.id],
    );

    if (usuarios.length === 0) return null;
    const usuario = usuarios[0];

    if (!usuario.clinica_id || Number(usuario.ativo) !== 1) return null;

    return {
      id: Number(usuario.id),
      nome: String(usuario.nome || ""),
      email: String(usuario.email || cookie.email || ""),
      clinica_id: Number(usuario.clinica_id),
      perfil_id: Number(usuario.perfil_id),
      ativo: Number(usuario.ativo) === 1,
    };
  } catch {
    return null;
  }
}

function dataValida(valor: string | null) {
  if (!valor || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const parsed = new Date(`${valor}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : valor;
}

function numeroPositivo(valor: string | null) {
  const numero = Number(valor || 0);
  return Number.isFinite(numero) && numero > 0 ? numero : null;
}

function textoFiltro(valor: string | null) {
  const texto = String(valor || "").trim();
  return texto || null;
}

function letraInicial(valor: string | null) {
  const texto = String(valor || "")
    .trim()
    .toUpperCase();
  if (!texto || !/^[A-ZÁÂÃÀÉÊÍÓÔÕÚÜÇ]$/.test(texto)) return null;
  return texto;
}

export function obterFiltrosRelatorios(request: Request): FiltrosRelatorios {
  const { searchParams } = new URL(request.url);

  return {
    dataInicio: dataValida(searchParams.get("data_inicio")),
    dataFim: dataValida(searchParams.get("data_fim")),
    psicologoId: numeroPositivo(searchParams.get("psicologo_id")),
    salaId: numeroPositivo(searchParams.get("sala_id")),
    pacienteId: numeroPositivo(searchParams.get("paciente_id")),
    letraInicial: letraInicial(searchParams.get("letra_inicial")),
    psicologoResponsavelId: numeroPositivo(
      searchParams.get("psicologo_responsavel_id"),
    ),
    status: textoFiltro(searchParams.get("status")),
    tipoAtendimento: textoFiltro(searchParams.get("tipo_atendimento")),
  };
}

export function obterDataHojeRelatorios() {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const valores = Object.fromEntries(
    partes.map((parte) => [parte.type, parte.value]),
  );

  return `${valores.year}-${valores.month}-${valores.day}`;
}

export function obterDataMinimaFutura(dataInicio: string | null) {
  const hoje = obterDataHojeRelatorios();
  return dataInicio && dataInicio > hoje ? dataInicio : hoje;
}

export function aplicarFiltrosConsultas(
  filtros: FiltrosRelatorios,
  alias = "c",
  colunas?: Set<string>,
) {
  const where: string[] = [`${alias}.clinica_id = ?`];
  const params: Array<string | number> = [];

  if (!colunas || colunas.has("deleted_at")) {
    where.push(`${alias}.deleted_at IS NULL`);
  }

  const colunaDataConsulta = colunas?.has("data_consulta")
    ? "data_consulta"
    : colunas?.has("data")
      ? "data"
      : "data_consulta";

  if (filtros.dataInicio && (!colunas || colunas.has(colunaDataConsulta))) {
    where.push(`${alias}.${colunaDataConsulta} >= ?`);
    params.push(filtros.dataInicio);
  }

  if (filtros.dataFim && (!colunas || colunas.has(colunaDataConsulta))) {
    where.push(`${alias}.${colunaDataConsulta} <= ?`);
    params.push(filtros.dataFim);
  }

  if (filtros.psicologoId) {
    where.push(`${alias}.psicologo_id = ?`);
    params.push(filtros.psicologoId);
  }

  if (filtros.salaId && (!colunas || colunas.has("sala_id"))) {
    where.push(`${alias}.sala_id = ?`);
    params.push(filtros.salaId);
  }

  if (filtros.pacienteId) {
    where.push(`${alias}.paciente_id = ?`);
    params.push(filtros.pacienteId);
  }

  if (filtros.status) {
    where.push(`${alias}.status = ?`);
    params.push(filtros.status);
  }

  if (
    filtros.tipoAtendimento &&
    (!colunas || colunas.has("tipo_atendimento"))
  ) {
    where.push(`${alias}.tipo_atendimento = ?`);
    params.push(filtros.tipoAtendimento);
  }

  return { where, params };
}

export function aplicarFiltrosPacientesRelatorios(
  filtros: FiltrosRelatorios,
  alias = "p",
) {
  const where: string[] = [`${alias}.deleted_at IS NULL`];
  const params: Array<string | number> = [];

  if (filtros.dataInicio) {
    where.push(`${alias}.criado_em >= ?`);
    params.push(filtros.dataInicio);
  }

  if (filtros.dataFim) {
    where.push(`${alias}.criado_em <= ?`);
    params.push(filtros.dataFim);
  }

  if (filtros.pacienteId) {
    where.push(`${alias}.id = ?`);
    params.push(filtros.pacienteId);
  }

  if (filtros.letraInicial) {
    where.push(`${alias}.nome LIKE CONCAT(?, '%')`);
    params.push(filtros.letraInicial);
  }

  if (filtros.psicologoResponsavelId) {
    where.push(`${alias}.psicologo_responsavel_id = ?`);
    params.push(filtros.psicologoResponsavelId);
  }

  if (filtros.status) {
    where.push(`${alias}.status_atendimento = ?`);
    params.push(filtros.status);
  }

  return { where, params };
}

export function respostaNaoAutenticado() {
  return Response.json({ error: "Não autenticado" }, { status: 401 });
}

export function respostaErroInterno() {
  return Response.json({ error: "Erro interno" }, { status: 500 });
}
