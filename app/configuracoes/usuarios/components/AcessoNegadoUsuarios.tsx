"use client";

import { LockKeyhole } from "lucide-react";

export default function AcessoNegadoUsuarios() {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-gray-100 bg-white/80 p-8 text-center shadow-sm backdrop-blur-sm">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F3EAF8]">
        <LockKeyhole size={28} className="text-[#9F64AF]" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800">Acesso restrito</h3>
      <p className="mt-2 text-sm text-gray-500">
        Esta área é exclusiva para o psicólogo responsável institucional da
        clínica.
      </p>
    </div>
  );
}

