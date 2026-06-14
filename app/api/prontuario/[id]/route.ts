import type { ResultSetHeader } from "mysql2";
import { getConnection } from "@/lib/mysql";
import {
  type ConexaoMySQL,
  MENSAGEM_CONSULTA_REALIZADA_OBRIGATORIA,
  obterSessaoProntuario,
  softDeleteEvolucao,
  validarAcessoClinicoPaciente,
  validarAcessoProntuario,
  validarConsultaDaClinica,
  validarPacienteDaClinica,
  validarPayloadProntuario,
  validarPsicologo,
} from "../utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  let connection: ConexaoMySQL | undefined;

  try {
    connection = await getConnection();
    const sessao = await obterSessaoProntuario(connection);
    const erroPermissao = validarPsicologo(sessao);
    if (erroPermissao) {
      return Response.json({ error: erroPermissao }, { status: 403 });
    }
    const usuario = sessao as NonNullable<typeof sessao>;

    const { id } = await context.params;
    const acessoEvolucao = await validarAcessoProntuario(
      connection,
      Number(id),
      usuario,
    );
    if ("erro" in acessoEvolucao) {
      return Response.json(
        { error: acessoEvolucao.erro },
        { status: acessoEvolucao.status },
      );
    }
    const evolucao = acessoEvolucao.evolucao;

    return Response.json({ success: true, data: evolucao });
  } catch (error) {
    console.error("Erro ao buscar evolução:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

export async function PUT(request: Request, context: RouteContext) {
  let connection: ConexaoMySQL | undefined;

  try {
    connection = await getConnection();
    const sessao = await obterSessaoProntuario(connection);
    const erroPermissao = validarPsicologo(sessao);
    if (erroPermissao) {
      return Response.json({ error: erroPermissao }, { status: 403 });
    }
    const usuario = sessao as NonNullable<typeof sessao>;

    const { id } = await context.params;
    const evolucaoId = Number(id);
    const acessoAtual = await validarAcessoProntuario(
      connection,
      evolucaoId,
      usuario,
    );
    if ("erro" in acessoAtual) {
      return Response.json(
        { error: acessoAtual.erro },
        { status: acessoAtual.status },
      );
    }
    const atual = acessoAtual.evolucao;
    if (atual.status !== "rascunho") {
      // Bloqueio de edição: finalizado e assinado preservam o histórico clínico.
      return Response.json(
        { error: "Apenas rascunhos podem ser editados" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validacao = validarPayloadProntuario(body);
    if ("erro" in validacao) {
      return Response.json({ error: validacao.erro }, { status: 400 });
    }
    const pacienteValido = await validarPacienteDaClinica(
      connection,
      validacao.dados.paciente_id,
      usuario.clinica_id,
    );
    if (!pacienteValido) {
      return Response.json(
        { error: "Paciente não encontrado ou inativo" },
        { status: 400 },
      );
    }

    const acessoPaciente = await validarAcessoClinicoPaciente(
      connection,
      validacao.dados.paciente_id,
      usuario,
    );
    if ("erro" in acessoPaciente) {
      return Response.json(
        { error: acessoPaciente.erro },
        { status: acessoPaciente.status },
      );
    }

    const consultaValida = await validarConsultaDaClinica(
      connection,
      validacao.dados.consulta_id,
      validacao.dados.paciente_id,
      usuario.clinica_id,
      null,
    );
    if (!consultaValida) {
      return Response.json(
        { error: MENSAGEM_CONSULTA_REALIZADA_OBRIGATORIA },
        { status: 400 },
      );
    }

    await connection.beginTransaction();

    // Histórico de edição: cada alteração preserva conteúdo anterior, editor,
    // CRP e assinatura profissional vigente sem substituir a assinatura final.
    await connection.execute<ResultSetHeader>(
      `INSERT INTO registro_clinico_historico_edicoes (
        registro_clinico_id, psicologo_id, nome_psicologo, crp_psicologo,
        assinatura_url, editado_em, conteudo_anterior, conteudo_novo
      ) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [
        evolucaoId,
        usuario.id,
        usuario.nome,
        usuario.crp,
        usuario.assinatura_profissional_url,
        atual.conteudo || "",
        validacao.dados.conteudo,
      ],
    );

    const [resultado] = await connection.execute<ResultSetHeader>(
      `UPDATE registros_clinicos
       SET paciente_id = ?, consulta_id = ?, data_registro = ?,
           tipo_atendimento = ?, conteudo = ?
       WHERE id = ? AND clinica_id = ?
         AND status = 'rascunho' AND deleted_at IS NULL`,
      [
        validacao.dados.paciente_id,
        validacao.dados.consulta_id,
        validacao.dados.data_registro,
        validacao.dados.tipo_atendimento,
        validacao.dados.conteudo,
        evolucaoId,
        usuario.clinica_id,
      ],
    );

    if (resultado.affectedRows === 0) {
      await connection.rollback();
      return Response.json(
        { error: "Evolução não encontrada" },
        { status: 404 },
      );
    }

    await connection.commit();
    return Response.json({ success: true, message: "Rascunho atualizado" });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => undefined);
    console.error("Erro ao atualizar evolução:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  let connection: ConexaoMySQL | undefined;

  try {
    connection = await getConnection();
    const sessao = await obterSessaoProntuario(connection);
    const erroPermissao = validarPsicologo(sessao);
    if (erroPermissao) {
      return Response.json({ error: erroPermissao }, { status: 403 });
    }
    const usuario = sessao as NonNullable<typeof sessao>;

    const { id } = await context.params;
    const acessoAtual = await validarAcessoProntuario(
      connection,
      Number(id),
      usuario,
    );
    if ("erro" in acessoAtual) {
      return Response.json(
        { error: acessoAtual.erro },
        { status: acessoAtual.status },
      );
    }
    const atual = acessoAtual.evolucao;
    if (atual.status === "assinado") {
      return Response.json(
        { error: "Evoluções assinadas não podem ser excluídas" },
        { status: 400 },
      );
    }

    // Soft delete: preserva trilha clínica e impede perda definitiva.
    const removida = await softDeleteEvolucao(connection, Number(id), usuario);
    if (!removida) {
      return Response.json(
        { error: "Evolução não encontrada" },
        { status: 404 },
      );
    }

    return Response.json({ success: true, message: "Evolução removida" });
  } catch (error) {
    console.error("Erro ao remover evolução:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
