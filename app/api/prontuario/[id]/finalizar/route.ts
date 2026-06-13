import type { ResultSetHeader } from "mysql2";
import { getConnection } from "@/lib/mysql";
import {
  type ConexaoMySQL,
  obterSessaoProntuario,
  validarAcessoProntuario,
  validarPsicologo,
} from "../../utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
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
    const acessoEvolucao = await validarAcessoProntuario(
      connection,
      evolucaoId,
      usuario,
    );
    if ("erro" in acessoEvolucao) {
      return Response.json(
        { error: acessoEvolucao.erro },
        { status: acessoEvolucao.status },
      );
    }
    const evolucao = acessoEvolucao.evolucao;
    if (evolucao.status !== "rascunho") {
      return Response.json(
        { error: "Apenas rascunhos podem ser finalizados" },
        { status: 400 },
      );
    }
    if (!String(evolucao.conteudo || "").trim()) {
      return Response.json(
        { error: "Conteúdo da evolução é obrigatório para finalizar" },
        { status: 400 },
      );
    }

    // Status finalizado bloqueia edição livre e prepara a assinatura clínica.
    const [resultado] = await connection.execute<ResultSetHeader>(
      `UPDATE registros_clinicos
       SET status = 'finalizado', finalizado_em = NOW()
       WHERE id = ? AND clinica_id = ? AND psicologo_id = ?
         AND status = 'rascunho' AND deleted_at IS NULL`,
      [evolucaoId, usuario.clinica_id, usuario.id],
    );

    if (resultado.affectedRows === 0) {
      return Response.json(
        { error: "Evolução não encontrada" },
        { status: 404 },
      );
    }

    return Response.json({ success: true, message: "Evolução finalizada" });
  } catch (error) {
    console.error("Erro ao finalizar evolução:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

