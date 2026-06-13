// app/api/clinica/funcionamento/excecoes/route.ts

import type { RowDataPacket } from "mysql2";
import { validarAcessoClinica } from "@/lib/auth/permissoesClinica";
import { getConnection } from "@/lib/mysql";

// ---------- TIPOS ----------
interface ExcecaoPayload {
  tipo: "feriado" | "ferias" | "bloqueio" | "excecao";
  data_especifica: string; // formato YYYY-MM-DD
  data_fim?: string; // opcional, para intervalos
  hora_inicio?: string | null;
  hora_fim?: string | null;
  descricao?: string; // opcional, para observações
  ativo?: number;
}

const MENSAGENS_CONFLITO: Record<ExcecaoPayload["tipo"], string> = {
  feriado:
    "Existem consultas agendadas para esta data. Para aplicar o feriado, remarque ou cancele os atendimentos vinculados.",
  ferias:
    "Existem consultas agendadas neste período. Para aplicar o bloqueio, remarque ou cancele os atendimentos dos dias indicados.",
  bloqueio:
    "Existem consultas agendadas neste período. Para aplicar o bloqueio, remarque ou cancele os atendimentos dos dias indicados.",
  excecao:
    "Existem consultas fora do horário especial definido. Para salvar esta alteração, remarque os atendimentos conflitantes.",
};

async function buscarDiasComConsultasConflitantes(
  connection: Awaited<ReturnType<typeof getConnection>>,
  params: {
    clinicaId: number;
    tipo: ExcecaoPayload["tipo"];
    dataInicio: string;
    dataFim: string;
    horaInicio?: string | null;
    horaFim?: string | null;
  },
) {
  const valores: Array<string | number> = [
    params.clinicaId,
    params.dataInicio,
    params.dataFim,
  ];
  const filtroHorario =
    params.tipo === "excecao"
      ? "AND (horario_inicio < ? OR horario_fim > ?)"
      : "";
  if (params.tipo === "excecao") {
    valores.push(String(params.horaInicio || ""), String(params.horaFim || ""));
  }

  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT data_consulta, COUNT(*) AS total
     FROM consultas
     WHERE clinica_id = ?
       AND data_consulta BETWEEN ? AND ?
       AND deleted_at IS NULL
       AND status IN ('agendado', 'remarcado')
       ${filtroHorario}
     GROUP BY data_consulta
     ORDER BY data_consulta ASC`,
    valores,
  );

  return rows.map((row) => ({
    data: String(row.data_consulta).slice(0, 10),
    total: Number(row.total || 0),
  }));
}

// ---------- GET: lista exceções da clínica ----------
export async function GET() {
  let connection: Awaited<ReturnType<typeof getConnection>> | null = null;
  try {
    connection = await getConnection();
    const acesso = await validarAcessoClinica(connection);
    if (!acesso.ok) {
      return Response.json({ error: acesso.error }, { status: acesso.status });
    }
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT id, tipo, data_especifica, data_fim, hora_inicio, hora_fim, 
              intervalo_inicio, intervalo_fim, ativo, descricao
       FROM horarios_funcionamento
       WHERE clinica_id = ? AND tipo NOT IN ('funcionamento', 'feriado')
       ORDER BY data_especifica`,
      [acesso.usuario.clinica_id],
    );
    return Response.json(rows);
  } catch (error) {
    console.error("Erro ao listar exceções:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// ---------- POST: cria uma nova exceção (com verificação de duplicata) ----------
export async function POST(request: Request) {
  let connection: Awaited<ReturnType<typeof getConnection>> | null = null;
  try {
    connection = await getConnection();
    const acesso = await validarAcessoClinica(connection, { admin: true });
    if (!acesso.ok) {
      return Response.json({ error: acesso.error }, { status: acesso.status });
    }
    if (!acesso.usuario.isAdminClinica) {
      return Response.json(
        { error: "Apenas o psicólogo administrador pode gerenciar exceções" },
        { status: 403 },
      );
    }

    const body: ExcecaoPayload = await request.json();
    const {
      tipo,
      data_especifica,
      data_fim,
      hora_inicio,
      hora_fim,
      descricao,
      ativo,
    } = body;

    if (!tipo || !data_especifica) {
      return Response.json(
        { error: "Tipo e data são obrigatórios" },
        { status: 400 },
      );
    }
    if (!["feriado", "ferias", "bloqueio", "excecao"].includes(tipo)) {
      return Response.json({ error: "Tipo inválido" }, { status: 400 });
    }
    const dataRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dataRegex.test(data_especifica)) {
      return Response.json(
        { error: "Data inválida. Use o formato AAAA-MM-DD" },
        { status: 400 },
      );
    }
    if (data_fim) {
      if (!dataRegex.test(data_fim) || data_fim < data_especifica) {
        return Response.json(
          { error: "Data final inválida ou menor que a data inicial" },
          { status: 400 },
        );
      }
    }
    if (hora_inicio || hora_fim) {
      if (!hora_inicio || !hora_fim) {
        return Response.json(
          { error: "Informe ambos os horários ou nenhum" },
          { status: 400 },
        );
      }
      if (hora_inicio >= hora_fim) {
        return Response.json(
          { error: "Horário de início deve ser menor que o fim" },
          { status: 400 },
        );
      }
    }

    const diasConflitantes = await buscarDiasComConsultasConflitantes(
      connection,
      {
        clinicaId: acesso.usuario.clinica_id,
        tipo,
        dataInicio: data_especifica,
        dataFim: data_fim || data_especifica,
        horaInicio: hora_inicio,
        horaFim: hora_fim,
      },
    );
    if (diasConflitantes.length > 0) {
      return Response.json(
        {
          error: MENSAGENS_CONFLITO[tipo],
          code: "CONSULTAS_CONFLITANTES",
          dias: diasConflitantes,
        },
        { status: 409 },
      );
    }

    // --- Verificação de duplicata antes de inserir ---
    const [existente] = await connection.execute<RowDataPacket[]>(
      `SELECT id FROM horarios_funcionamento 
       WHERE clinica_id = ? AND data_especifica = ? AND tipo = ?`,
      [acesso.usuario.clinica_id, data_especifica, tipo],
    );

    if (existente.length > 0) {
      // Já existe: retorna sucesso sem inserir novamente
      return Response.json({
        success: true,
        message: "Exceção já cadastrada anteriormente",
        id: existente[0].id,
      });
    }
    // --- Fim da verificação ---

    // Se não existe, insere normalmente
    await connection.execute(
      `INSERT INTO horarios_funcionamento 
       (clinica_id, tipo, data_especifica, data_fim, hora_inicio, hora_fim, ativo, descricao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        acesso.usuario.clinica_id,
        tipo,
        data_especifica,
        data_fim || null,
        hora_inicio || null,
        hora_fim || null,
        typeof ativo === "number" ? ativo : 1,
        descricao || null,
      ],
    );

    return Response.json({ success: true, message: "Exceção adicionada" });
  } catch (error) {
    console.error("Erro ao criar exceção:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
