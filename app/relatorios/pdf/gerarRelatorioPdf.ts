import { type DocumentProps, pdf } from "@react-pdf/renderer";
import React from "react";
import type { ClinicaData } from "@/app/configuracoes/clinica/types";
import type {
  FiltrosRelatorios,
  RelatorioPrintConfig,
} from "../types/relatorios.types";
import RelatorioPDFDocument, {
  type RelatorioPdfUsuario,
} from "./RelatorioPDFDocument";

interface GerarRelatorioPdfParams {
  relatorio: RelatorioPrintConfig;
  clinica?: ClinicaData | null;
  filtros: FiltrosRelatorios;
  usuario: RelatorioPdfUsuario;
}

function dataArquivo() {
  return new Date().toISOString().slice(0, 10);
}

export function obterNomeArquivoRelatorio(titulo: string) {
  const slug =
    titulo
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "relatorio";

  return `relatorio-neurosync-${slug}-${dataArquivo()}.pdf`;
}

function urlAbsoluta(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  if (typeof window === "undefined") return url;
  return `${window.location.origin}${url.startsWith("/") ? url : `/${url}`}`;
}

export async function gerarRelatorioPdf({
  relatorio,
  clinica,
  filtros,
  usuario,
}: GerarRelatorioPdfParams) {
  const blob = await gerarRelatorioPdfBlob({
    relatorio,
    clinica,
    filtros,
    usuario,
  });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = obterNomeArquivoRelatorio(relatorio.titulo);
  link.click();
  URL.revokeObjectURL(url);
}

export async function gerarRelatorioPdfBlob({
  relatorio,
  clinica,
  filtros,
  usuario,
}: GerarRelatorioPdfParams) {
  const clinicaComUrls = clinica
    ? {
        ...clinica,
        logo_url: urlAbsoluta(clinica.logo_url),
      }
    : null;
  const usuarioComUrls = {
    ...usuario,
    assinatura_profissional_url: urlAbsoluta(
      usuario.assinatura_profissional_url,
    ),
  };

  const documento = React.createElement(RelatorioPDFDocument, {
    relatorio,
    clinica: clinicaComUrls,
    filtros,
    usuario: usuarioComUrls,
  }) as unknown as React.ReactElement<DocumentProps>;

  return pdf(documento).toBlob();
}
