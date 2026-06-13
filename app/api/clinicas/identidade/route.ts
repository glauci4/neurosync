import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { getConnection } from "@/lib/mysql";

type ConexaoMySQL = Awaited<ReturnType<typeof getConnection>>;

async function obterSessao(): Promise<{
  id: number;
  clinica_id: number;
} | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("usuario_neurosync");
  if (!cookie) return null;

  try {
    return JSON.parse(cookie.value);
  } catch {
    return null;
  }
}

function extensaoPorTipo(tipo: string) {
  if (tipo === "image/png") return ".png";
  if (tipo === "image/webp") return ".webp";
  return ".jpg";
}

async function validarResponsavelClinica(
  connection: ConexaoMySQL,
  usuarioId: number,
  clinicaId: number,
) {
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT u.perfil_id, c.responsavel_clinica_id
     FROM usuarios u
     INNER JOIN clinicas c ON c.id = u.clinica_id
     WHERE u.id = ? AND u.clinica_id = ?`,
    [usuarioId, clinicaId],
  );

  if (rows.length === 0) {
    return { ok: false, status: 404, error: "Usuário não encontrado" };
  }

  if (
    Number(rows[0].perfil_id) !== 2 ||
    Number(rows[0].responsavel_clinica_id) !== Number(usuarioId)
  ) {
    return {
      ok: false,
      status: 403,
      error: "Apenas o responsável pela clínica pode editar estas informações.",
    };
  }

  return { ok: true };
}

function validarArquivo(file: File) {
  const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];

  if (!tiposPermitidos.includes(file.type)) {
    return "Use JPG, PNG, WEBP ou SVG";
  }

  if (file.size > 5 * 1024 * 1024) {
    return "A imagem deve ter no máximo 5MB";
  }

  return "";
}

export async function POST(request: Request) {
  const sessao = await obterSessao();
  if (!sessao) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  let connection: ConexaoMySQL | undefined;
  try {
    connection = await getConnection();
    const permissao = await validarResponsavelClinica(
      connection,
      sessao.id,
      sessao.clinica_id,
    );
    if (!permissao.ok) {
      return Response.json(
        { error: permissao.error },
        { status: permissao.status },
      );
    }

    const formData = await request.formData();
    const tipo = String(formData.get("tipo") || "");
    const arquivo = formData.get("arquivo") as File | null;

    if (!["logo", "favicon"].includes(tipo)) {
      return Response.json(
        { error: "Tipo de identidade inválido" },
        { status: 400 },
      );
    }

    if (!arquivo) {
      return Response.json({ error: "Arquivo não enviado" }, { status: 400 });
    }

    const erroArquivo = validarArquivo(arquivo);
    if (erroArquivo) {
      return Response.json({ error: erroArquivo }, { status: 400 });
    }

    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const nomeArquivo = `${tipo}-${uuidv4()}${extensaoPorTipo(arquivo.type)}`;
    const pasta = join(
      process.cwd(),
      "public",
      "clinicas",
      String(sessao.clinica_id),
    );
    await mkdir(pasta, { recursive: true });
    await writeFile(join(pasta, nomeArquivo), buffer);

    const url = `/clinicas/${sessao.clinica_id}/${nomeArquivo}`;
    const coluna = tipo === "logo" ? "logo_url" : "favicon_url";

    const [resultado] = await connection.execute<ResultSetHeader>(
      `UPDATE clinicas SET ${coluna} = ? WHERE id = ?`,
      [url, sessao.clinica_id],
    );

    if (resultado.affectedRows === 0) {
      return Response.json(
        { error: "Clínica não encontrada" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      message: `${tipo === "logo" ? "Logo" : "Favicon"} atualizado com sucesso`,
      [`${coluna}`]: url,
    });
  } catch (error) {
    console.error("Erro ao atualizar identidade visual:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

export async function DELETE(request: Request) {
  const sessao = await obterSessao();
  if (!sessao) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  let connection: ConexaoMySQL | undefined;
  try {
    connection = await getConnection();
    const permissao = await validarResponsavelClinica(
      connection,
      sessao.id,
      sessao.clinica_id,
    );
    if (!permissao.ok) {
      return Response.json(
        { error: permissao.error },
        { status: permissao.status },
      );
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");
    if (!["logo", "favicon"].includes(tipo || "")) {
      return Response.json(
        { error: "Tipo de identidade inválido" },
        { status: 400 },
      );
    }

    const coluna = tipo === "logo" ? "logo_url" : "favicon_url";
    const [resultado] = await connection.execute<ResultSetHeader>(
      `UPDATE clinicas SET ${coluna} = NULL WHERE id = ?`,
      [sessao.clinica_id],
    );

    if (resultado.affectedRows === 0) {
      return Response.json(
        { error: "Clínica não encontrada" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      message: `${tipo === "logo" ? "Logo" : "Favicon"} removido com sucesso`,
    });
  } catch (error) {
    console.error("Erro ao remover identidade visual:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

