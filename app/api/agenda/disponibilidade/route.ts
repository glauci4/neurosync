import type { RowDataPacket } from "mysql2";
import {
  DURACAO_ATENDIMENTO_MINUTOS,
  DURACAO_BLOCO_AGENDA_MINUTOS,
} from "@/app/agenda/constants/duracaoConsulta";
import { getConnection } from "@/lib/mysql";
import {
  type ConexaoMySQL,
  obterDisponibilidadeAgenda,
  obterUsuarioDoCookie,
} from "../validacoes";

function obterParametro(params: URLSearchParams, nomes: string[]) {
  for (const nome of nomes) {
    const valor = params.get(nome);
    if (valor !== null && valor !== "") return valor;
  }
  return "";
}

function numeroParametro(params: URLSearchParams, nomes: string[]) {
  const valor = Number(obterParametro(params, nomes) || 0);
  return valor > 0 ? valor : undefined;
}

function normalizarHoraParametro(valor: string | null) {
  if (!valor) return undefined;
  if (/^\d{2}:\d{2}$/.test(valor)) return `${valor}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(valor)) return valor;
  return undefined;
}

function dataValida(data: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(data);
}

function dataHojeISO() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function horaParaMinutos(hora: string) {
  const [horas, minutos] = hora
    .split(":")
    .map((parte) => Number.parseInt(parte, 10));
  return horas * 60 + minutos;
}

function minutosParaHora(totalMinutos: number) {
  const horas = Math.floor(totalMinutos / 60)
    .toString()
    .padStart(2, "0");
  const minutos = (totalMinutos % 60).toString().padStart(2, "0");
  return `${horas}:${minutos}`;
}

function gerarSlotsDoExpediente(
  inicio: string,
  fim: string,
  dataConsulta: string,
) {
  const slots: Array<{
    inicio: string;
    fim: string;
    label: string;
    disponivel: boolean;
  }> = [];

  const inicioMin = horaParaMinutos(inicio);
  const fimMin = horaParaMinutos(fim);
  const duracaoAtendimento = DURACAO_ATENDIMENTO_MINUTOS;
  const duracaoBloco = DURACAO_BLOCO_AGENDA_MINUTOS;
  const passo = 60;
  const hoje = dataHojeISO();
  const agora = new Date();
  const minutoAtual = agora.getHours() * 60 + agora.getMinutes();
  const dataHoje = dataConsulta === hoje;

  for (
    let minuto = inicioMin;
    minuto + duracaoBloco <= fimMin;
    minuto += passo
  ) {
    if (dataHoje && minuto <= minutoAtual) continue;

    const inicioSlot = minutosParaHora(minuto);
    const fimAtendimento = minutosParaHora(minuto + duracaoAtendimento);
    const fimSlot = minutosParaHora(minuto + duracaoBloco);
    slots.push({
      inicio: inicioSlot,
      fim: fimSlot,
      label: `${inicioSlot} às ${fimAtendimento}`,
      disponivel: true,
    });
  }

  return slots;
}

async function validarVinculoClinica(
  connection: ConexaoMySQL,
  clinicaId: number,
  psicologoId: number,
  salaId: number,
) {
  const [psicologoRows] = await connection.execute<RowDataPacket[]>(
    `SELECT id FROM usuarios
     WHERE id = ? AND clinica_id = ? AND perfil_id = 2
     LIMIT 1`,
    [psicologoId, clinicaId],
  );

  if (psicologoRows.length === 0) {
    return "Psicólogo não existe ou não pertence à clínica.";
  }

  const [salaRows] = await connection.execute<RowDataPacket[]>(
    `SELECT id FROM salas
     WHERE id = ? AND clinica_id = ? AND ativo = 1 AND deleted_at IS NULL
     LIMIT 1`,
    [salaId, clinicaId],
  );

  if (salaRows.length === 0) {
    return "Sala não existe, está inativa ou não pertence à clínica.";
  }

  return null;
}

async function consultarDisponibilidadePontual(
  connection: ConexaoMySQL,
  clinicaId: number,
  dataConsulta: string,
  horarioInicio?: string,
  horarioFim?: string,
  psicologoId?: number,
  salaId?: number,
  ignorarConsultaId?: number,
) {
  const disponibilidade = await obterDisponibilidadeAgenda(
    connection,
    clinicaId,
    dataConsulta,
    horarioInicio,
    horarioFim,
  );

  const conflitos: {
    sala?: string;
    psicologo?: string;
  } = {};

  if (
    disponibilidade.disponivel &&
    dataConsulta &&
    horarioInicio &&
    horarioFim
  ) {
    const filtroIgnorar = ignorarConsultaId ? "AND id <> ?" : "";
    const paramsComuns: Array<string | number> = [
      clinicaId,
      dataConsulta,
      horarioInicio,
      horarioFim,
    ];

    if (salaId) {
      const [conflitoSala] = await connection.execute<RowDataPacket[]>(
        `SELECT id FROM consultas
         WHERE clinica_id = ? AND data_consulta = ? AND deleted_at IS NULL
           AND status NOT IN ('cancelado', 'falta')
           AND (? < horario_fim AND ? > horario_inicio)
           AND sala_id = ? ${filtroIgnorar}
         LIMIT 1`,
        ignorarConsultaId
          ? [...paramsComuns, salaId, ignorarConsultaId]
          : [...paramsComuns, salaId],
      );
      if (conflitoSala.length > 0) {
        conflitos.sala = "Já existe uma consulta para esta sala neste horário.";
      }
    }

    if (psicologoId) {
      const [conflitoPsicologo] = await connection.execute<RowDataPacket[]>(
        `SELECT id FROM consultas
         WHERE clinica_id = ? AND data_consulta = ? AND deleted_at IS NULL
           AND status NOT IN ('cancelado', 'falta')
           AND (? < horario_fim AND ? > horario_inicio)
           AND psicologo_id = ? ${filtroIgnorar}
         LIMIT 1`,
        ignorarConsultaId
          ? [...paramsComuns, psicologoId, ignorarConsultaId]
          : [...paramsComuns, psicologoId],
      );
      if (conflitoPsicologo.length > 0) {
        conflitos.psicologo = "O psicólogo já possui consulta neste horário.";
      }
    }
  }

  return {
    ...disponibilidade,
    conflitos,
    disponivel:
      disponibilidade.disponivel && Object.keys(conflitos).length === 0,
  };
}

async function consultarDisponibilidadeDoDia(
  connection: ConexaoMySQL,
  clinicaId: number,
  dataConsulta: string,
  psicologoId: number,
  salaId: number,
  ignorarConsultaId?: number,
) {
  const disponibilidadeBase = await obterDisponibilidadeAgenda(
    connection,
    clinicaId,
    dataConsulta,
  );

  if (!disponibilidadeBase.disponivel || !disponibilidadeBase.expediente) {
    return {
      success: true,
      duracaoMinutos: DURACAO_ATENDIMENTO_MINUTOS,
      motivo:
        disponibilidadeBase.motivo ||
        "Não há funcionamento cadastrado para esta data.",
      horarios: [],
    };
  }

  const erroVinculo = await validarVinculoClinica(
    connection,
    clinicaId,
    psicologoId,
    salaId,
  );
  if (erroVinculo) {
    return {
      success: false,
      duracaoMinutos: DURACAO_ATENDIMENTO_MINUTOS,
      horarios: [],
      error: erroVinculo,
    };
  }

  const slots = gerarSlotsDoExpediente(
    disponibilidadeBase.expediente.inicio,
    disponibilidadeBase.expediente.fim,
    dataConsulta,
  );

  if (slots.length === 0) {
    return {
      success: true,
      duracaoMinutos: DURACAO_ATENDIMENTO_MINUTOS,
      motivo: "Nenhum horário disponível para esta data.",
      horarios: [],
    };
  }

  const horarios = [];
  for (const slot of slots) {
    const resultado = await consultarDisponibilidadePontual(
      connection,
      clinicaId,
      dataConsulta,
      slot.inicio,
      slot.fim,
      psicologoId,
      salaId,
      ignorarConsultaId,
    );

    horarios.push({
      ...slot,
      disponivel: Boolean(resultado.disponivel),
    });
  }

  return {
    success: true,
    duracaoMinutos: DURACAO_ATENDIMENTO_MINUTOS,
    horarios: horarios.filter((horario) => horario.disponivel),
  };
}

export async function GET(request: Request) {
  const sessao = await obterUsuarioDoCookie();
  if (!sessao) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dataConsulta =
    obterParametro(searchParams, ["data", "data_consulta"]) || "";
  const horarioInicio = normalizarHoraParametro(
    searchParams.get("horario_inicio"),
  );
  const horarioFim = normalizarHoraParametro(searchParams.get("horario_fim"));
  const psicologoId =
    numeroParametro(searchParams, ["psicologoId", "psicologo_id"]) || undefined;
  const salaId =
    numeroParametro(searchParams, ["salaId", "sala_id"]) || undefined;
  const ignorarConsultaId =
    numeroParametro(searchParams, ["consultaId", "consulta_id"]) || undefined;

  if (!dataConsulta || !dataValida(dataConsulta)) {
    return Response.json(
      { error: "Informe uma data válida para consultar a disponibilidade." },
      { status: 400 },
    );
  }

  if (dataConsulta < dataHojeISO()) {
    return Response.json(
      { error: "Não é possível consultar disponibilidade para data passada." },
      { status: 400 },
    );
  }

  let connection: ConexaoMySQL | undefined;
  try {
    connection = await getConnection();

    if (horarioInicio && horarioFim) {
      const disponibilidade = await consultarDisponibilidadePontual(
        connection,
        sessao.clinica_id,
        dataConsulta,
        horarioInicio,
        horarioFim,
        psicologoId,
        salaId,
        ignorarConsultaId,
      );

      return Response.json({
        success: true,
        data: disponibilidade,
      });
    }

    if (!psicologoId) {
      return Response.json(
        { error: "Selecione um psicólogo para consultar a disponibilidade." },
        { status: 400 },
      );
    }

    if (!salaId) {
      return Response.json(
        { error: "Selecione uma sala para consultar a disponibilidade." },
        { status: 400 },
      );
    }

    const disponibilidade = await consultarDisponibilidadeDoDia(
      connection,
      sessao.clinica_id,
      dataConsulta,
      psicologoId,
      salaId,
      ignorarConsultaId,
    );

    if (!disponibilidade.success) {
      return Response.json(disponibilidade, { status: 400 });
    }

    return Response.json(disponibilidade);
  } catch (error) {
    console.error("Erro ao consultar disponibilidade da agenda:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao consultar disponibilidade.",
      },
      { status: 500 },
    );
  } finally {
    if (connection) await connection.end();
  }
}

