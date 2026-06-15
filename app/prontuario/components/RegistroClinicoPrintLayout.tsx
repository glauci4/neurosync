"use client";

import type { RegistroClinico } from "../hooks/useProntuario";

interface RegistroClinicoPrintLayoutProps {
  registro: RegistroClinico | null;
}

const TIPOS_ATENDIMENTO: Record<string, string> = {
  triagem: "Triagem",
  psicoterapia: "Psicoterapia",
  devolutiva: "Devolutiva",
  avaliacao: "Avaliação",
  orientacao: "Orientação",
  retorno: "Retorno",
  alta: "Alta",
  outro: "Outro",
};

function dataPtBr(valor?: string | null) {
  if (!valor) return "";
  const data = new Date(`${String(valor).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(data.getTime())) return String(valor);
  return new Intl.DateTimeFormat("pt-BR").format(data);
}

function horaPtBr(valor?: string | null) {
  if (!valor) return "";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return String(valor);
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}

function tipoAtendimentoLabel(tipo: string) {
  return TIPOS_ATENDIMENTO[tipo] || tipo;
}

export default function RegistroClinicoPrintLayout({
  registro,
}: RegistroClinicoPrintLayoutProps) {
  if (!registro) return null;

  const assinado = registro.status === "assinado";
  const conteudo = registro.conteudo || "";
  const assinaturaData = assinado ? dataPtBr(registro.assinado_em) : "";
  const assinaturaHora = assinado ? horaPtBr(registro.assinado_em) : "";

  return (
    <div className="hidden print:block">
      <div className="flex min-h-screen flex-col bg-white p-8 font-sans text-gray-800">
        <header>
          <h1 className="text-xl font-semibold text-gray-900">
            Registro clínico
          </h1>
          <div className="mt-3 space-y-1 text-sm text-gray-700">
            <p>Paciente: {registro.paciente_nome}</p>
            <p>Data: {dataPtBr(registro.data_registro)}</p>
            <p>
              Tipo de atendimento: {tipoAtendimentoLabel(registro.tipo_atendimento)}
            </p>
          </div>
        </header>

        <div className="mt-4 h-px w-[40%] bg-[#D4C5DF]" />

        <main className="flex-1 py-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#9F64AF]">
            Conteúdo do registro clínico
          </p>
          <style>{`
            .registro-clinico-print-conteudo p {
              margin: 0 0 10px;
              font-size: 14px;
              line-height: 1.7;
              color: #1f2937;
            }
            .registro-clinico-print-conteudo p:last-child {
              margin-bottom: 0;
            }
            .registro-clinico-print-conteudo strong,
            .registro-clinico-print-conteudo b {
              font-weight: 700;
            }
            .registro-clinico-print-conteudo em,
            .registro-clinico-print-conteudo i {
              font-style: italic;
            }
            .registro-clinico-print-conteudo u {
              text-decoration: underline;
            }
            .registro-clinico-print-conteudo mark {
              background: #fff3b0;
              color: inherit;
              padding: 0 2px;
            }
            .registro-clinico-print-conteudo ul,
            .registro-clinico-print-conteudo ol {
              margin: 0 0 10px 22px;
              padding: 0;
            }
            .registro-clinico-print-conteudo li {
              margin: 0 0 4px;
              font-size: 14px;
              line-height: 1.7;
              color: #1f2937;
            }
            @media print {
              .registro-clinico-print-conteudo {
                display: block !important;
              }
            }
          `}</style>
          <div
            className="registro-clinico-print-conteudo text-sm leading-7 text-gray-800"
            dangerouslySetInnerHTML={{
              __html: conteudo || "<p>Rascunho sem conteúdo registrado.</p>",
            }}
          />
        </main>

        {assinado ? (
          <footer className="mt-8 pt-6 text-right">
            <div className="ml-auto w-full max-w-[360px]">
              {registro.assinatura_url ? (
                <img
                  src={registro.assinatura_url}
                  alt="Assinatura profissional"
                  className="ml-auto mb-3 h-auto max-h-[110px] w-auto object-contain"
                />
              ) : null}
              <div className="ml-auto mb-3 h-px w-56 bg-[#D4C5DF]" />
              <p className="text-sm font-semibold text-gray-900">
                {registro.psicologo_nome}
              </p>
              {registro.crp ? (
                <p className="mt-1 text-xs text-gray-600">CRP {registro.crp}</p>
              ) : null}
              <p className="mt-3 text-xs leading-5 text-gray-600">
                Assinado digitalmente em {assinaturaData}
                {assinaturaHora ? ` às ${assinaturaHora}` : ""}
              </p>
            </div>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
