"use client";

import { PiUsersThreeBold } from "react-icons/pi";

interface EmptyUsuariosSistemaProps {
  filtrando: boolean;
}

export default function EmptyUsuariosSistema({
  filtrando,
}: EmptyUsuariosSistemaProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#F3EAF8]">
        <PiUsersThreeBold size={34} className="text-[#9F64AF]" />
      </div>
      <h3 className="mb-2 text-lg font-medium text-gray-800">
        {filtrando
          ? "Nenhum usuário encontrado com os filtros aplicados."
          : "Nenhum usuário cadastrado ainda."}
      </h3>
      <p className="mb-6 max-w-md text-sm text-gray-400">
        {filtrando
          ? "Ajuste a busca ou os filtros para visualizar outros acessos."
          : "Cadastre profissionais para controlar o acesso à clínica no NeuroSync."}
      </p>
    </div>
  );
}
