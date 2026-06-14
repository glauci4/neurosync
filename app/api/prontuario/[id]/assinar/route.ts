import type { ResultSetHeader, RowDataPacket } from "mysql2";
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

    if (!usuario.assinatura_profissional_url) {
      return Response.json(
        {
          error:
            "Cadastre sua assinatura profissional no Perfil Profissional antes de assinar evoluções.",
        },
        { status: 400 },
      );
    }

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
    if (evolucao.status !== "finalizado") {
      return Response.json(
        { error: "Apenas evoluções finalizadas podem ser assinadas" },
        { status: 400 },
      );
    }

    // Assinatura: copia a URL atual para o prontuário, preservando histórico
    // mesmo se o psicólogo trocar a assinatura no Perfil Profissional depois.
    const [resultado] = await connection.execute<ResultSetHeader>(
      `UPDATE registros_clinicos
       SET status = 'assinado', assinatura_url = ?, assinado_em = NOW()
       WHERE id = ? AND clinica_id = ? AND psicologo_id = ?
         AND status = 'finalizado' AND deleted_at IS NULL`,
      [
        usuario.assinatura_profissional_url,
        evolucaoId,
        usuario.clinica_id,
        usuario.id,
      ],
    );

    if (resultado.affectedRows === 0) {
      return Response.json(
        { error: "Evolução não encontrada" },
        { status: 404 },
      );
    }

    const [registros] = await connection.execute<RowDataPacket[]>(
      `SELECT status, assinatura_url, assinado_em
       FROM registros_clinicos
       WHERE id = ? AND clinica_id = ? AND psicologo_id = ?
         AND deleted_at IS NULL`,
      [evolucaoId, usuario.clinica_id, usuario.id],
    );

    return Response.json({
      success: true,
      message: "Evolução assinada",
      data: registros[0] || null,
    });
  } catch (error) {
    console.error("Erro ao assinar evolução:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
