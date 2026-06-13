// app/api/consulta-cnpj/route.ts
// API para consultar dados de CNPJ usando múltiplas fontes.

import { NextResponse } from "next/server";
import { consultarDadosEmpresaPorCnpj } from "./service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cnpj = searchParams.get("cnpj");

    if (!cnpj) {
      return NextResponse.json(
        { error: "CNPJ não informado." },
        { status: 400 },
      );
    }

    const dadosFormatados = await consultarDadosEmpresaPorCnpj(cnpj);
    return NextResponse.json(dadosFormatados);
  } catch (error) {
    const mensagem =
      error instanceof Error ? error.message : "Erro interno do servidor.";

    if (mensagem.startsWith("Formato de CNPJ inválido")) {
      return NextResponse.json({ error: mensagem }, { status: 400 });
    }

    if (mensagem === "CNPJ encontrado mas sem dados cadastrais.") {
      return NextResponse.json(
        {
          error: mensagem,
          sugestao: "O CNPJ pode ser novo ou estar pendente de regularização.",
        },
        { status: 404 },
      );
    }

    if (mensagem.includes("BrasilAPI:") || mensagem.includes("ReceitaWS:")) {
      return NextResponse.json(
        {
          error: "Não foi possível consultar o CNPJ.",
          detalhes: mensagem,
          sugestao:
            "Verifique se o CNPJ está correto ou tente novamente mais tarde.",
        },
        { status: 503 },
      );
    }

    console.error("Erro na consulta de CNPJ:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor.",
        detalhes: mensagem,
      },
      { status: 500 },
    );
  }
}

