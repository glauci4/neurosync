"use client";

import { PencilLine } from "lucide-react";
import Image from "next/image";
import type { IconType } from "react-icons";
import { CiHospital1 } from "react-icons/ci";

interface LogoClinicaProps {
  logoUrl?: string | null;
  nome?: string | null;
  onClickEditar?: () => void;
  podeEditar?: boolean;
  IconeFallback?: IconType;
}

export default function LogoClinica({
  logoUrl,
  nome,
  onClickEditar,
  podeEditar = true,
  IconeFallback = CiHospital1,
}: LogoClinicaProps) {
  const nomeAcessivel = nome?.trim() || "clínica";
  const conteudo = (
    <>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={`Logo da ${nomeAcessivel}`}
          fill
          sizes="112px"
          className="object-cover"
          priority
        />
      ) : (
        <IconeFallback size={48} color="#9F64AF" aria-hidden="true" />
      )}

      {podeEditar ? (
        <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus:opacity-100">
          <PencilLine size={22} className="text-white" aria-hidden="true" />
        </span>
      ) : null}
    </>
  );

  if (!podeEditar) {
    return (
      <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#9F64AF]/25 bg-[#F3EAF8] text-[#9F64AF] shadow-md">
        {conteudo}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClickEditar}
      title="Editar informações da clínica"
      aria-label="Editar informações da clínica"
      className="group relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#9F64AF]/25 bg-[#F3EAF8] text-[#9F64AF] shadow-md outline-none transition hover:shadow-lg focus:ring-2 focus:ring-[#9F64AF]/35"
    >
      {conteudo}
    </button>
  );
}
