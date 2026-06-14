"use client";

import { Phone, UserRoundCheck } from "lucide-react";
import type { PacienteEspera } from "../types/relatorios.types";
import RelatorioEmptyState from "./RelatorioEmptyState";

const skeletonItens = ["paciente-1", "paciente-2", "paciente-3", "paciente-4"];

interface ListaPacientesEsperaProps {
  data?: PacienteEspera[];
  isLoading?: boolean;
}

function formatarTelefone(telefone: string) {
  const numeros = String(telefone || "").replace(/\D/g, "");
  if (numeros.length === 11) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  }
  if (numeros.length === 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }
  return telefone || "-";
}

function formatarCategoria(tipo: string) {
  const normalizado = String(tipo || "").toLowerCase();
  if (normalizado.includes("menor") || normalizado.includes("infantil")) {
    return "Infantil";
  }

  return "Adulto";
}

function diasEmEspera(dataCadastro: string) {
  const data = new Date(`${String(dataCadastro).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(data.getTime())) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.max(
    0,
    Math.floor((hoje.getTime() - data.getTime()) / 86_400_000),
  );
}

export default function ListaPacientesEspera({
  data = [],
  isLoading = false,
}: ListaPacientesEsperaProps) {
  return (
    <section className="flex min-h-[420px] flex-col rounded-2xl border border-[#9F64AF]/15 bg-white/75 p-5 shadow-sm backdrop-blur-sm dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <UserRoundCheck size={17} className="shrink-0 text-[#9F64AF]" />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-[var(--ns-text-primary)]">
              Pacientes em espera
            </h2>
            <p className="text-xs text-gray-500 dark:text-[var(--ns-text-secondary)]">
              Lista ordenada pelos cadastros mais antigos.
            </p>
          </div>
        </div>
        {!isLoading && data.length > 0 ? (
          <span className="shrink-0 rounded-full border border-[#D9BCE8] bg-[#F3E8F7] px-2.5 py-1 text-xs font-semibold text-[#5F2D6D]">
            {data.length}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {skeletonItens.map((item) => (
            <div
              key={item}
              className="h-16 animate-pulse rounded-xl bg-[#F3EAF8] dark:bg-[var(--ns-surface-soft)]"
            />
          ))}
        </div>
      ) : data.length === 0 ? (
        <RelatorioEmptyState
          titulo="Nenhum paciente em espera encontrado"
          mensagem="Não existem registros para os filtros ou período selecionado. Ajuste os filtros ou selecione outro intervalo de datas."
          altura="compacta"
        />
      ) : (
        <div className="relatorios-pacientes-scroll min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {data.slice(0, 8).map((paciente) => (
            <article
              key={paciente.id}
              className="rounded-xl border border-gray-100 bg-white/75 px-4 py-3 transition hover:border-[#9F64AF]/20 hover:bg-[#FAF7FC] dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface-soft)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold leading-snug text-gray-800 dark:text-[var(--ns-text-primary)]">
                      {paciente.nome}
                    </p>
                    <span className="rounded-full border border-[#F4C98E] bg-[#FFF3E6] px-2 py-0.5 text-[11px] font-medium text-[#9A5A17]">
                      {formatarCategoria(paciente.tipo)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-[var(--ns-text-secondary)]">
                    {paciente.idade} anos
                  </p>
                  <p className="mt-1 text-xs font-medium text-[#7B4FA3] dark:text-[var(--ns-text-secondary)]">
                    {(() => {
                      const dias = diasEmEspera(paciente.criado_em);
                      if (dias === null) return "Aguardando início";
                      return dias === 1
                        ? "Aguardando há 1 dia"
                        : `Aguardando há ${dias} dias`;
                    })()}
                  </p>
                  {paciente.psicologo_responsavel_nome ? (
                    <p className="mt-1 line-clamp-1 text-xs text-gray-400 dark:text-[var(--ns-text-secondary)]">
                      Psicólogo responsável:{" "}
                      {paciente.psicologo_responsavel_nome}
                    </p>
                  ) : null}
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-medium text-[#9F64AF]">
                  <Phone size={12} />
                  {formatarTelefone(paciente.telefone)}
                </span>
              </div>
            </article>
          ))}
          <style jsx global>{`
            .relatorios-pacientes-scroll {
              scrollbar-width: thin;
              scrollbar-color: rgba(159, 100, 175, 0.28) transparent;
            }
            .relatorios-pacientes-scroll::-webkit-scrollbar {
              width: 5px;
            }
            .relatorios-pacientes-scroll::-webkit-scrollbar-thumb {
              border-radius: 999px;
              background: rgba(159, 100, 175, 0.28);
            }
          `}</style>
        </div>
      )}
    </section>
  );
}
