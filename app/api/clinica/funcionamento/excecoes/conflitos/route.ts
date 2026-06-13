import type { RowDataPacket } from "mysql2";
import { validarAcessoClinica } from "@/lib/auth/permissoesClinica";
import { getConnection } from "@/lib/mysql";

type TipoExcecao = "feriado" | "ferias" | "bloqueio" | "excecao";

interface ConsultaConflitoRow extends RowDataPacket {
  data_consulta: string;
  total: number;
}

const MENSAGENS_CONFLITO: Record<TipoExcecao, string> = {
  feriado:
    "Existem consultas agendadas para esta data. Para aplicar o feriado, remarque ou cancele os atendimentos vinculados.",
  ferias:
    "Existem consultas agendadas neste período. Para aplicar o bloqueio, remarque ou cancele os atendimentos dos dias indicados.",
  bloqueio:
    "Existem consultas agendadas neste período. Para aplicar o bloqueio, remarque ou cancele os atendimentos dos dias indicados.",
  excecao:
    "Existem consultas fora do horário especial definido. Para salvar esta alteração, remarque os atendimentos conflitantes.",
};

function parametro(searchParams: URLSearchParams, chave: string) {
  return String(searchParams.get(chave) || "").trim();
}

function validarData(data: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(data);
}

function validarHora(hora: string) {
  return /^\d{2}:\d{2}$/.test(hora);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tipo = parametro(searchParams, "tipo") as TipoExcecao;
  const dataInicio = parametro(searchParams, "data_inicio");
  const dataFim = parametro(searchParams, "data_fim") || dataInicio;
  const horaInicio = parametro(searchParams, "hora_inicio");
  const horaFim = parametro(searchParams, "hora_fim");

  if (!["feriado", "ferias", "bloqueio", "excecao"].includes(tipo)) {
    return Response.json({ error: "Tipo inválido" }, { status: 400 });
  }
  if (
    !validarData(dataInicio) ||
    !validarData(dataFim) ||
    dataFim < dataInicio
  ) {
    return Response.json({ error: "Período inválido" }, { status: 400 });
  }
  if (
    tipo === "excecao" &&
    (!validarHora(horaInicio) || !validarHora(horaFim) || horaInicio >= horaFim)
  ) {
    return Response.json(
      { error: "Horário especial inválido" },
      { status: 400 },
    );
  }

  let connection: Awaited<ReturnType<typeof getConnection>> | null = null;
  try {
    connection = await getConnection();
    const acesso = await validarAcessoClinica(connection, { admin: true });
    if (!acesso.ok) {
      return Response.json({ error: acesso.error }, { status: acesso.status });
    }

    const params: Array<string | number> = [
      acesso.usuario.clinica_id,
      dataInicio,
      dataFim,
    ];
    const filtroHorario =
      tipo === "excecao" ? "AND (horario_inicio < ? OR horario_fim > ?)" : "";
    if (tipo === "excecao") {
      params.push(horaInicio, horaFim);
    }

    const [rows] = await connection.execute<ConsultaConflitoRow[]>(
      `SELECT data_consulta, COUNT(*) AS total
       FROM consultas
       WHERE clinica_id = ?
         AND data_consulta BETWEEN ? AND ?
         AND deleted_at IS NULL
         AND status IN ('agendado', 'remarcado')
         ${filtroHorario}
       GROUP BY data_consulta
       ORDER BY data_consulta ASC`,
      params,
    );

    const dias = rows.map((row) => ({
      data: String(row.data_consulta).slice(0, 10),
      total: Number(row.total || 0),
    }));

    return Response.json({
      success: true,
      temConflitos: dias.length > 0,
      dias,
      mensagem: dias.length > 0 ? MENSAGENS_CONFLITO[tipo] : null,
    });
  } catch (error) {
    console.error("Erro ao validar conflitos de exceção:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
