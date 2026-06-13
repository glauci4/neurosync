// app/api/clinica/funcionamento/excecoes/[id]/route.ts
import { validarAcessoClinica } from "@/lib/auth/permissoesClinica";
import { getConnection } from "@/lib/mysql";

type ConexaoMySQL = Awaited<ReturnType<typeof getConnection>>;

// PUT - editar exceção
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const excecaoId = Number.parseInt(id, 10);

  let connection: ConexaoMySQL | undefined;
  try {
    connection = await getConnection();
    const acesso = await validarAcessoClinica(connection, { admin: true });
    if (!acesso.ok) {
      return Response.json({ error: acesso.error }, { status: acesso.status });
    }

    const body = await request.json();
    const {
      tipo,
      data_especifica,
      data_fim,
      hora_inicio,
      hora_fim,
      descricao,
    } = body;

    // Validações básicas
    if (data_especifica && !/^\d{4}-\d{2}-\d{2}$/.test(data_especifica)) {
      return Response.json({ error: "Data inválida" }, { status: 400 });
    }
    if (data_fim && data_fim < data_especifica) {
      return Response.json(
        { error: "Data final menor que a inicial" },
        { status: 400 },
      );
    }

    await connection.execute(
      `UPDATE horarios_funcionamento 
       SET tipo = ?, data_especifica = ?, data_fim = ?, hora_inicio = ?, hora_fim = ?, descricao = ?
       WHERE id = ? AND clinica_id = ?`,
      [
        tipo,
        data_especifica,
        data_fim || null,
        hora_inicio || null,
        hora_fim || null,
        descricao || null,
        excecaoId,
        acesso.usuario.clinica_id,
      ],
    );

    return Response.json({ success: true, message: "Exceção atualizada" });
  } catch (error) {
    console.error("Erro ao atualizar exceção:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// DELETE - remover exceção
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const excecaoId = Number.parseInt(id, 10);

  let connection: ConexaoMySQL | undefined;
  try {
    connection = await getConnection();
    const acesso = await validarAcessoClinica(connection, { admin: true });
    if (!acesso.ok) {
      return Response.json({ error: acesso.error }, { status: acesso.status });
    }

    // Hard delete – apenas remove o registro
    await connection.execute(
      "DELETE FROM horarios_funcionamento WHERE id = ? AND clinica_id = ?",
      [excecaoId, acesso.usuario.clinica_id],
    );

    return Response.json({ success: true, message: "Exceção removida" });
  } catch (error) {
    console.error("Erro ao excluir exceção:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

