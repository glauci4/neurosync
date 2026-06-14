import { pdf } from "@react-pdf/renderer";
import React from "react";
import type { RegistroClinico } from "../hooks/useProntuario";
import RegistroClinicoPDFDocument from "./RegistroClinicoPDFDocument";

function nomeArquivo(registro: RegistroClinico) {
  const slug = registro.paciente_nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `registro-clinico-${slug || registro.id}.pdf`;
}

export async function gerarRegistroClinicoPdf(registro: RegistroClinico) {
  const documento = React.createElement(RegistroClinicoPDFDocument, {
    registro,
  });
  const gerarPdf = pdf as unknown as (doc: React.ReactElement) => {
    toBlob: () => Promise<Blob>;
  };
  const blob = await gerarPdf(documento).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo(registro);
  link.rel = "noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
