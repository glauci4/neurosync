// app/api/upload/avatar/route.ts
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

// Função agora é async e usa await cookies()
async function obterUsuarioDoCookie(): Promise<{ id: number } | null> {
  const cookieStore = await cookies(); // <-- aguardamos a Promise
  const sessionCookie = cookieStore.get("usuario_neurosync");
  if (!sessionCookie) return null;
  try {
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
}

const TAMANHO_MAXIMO = 5 * 1024 * 1024; // 5 MB
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png"];

export async function POST(request: Request) {
  const sessao = await obterUsuarioDoCookie(); // <-- agora com await
  if (!sessao) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

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
        { error: "Tipo de arquivo não permitido. Use JPG ou PNG." },
        { status: 400 },
      );
    }

    if (file.size > TAMANHO_MAXIMO) {
      return Response.json(
        { error: "O arquivo deve ter no máximo 5MB." },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const extensao = file.type === "image/png" ? ".png" : ".jpg";
    const nomeArquivo = `${uuidv4()}${extensao}`;
    const caminhoPublico = join(
      process.cwd(),
      "public",
      "avatars",
      nomeArquivo,
    );

    await mkdir(join(process.cwd(), "public", "avatars"), {
      recursive: true,
    });
    await writeFile(caminhoPublico, buffer);

    const url = `/avatars/${nomeArquivo}`;
    return Response.json({ success: true, url });
  } catch (error) {
    console.error("Erro no upload:", error);
    return Response.json(
      { error: "Erro ao processar o upload" },
      { status: 500 },
    );
  }
}

