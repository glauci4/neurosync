"use client";

import {
  obterAgendaStatusConfig,
  obterStatusConsultaExibicao,
} from "@/app/agenda/constants/agendaStatusConfig";
import type { HistoricoConsultasPacientePrintConfig } from "../types/historicoConsultas";

function dataPtBr(valor?: string | null) {
  if (!valor) return "";
  const dataIso = String(valor).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataIso)) {
    const [ano, mes, dia] = dataIso.split("-").map(Number);
    const dataLocal = new Date(ano, mes - 1, dia);
    return new Intl.DateTimeFormat("pt-BR").format(dataLocal);
  }

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return String(valor);
  return new Intl.DateTimeFormat("pt-BR").format(data);
}

function horaPtBr(valor?: string | null) {
  if (!valor) return "";
  return String(valor).slice(0, 5);
}

function tipoAtendimentoLabel(tipo: string, outro?: string | null) {
  if (tipo === "outro" && outro) return outro;
  const mapa: Record<string, string> = {
    triagem: "Triagem",
    psicoterapia: "Psicoterapia",
    devolutiva: "Devolutiva",
    avaliacao: "Avaliação",
    orientacao: "Orientação",
    retorno: "Retorno",
    alta: "Alta",
    outro: "Outro",
  };
  return mapa[tipo] || tipo;
}

export default function HistoricoConsultasPacientePrintLayout({
  pacienteNome,
  consultas,
}: HistoricoConsultasPacientePrintConfig) {
  return (
    <div className="hidden print:block">
      <div className="flex min-h-screen flex-col bg-white p-8 font-sans text-gray-800">
        <header>
          <h1 className="text-xl font-semibold text-gray-900">
            Histórico de consultas
          </h1>
          <p className="mt-3 text-sm text-gray-700">Paciente: {pacienteNome}</p>
        </header>

        <div className="mt-4 h-px w-[42%] bg-[#D4C5DF]" />

        <main className="flex-1 py-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#9F64AF]">
            Histórico detalhado
          </p>
          <div className="space-y-2">
            {consultas.length === 0 ? (
              <p className="text-sm text-gray-500">
                Nenhuma consulta registrada para este paciente.
              </p>
            ) : (
              consultas.map((consulta) => {
                const statusConsulta = obterAgendaStatusConfig(
                  obterStatusConsultaExibicao(consulta),
                );

                return (
                  <article
                    key={consulta.id}
                    className="border-b border-[#E5D9F3] bg-white py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {dataPtBr(consulta.data_consulta)} ·{" "}
                          {horaPtBr(consulta.horario_inicio)} às{" "}
                          {horaPtBr(consulta.horario_fim)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {tipoAtendimentoLabel(
                            consulta.tipo_atendimento,
                            consulta.tipo_outro,
                          )}{" "}
                          · {statusConsulta.texto}
                        </p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <p>{consulta.psicologo_nome || "Não informado"}</p>
                        <p>{consulta.sala_nome || "Sala não informada"}</p>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
