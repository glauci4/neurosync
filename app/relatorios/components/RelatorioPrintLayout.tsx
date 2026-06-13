"use client";

import Image from "next/image";
import type { ClinicaData } from "@/app/configuracoes/clinica/types";
import type { RelatorioPdfUsuario } from "../pdf/RelatorioPDFDocument";
import type {
  FiltrosRelatorios,
  RelatorioPrintConfig,
} from "../types/relatorios.types";

interface RelatorioPrintLayoutProps {
  relatorio: RelatorioPrintConfig | null;
  clinica?: ClinicaData | null;
  filtros: FiltrosRelatorios;
  usuario?: RelatorioPdfUsuario;
  usuarioNome?: string;
}

function formatarData(valor?: string | null) {
  if (!valor) return "";
  const data = new Date(`${String(valor).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(data.getTime())) return String(valor);
  return new Intl.DateTimeFormat("pt-BR").format(data);
}

function periodoTexto(filtros: FiltrosRelatorios) {
  if (filtros.data_inicio && filtros.data_fim) {
    return `${formatarData(filtros.data_inicio)} a ${formatarData(filtros.data_fim)}`;
  }

  if (filtros.data_inicio)
    return `A partir de ${formatarData(filtros.data_inicio)}`;
  if (filtros.data_fim) return `Até ${formatarData(filtros.data_fim)}`;

  return "Todos os registros disponíveis";
}

function enderecoClinica(clinica?: ClinicaData | null) {
  if (!clinica) return "";
  const linha1 = [clinica.endereco, clinica.numero].filter(Boolean).join(", ");
  const linha2 = [clinica.bairro, clinica.cidade, clinica.estado]
    .filter(Boolean)
    .join(" - ");

  return [linha1, linha2].filter(Boolean).join(" · ");
}

function ehResumoOperacional(secao: { titulo: string; colunas: string[] }) {
  const colunas = secao.colunas.map((coluna) => coluna.toLowerCase());
  return (
    secao.titulo.toLowerCase().includes("resumo") ||
    (colunas.length === 2 &&
      colunas.includes("indicador") &&
      colunas.includes("valor"))
  );
}

export default function RelatorioPrintLayout({
  relatorio,
  clinica,
  filtros,
  usuario,
  usuarioNome,
}: RelatorioPrintLayoutProps) {
  if (!relatorio) return null;

  const emitidoEm = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());
  const nomeClinica =
    clinica?.nome_fantasia || clinica?.razao_social || "Clínica NeuroSync";
  const emissorNome = usuario?.nome || usuarioNome || "Usuário NeuroSync";
  const emissorCrp = usuario?.crp || null;

  return (
    <div className="hidden print:block">
      <div className="bg-white p-8 font-sans text-gray-800">
        <header className="border-b border-[#E1D4F0] pb-5">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-[#E1D4F0] bg-[#F3EAF8] text-lg font-semibold text-[#9F64AF]">
                {clinica?.logo_url ? (
                  <Image
                    src={clinica.logo_url}
                    alt={`Logo ${nomeClinica}`}
                    width={64}
                    height={64}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  nomeClinica.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {nomeClinica}
                </h1>
                <p className="text-sm text-gray-600">
                  {clinica?.razao_social || nomeClinica}
                </p>
                <p className="text-xs text-gray-500">
                  CNPJ: {clinica?.cnpj || "Não informado"}
                </p>
                {enderecoClinica(clinica) ? (
                  <p className="mt-1 text-xs text-gray-500">
                    {enderecoClinica(clinica)}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <section className="py-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9F64AF]">
            Relatório
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-gray-900">
            {relatorio.titulo}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Período filtrado: {periodoTexto(filtros)}
          </p>
        </section>

        <main className="space-y-6">
          {relatorio.secoes.map((secao) => (
            <section key={secao.titulo} className="break-inside-avoid">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                {secao.titulo}
              </h3>
              {secao.linhas.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                  Nenhum dado encontrado para os filtros aplicados.
                </div>
              ) : ehResumoOperacional(secao) ? (
                <div className="grid grid-cols-2 gap-3">
                  {secao.linhas.map((linha, index) => {
                    const colunas = Object.keys(linha);
                    const label =
                      typeof linha.label === "string"
                        ? linha.label
                        : colunas[0];
                    const valorFonte =
                      typeof linha.valor !== "undefined"
                        ? linha.valor
                        : (linha[colunas[1]] ?? linha[colunas[0]] ?? "-");
                    const valor = String(valorFonte);

                    return (
                      <div
                        key={`${secao.titulo}-${index}`}
                        className="rounded-xl border border-[#E1D4F0] bg-[#FBF7FF] p-3"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6F3D7D]">
                          {label}
                        </p>
                        <p className="mt-1 text-base font-semibold text-gray-900">
                          {valor}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-[#F3EAF8] text-[#6F3D7D]">
                      {secao.colunas.map((coluna) => (
                        <th
                          key={coluna}
                          className="border border-[#E1D4F0] px-3 py-2 font-semibold"
                        >
                          {coluna}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {secao.linhas.map((linha, index) => (
                      <tr key={`${secao.titulo}-${index}`}>
                        {secao.colunas.map((coluna) => (
                          <td
                            key={coluna}
                            className="border border-gray-200 px-3 py-2 text-gray-700"
                          >
                            {linha[coluna] || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          ))}
        </main>

        <footer className="mt-8 border-t border-[#E1D4F0] pt-4 text-xs text-gray-500">
          <div className="flex items-center justify-between gap-4">
            <span>Documento gerado pelo NeuroSync</span>
            <span className="text-right">
              Emitido em {emitidoEm} por {emissorNome}
              {emissorCrp ? ` · CRP ${emissorCrp}` : ""}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

