// app/api/usuarios/me/avatar/route.ts
// Avatar do próprio usuário. Não altera senha, perfil, CRP ou CPF.

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ResultSetHeader } from "mysql2";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { getConnection } from "@/lib/mysql";

const TAMANHO_MAXIMO = 5 * 1024 * 1024;
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

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

export async function POST(request: Request) {
  const sessao = await obterUsuarioDoCookie();
  if (!sessao) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  let connection: Awaited<ReturnType<typeof getConnection>> | undefined;
  try {
    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return Response.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 },
      );
    }

    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      return Response.json(
        { error: "Use uma imagem JPG, PNG ou WEBP" },
        { status: 400 },
      );
    }

    if (file.size > TAMANHO_MAXIMO) {
      return Response.json(
        { error: "A imagem deve ter no máximo 5MB" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const nomeArquivo = `${uuidv4()}${extensaoPorTipo(file.type)}`;
    const pastaAvatares = join(process.cwd(), "public", "avatars");
    await mkdir(pastaAvatares, { recursive: true });
    await writeFile(join(pastaAvatares, nomeArquivo), buffer);

    const avatarUrl = `/avatars/${nomeArquivo}`;
    connection = await getConnection();
    const [resultado] = await connection.execute<ResultSetHeader>(
      "UPDATE usuarios SET avatar_url = ? WHERE id = ?",
      [avatarUrl, sessao.id],
    );

    if (resultado.affectedRows === 0) {
      return Response.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      message: "Foto atualizada com sucesso",
      avatar_url: avatarUrl,
    });
  } catch (error) {
    console.error("Erro ao atualizar avatar:", error);
    return Response.json(
      { error: "Erro ao processar a imagem" },
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

  let connection: Awaited<ReturnType<typeof getConnection>> | undefined;
  try {
    connection = await getConnection();
    const [resultado] = await connection.execute<ResultSetHeader>(
      "UPDATE usuarios SET avatar_url = NULL WHERE id = ?",
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
      message: "Foto removida com sucesso",
    });
  } catch (error) {
    console.error("Erro ao remover avatar:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  } finally {
    if (connection) await connection.end();
  }
}

