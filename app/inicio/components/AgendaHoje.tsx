// app/inicio/components/AgendaHoje.tsx
// Lista compacta das consultas do dia em formato operacional.

"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Calendar,
  CalendarCheck2,
  CalendarClock,
  CalendarOff,
  CalendarX2,
  CheckCircle2,
  Clock3,
  DoorOpen,
  User,
} from "lucide-react";
import { LiaUserTieSolid } from "react-icons/lia";
import type { Consulta, StatusConsultaInicio } from "../types";

interface AgendaHojeProps {
  consultas: Consulta[];
  mostrarPsicologo?: boolean;
  mensagemVazia?: string;
}

const statusConfig: Record<
  StatusConsultaInicio,
  {
    cor: string;
    texto: string;
    icone: LucideIcon;
  }
> = {
  agendado: {
    cor: "border-[#D9BCE8] bg-[#F3EAF8] text-[#5F2D6D]",
    texto: "Agendado",
    icone: CalendarCheck2,
  },
  em_andamento: {
    cor: "border-emerald-200 bg-emerald-50 text-emerald-700",
    texto: "Em andamento",
    icone: Clock3,
  },
  concluido: {
    cor: "border-slate-200 bg-slate-100 text-slate-600",
    texto: "Concluído",
    icone: CheckCircle2,
  },
  pendente: {
    cor: "border-red-200 bg-red-50 text-red-700",
    texto: "Pendente",
    icone: AlertCircle,
  },
  cancelado: {
    cor: "border-red-200 bg-red-50 text-red-700",
    texto: "Cancelado",
    icone: CalendarX2,
  },
  falta: {
    cor: "border-orange-200 bg-orange-50 text-orange-700",
    texto: "Falta",
    icone: CalendarOff,
  },
  remarcado: {
    cor: "border-[#CBC5FF] bg-[#ECE9FF] text-[#433082]",
    texto: "Remarcado",
    icone: CalendarClock,
  },
};

function capitalizarTipoAtendimento(tipo: string) {
  const texto = (tipo || "").trim();
  if (!texto) return "Atendimento";

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function AgendaHoje({
  consultas,
  mostrarPsicologo = false,
  mensagemVazia = "Nenhuma consulta agendada para hoje.",
}: AgendaHojeProps) {
  const hoje = new Date();
  const dataFormatada = hoje.toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08 }}
      className="overflow-hidden rounded-2xl border border-[#E1D4F0] bg-white/90 shadow-sm backdrop-blur-sm"
    >
      {/* Cabeçalho */}
      <div className="border-b border-[#E1D4F0] px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Consultas de hoje
              </h2>
              <p className="mt-1 text-sm text-gray-500 capitalize">
                {dataFormatada}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#E1D4F0] bg-[#F8F3FB] px-3 py-1 text-xs font-medium text-[#5F2D6D]">
              {consultas.length}{" "}
              {consultas.length === 1 ? "consulta" : "consultas"}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Atendimentos programados para hoje.
          </p>
        </div>
      </div>

      {consultas.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-7 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F3EAF8] text-[#9F64AF]">
            <Calendar size={24} />
          </div>
          <p className="text-sm text-gray-500">{mensagemVazia}</p>
        </div>
      ) : (
        <div className="space-y-2 px-3 py-2.5 sm:px-4 sm:py-3">
          {consultas.map((consulta, index) => {
            const config = statusConfig[consulta.status];
            const IconeStatus = config.icone;

            return (
              <motion.article
                key={consulta.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
                className={`rounded-2xl border bg-white px-3.5 py-2 shadow-sm transition hover:shadow-md ${
                  consulta.status === "pendente"
                    ? "border-red-200 bg-red-50 hover:border-red-300"
                    : "border-[#E1D4F0] hover:border-[#CFA8DF]"
                }`}
              >
                {/* Layout principal: horário | conteúdo | status */}
                <div className="flex items-start gap-3">
                  {/* Bloco do horário */}
                  <div className="flex shrink-0 items-center gap-1 rounded-xl bg-[#F8F3FB] px-2.5 py-1 text-[#5F2D6D]">
                    <Clock3 size={13} />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                      {consulta.horario}
                      {consulta.horarioFim
                        ? ` • ${consulta.horarioFim.slice(0, 5)}`
                        : ""}
                    </span>
                  </div>

                  {/* Conteúdo central */}
                  <div className="min-w-0 flex-1">
                    {/* Linha 1: Nome do paciente */}
                    <div className="flex items-center gap-1.5">
                      <User size={14} className="shrink-0 text-gray-400" />
                      <span className="truncate text-sm font-semibold text-gray-800">
                        {consulta.paciente}
                      </span>
                    </div>

                    {/* Linha 2: Psicólogo (se mostrado), sala e tipo de atendimento */}
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      {mostrarPsicologo && consulta.psicologo ? (
                        <span className="flex items-center gap-1">
                          <LiaUserTieSolid size={12} className="shrink-0" />
                          <span className="truncate">{consulta.psicologo}</span>
                        </span>
                      ) : null}
                      <span className="flex items-center gap-1">
                        <DoorOpen size={12} className="shrink-0" />
                        <span className="truncate">{consulta.sala}</span>
                      </span>
                      <span className="rounded-full bg-[#F8F3FB] px-2.5 py-0.5 text-[11px] font-medium text-[#5F2D6D]">
                        {capitalizarTipoAtendimento(consulta.tipoAtendimento)}
                      </span>
                    </div>
                  </div>

                  {/* Status alinhado à direita */}
                  <div className="flex shrink-0 items-center self-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${config.cor}`}
                    >
                      {consulta.status === "em_andamento" && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      )}
                      <IconeStatus size={12} />
                      {config.texto}
                    </span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </motion.section>
  );
}
