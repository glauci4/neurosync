import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { validarAcessoClinica } from "@/lib/auth/permissoesClinica";
import { getConnection } from "@/lib/mysql";

type ConexaoMySQL = Awaited<ReturnType<typeof getConnection>>;
type TipoSala = "geral" | "infantil";

const MENSAGEM_CONSULTAS_FUTURAS =
  "Não é possível inativar enquanto houver consultas futuras vinculadas. Remaneje os atendimentos antes de continuar.";

interface SalaPayload {
  nome?: string;
  tipo?: TipoSala;
  ativo?: boolean;
}

function normalizarNome(nome?: string) {
  return String(nome || "").trim();
}

function validarPayloadSala(body: SalaPayload) {
  const nome = normalizarNome(body.nome);
  const tipo = body.tipo;

  if (!nome) return { erro: "Informe o nome da sala" };
  if (!tipo) return { erro: "Informe o tipo da sala" };
  if (!["geral", "infantil"].includes(tipo)) {
    return { erro: "Tipo de sala inválido" };
  }

  return { nome, tipo };
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

async function salaPossuiConsultasFuturas(
  connection: ConexaoMySQL,
  salaId: number,
  clinicaId: number,
) {
  const agora = dataHoraAtualLocal();
  const [consultas] = await connection.execute<RowDataPacket[]>(
    `SELECT id FROM consultas
     WHERE clinica_id = ? AND sala_id = ? AND deleted_at IS NULL
       AND status IN ('agendado', 'remarcado')
       AND (
         data_consulta > ?
         OR (data_consulta = ? AND horario_fim >= ?)
       )
     LIMIT 1`,
    [clinicaId, salaId, agora.data, agora.data, agora.hora],
  );

  return consultas.length > 0;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const salaId = Number.parseInt(id, 10);
  if (!Number.isInteger(salaId)) {
    return Response.json({ error: "Sala inválida" }, { status: 400 });
  }

  let connection: ConexaoMySQL | undefined;
  try {
    connection = await getConnection();
    const acesso = await validarAcessoClinica(connection, { admin: true });
    if (!acesso.ok) {
      return Response.json({ error: acesso.error }, { status: acesso.status });
    }
    if (!acesso.usuario.isAdminClinica) {
      // Permissão crítica: o front-end oculta ações da secretária, mas a API
      // também bloqueia requisições forçadas de alteração.
      return Response.json(
        { error: "Apenas o psicólogo administrador pode gerenciar salas" },
        { status: 403 },
      );
    }

    const body: SalaPayload = await request.json();
    const validacao = validarPayloadSala(body);
    if ("erro" in validacao) {
      return Response.json({ error: validacao.erro }, { status: 400 });
    }

    const [sala] = await connection.execute<RowDataPacket[]>(
      `SELECT id FROM salas
       WHERE id = ? AND clinica_id = ? AND deleted_at IS NULL`,
      [salaId, acesso.usuario.clinica_id],
    );
    if (sala.length === 0) {
      return Response.json({ error: "Sala não encontrada" }, { status: 404 });
    }

    const [duplicadas] = await connection.execute<RowDataPacket[]>(
      `SELECT id FROM salas
       WHERE clinica_id = ?
         AND id <> ?
         AND LOWER(TRIM(nome)) = LOWER(TRIM(?))
         AND deleted_at IS NULL`,
      [acesso.usuario.clinica_id, salaId, validacao.nome],
    );
    if (duplicadas.length > 0) {
      // Duplicidade crítica: impede nomes equivalentes na mesma clínica mesmo
      // quando chegam com espaços extras ou caixa diferente.
      return Response.json(
        { error: "Já existe uma sala com esse nome" },
        { status: 409 },
      );
    }

    if (
      body.ativo === false &&
      (await salaPossuiConsultasFuturas(
        connection,
        salaId,
        acesso.usuario.clinica_id,
      ))
    ) {
      return Response.json(
        { error: MENSAGEM_CONSULTAS_FUTURAS },
        { status: 409 },
      );
    }

    await connection.execute(
      `UPDATE salas
       SET nome = ?, tipo = ?, ativo = ?
       WHERE id = ? AND clinica_id = ? AND deleted_at IS NULL`,
      [
        validacao.nome,
        validacao.tipo,
        body.ativo === false ? 0 : 1,
        salaId,
        acesso.usuario.clinica_id,
      ],
    );

    return Response.json({ success: true, message: "Sala atualizada" });
  } catch (error) {
    console.error("Erro ao atualizar sala:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const salaId = Number.parseInt(id, 10);
  if (!Number.isInteger(salaId)) {
    return Response.json({ error: "Sala inválida" }, { status: 400 });
  }

  let connection: ConexaoMySQL | undefined;
  try {
    connection = await getConnection();
    const acesso = await validarAcessoClinica(connection, { admin: true });
    if (!acesso.ok) {
      return Response.json({ error: acesso.error }, { status: acesso.status });
    }
    if (!acesso.usuario.isAdminClinica) {
      // Permissão crítica: secretárias podem consultar salas, mas não podem
      // inativar ou reativar mesmo forçando a chamada PATCH.
      return Response.json(
        { error: "Apenas o psicólogo administrador pode gerenciar salas" },
        { status: 403 },
      );
    }

    const body: Pick<SalaPayload, "ativo"> = await request.json();
    if (typeof body.ativo !== "boolean") {
      return Response.json(
        { error: "Status da sala inválido" },
        { status: 400 },
      );
    }

    if (
      body.ativo === false &&
      (await salaPossuiConsultasFuturas(
        connection,
        salaId,
        acesso.usuario.clinica_id,
      ))
    ) {
      return Response.json(
        { error: MENSAGEM_CONSULTAS_FUTURAS },
        { status: 409 },
      );
    }

    const [resultado] = await connection.execute<ResultSetHeader>(
      `UPDATE salas
       SET ativo = ?
       WHERE id = ? AND clinica_id = ? AND deleted_at IS NULL`,
      [body.ativo === false ? 0 : 1, salaId, acesso.usuario.clinica_id],
    );

    if ("affectedRows" in resultado && resultado.affectedRows === 0) {
      return Response.json({ error: "Sala não encontrada" }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: "Status da sala atualizado",
    });
  } catch (error) {
    console.error("Erro ao alterar status da sala:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const salaId = Number.parseInt(id, 10);
  if (!Number.isInteger(salaId)) {
    return Response.json({ error: "Sala inválida" }, { status: 400 });
  }

  let connection: ConexaoMySQL | undefined;
  try {
    connection = await getConnection();
    const acesso = await validarAcessoClinica(connection, { admin: true });
    if (!acesso.ok) {
      return Response.json({ error: acesso.error }, { status: acesso.status });
    }
    if (!acesso.usuario.isAdminClinica) {
      // Permissão crítica: exclusão lógica também é operação administrativa e
      // não pode ser executada por secretárias via requisição manual.
      return Response.json(
        { error: "Apenas o psicólogo administrador pode gerenciar salas" },
        { status: 403 },
      );
    }

    const [sala] = await connection.execute<RowDataPacket[]>(
      `SELECT id FROM salas
       WHERE id = ? AND clinica_id = ? AND deleted_at IS NULL`,
      [salaId, acesso.usuario.clinica_id],
    );
    if (sala.length === 0) {
      return Response.json({ error: "Sala não encontrada" }, { status: 404 });
    }

    const [consultasRegistradas] = await connection.execute<RowDataPacket[]>(
      `SELECT id FROM consultas
       WHERE sala_id = ? AND deleted_at IS NULL
       LIMIT 1`,
      [salaId],
    );

    if (consultasRegistradas.length > 0) {
      return Response.json(
        {
          error:
            "Não é possível excluir esta sala porque ela já possui consultas registradas.",
        },
        { status: 409 },
      );
    }

    // Exclusão lógica: a sala deixa a listagem comum por deleted_at, sem perda
    // física de dados e ficando indisponível para a futura Agenda.
    await connection.execute(
      `UPDATE salas
       SET deleted_at = CURRENT_TIMESTAMP, ativo = 0
       WHERE id = ? AND clinica_id = ? AND deleted_at IS NULL`,
      [salaId, acesso.usuario.clinica_id],
    );

    return Response.json({ success: true, message: "Sala excluída" });
  } catch (error) {
    console.error("Erro ao excluir sala:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
