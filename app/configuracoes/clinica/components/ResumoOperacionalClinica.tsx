"use client";

import { motion } from "framer-motion";
import { Settings2 } from "lucide-react";
import { RESUMO_ROTULOS } from "../constants";
import type { ResumoOperacionalClinica as ResumoOperacionalClinicaTipo } from "../types";

interface ResumoOperacionalClinicaProps {
  resumo: ResumoOperacionalClinicaTipo;
}

const valores = [
  "camposPreenchidos",
  "contatoAtivo",
  "identidadePronta",
  "responsavelCompleto",
] as const;

export default function ResumoOperacionalClinica({
  resumo,
}: ResumoOperacionalClinicaProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#9F64AF]/20 bg-white/80 p-6 shadow-sm backdrop-blur-sm"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#9F64AF]">
          <Settings2
            size={20}
            className="animate-spin [animation-duration:6s]"
          />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            Resumo operacional
          </h3>
          <p className="text-xs text-gray-500">
            Panorama rápido da estrutura institucional da clínica.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {valores.map((chave, indice) => (
          <div key={chave} className="space-y-1">
            <p className="text-xs font-medium text-gray-500">
              {RESUMO_ROTULOS[indice]}
            </p>
            <p className="text-2xl font-semibold text-[#9F64AF]">
              {resumo[chave]}
            </p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

