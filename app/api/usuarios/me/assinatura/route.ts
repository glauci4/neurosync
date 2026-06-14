// app/api/usuarios/me/assinatura/route.ts
// Assinatura profissional do psicólogo para uso futuro em Prontuário e PDFs.

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { getConnection } from "@/lib/mysql";

const TAMANHO_MAXIMO = 5 * 1024 * 1024;
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

type ConexaoMySQL = Awaited<ReturnType<typeof getConnection>>;

async function obterUsuarioDoCookie(): Promise<{ id: number } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("usuario_neurosync");
  if (!sessionCookie) return null;
  try {
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
}

function extensaoPorTipo(tipo: string) {
  if (tipo === "image/png") return ".png";
  if (tipo === "image/webp") return ".webp";
  return ".jpg";
}

async function validarPsicologo(connection: ConexaoMySQL, usuarioId: number) {
  const [usuarios] = await connection.execute<RowDataPacket[]>(
    "SELECT perfil_id FROM usuarios WHERE id = ?",
    [usuarioId],
  );

  if (usuarios.length === 0) return "Usuário não encontrado";
  if (usuarios[0].perfil_id !== 2)
    return "Apenas psicólogos podem gerenciar assinatura profissional";
  return null;
}

async function possuiColunaAssinatura(connection: ConexaoMySQL) {
  const [colunas] = await connection.execute<RowDataPacket[]>(
    "SHOW COLUMNS FROM usuarios LIKE 'assinatura_profissional_url'",
  );
  return colunas.length > 0;
}

export async function POST(request: Request) {
  const sessao = await obterUsuarioDoCookie();
  if (!sessao) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  let connection: ConexaoMySQL | undefined;
  try {
    connection = await getConnection();

    // Permissão crítica: secretárias não visualizam o card e também não podem
    // forçar upload via API, pois assinatura só existe para psicólogos.
    const erroPermissao = await validarPsicologo(connection, sessao.id);
    if (erroPermissao) {
      return Response.json({ error: erroPermissao }, { status: 403 });
    }

    if (!(await possuiColunaAssinatura(connection))) {
      return Response.json(
        { error: "Campo de assinatura profissional ainda não existe no banco" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("assinatura") as File | null;

    if (!file) {
      return Response.json(
        { error: "Nenhum arquivo de assinatura enviado" },
        { status: 400 },
      );
    }

    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      return Response.json(
        { error: "Use uma assinatura em JPG, PNG ou WEBP" },
        { status: 400 },
      );
    }

    if (file.size > TAMANHO_MAXIMO) {
      return Response.json(
        { error: "A assinatura deve ter no máximo 5MB" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const nomeArquivo = `${uuidv4()}${extensaoPorTipo(file.type)}`;
    const pastaAssinaturas = join(process.cwd(), "public", "assinaturas");
    await mkdir(pastaAssinaturas, { recursive: true });
    await writeFile(join(pastaAssinaturas, nomeArquivo), buffer);

    const assinaturaUrl = `/assinaturas/${nomeArquivo}`;
    const [resultado] = await connection.execute<ResultSetHeader>(
      "UPDATE usuarios SET assinatura_profissional_url = ? WHERE id = ?",
      [assinaturaUrl, sessao.id],
    );

    if (resultado.affectedRows === 0) {
      return Response.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      message: "Assinatura profissional atualizada com sucesso",
      assinatura_profissional_url: assinaturaUrl,
    });
  } catch (error) {
    console.error("Erro ao atualizar assinatura profissional:", error);
    return Response.json(
      { error: "Erro ao processar a assinatura profissional" },
      { status: 500 },
    );
  } finally {
    if (connection) await connection.end();
  }
}

export async function DELETE() {
  const sessao = await obterUsuarioDoCookie();
  if (!sessao) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  let connection: ConexaoMySQL | undefined;
  try {
    connection = await getConnection();

    const erroPermissao = await validarPsicologo(connection, sessao.id);
    if (erroPermissao) {
      return Response.json({ error: erroPermissao }, { status: 403 });
    }

    if (!(await possuiColunaAssinatura(connection))) {
      return Response.json(
        { error: "Campo de assinatura profissional ainda não existe no banco" },
        { status: 500 },
      );
    }

    const [resultado] = await connection.execute<ResultSetHeader>(
      "UPDATE usuarios SET assinatura_profissional_url = NULL WHERE id = ?",
      [sessao.id],
    );

    if (resultado.affectedRows === 0) {
      return Response.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      message: "Assinatura profissional removida com sucesso",
    });
  } catch (error) {
    console.error("Erro ao remover assinatura profissional:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  } finally {
    if (connection) await connection.end();
  }
}
