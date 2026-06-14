"use client";

import { RxGear } from "react-icons/rx";

interface ResumoProntuarioProps {
  evolucoesHoje: number;
  pacientesAcompanhamento: number;
  pendentesAssinatura: number;
  assinadasSemana: number;
  ultimaEvolucao: string;
}

export function ResumoProntuario({
  resumo,
}: {
  resumo: ResumoProntuarioProps;
}) {
  return (
    <section className="mt-4 rounded-2xl border border-[#9F64AF]/20 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <RxGear size={16} className="animate-spin text-[#9F64AF]" />
        <h2 className="text-sm font-semibold text-gray-800">
          Resumo operacional
        </h2>
      </div>

      <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
        <div className="flex min-w-0 flex-col">
          <span className="text-xs text-gray-500">Registros hoje</span>
          <span className="font-semibold text-gray-800">
            {resumo.evolucoesHoje}
          </span>
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-xs text-gray-500">
            Pacientes em acompanhamento
          </span>
          <span className="font-semibold text-gray-800">
            {resumo.pacientesAcompanhamento}
          </span>
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-xs text-gray-500">Pendentes de assinatura</span>
          <span className="font-semibold text-gray-800">
            {resumo.pendentesAssinatura}
          </span>
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-xs text-gray-500">Registros assinados</span>
          <span className="font-semibold text-gray-800">
            {resumo.assinadasSemana}
          </span>
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-xs text-gray-500">Último registro clínico</span>
          <span className="truncate font-semibold text-gray-800">
            {resumo.ultimaEvolucao}
          </span>
        </div>
      </div>
    </section>
  );
}
