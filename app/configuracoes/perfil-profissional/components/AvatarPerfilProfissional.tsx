"use client";

import { PencilLine } from "lucide-react";
import Image from "next/image";

interface AvatarPerfilProfissionalProps {
  fotoUrl?: string | null;
  nomeUsuario?: string | null;
  tipoUsuario?: string | null;
  onClickEditar: () => void;
}

export default function AvatarPerfilProfissional({
  fotoUrl,
  nomeUsuario,
  tipoUsuario,
  onClickEditar,
}: AvatarPerfilProfissionalProps) {
  const nomeAcessivel = nomeUsuario?.trim() || tipoUsuario?.trim() || "usuário";
  const inicial = nomeUsuario?.trim()?.charAt(0).toLocaleUpperCase("pt-BR");

  return (
    <button
      type="button"
      onClick={onClickEditar}
      title="Alterar foto do perfil"
      aria-label="Alterar foto do perfil"
      className="group relative flex h-28 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-[#9F64AF]/25 bg-[#F3EAF8] text-[#9F64AF] shadow-md outline-none transition hover:shadow-lg focus:ring-2 focus:ring-[#9F64AF]/35"
    >
      {fotoUrl ? (
        <Image
          src={fotoUrl}
          alt={`Foto de ${nomeAcessivel}`}
          fill
          sizes="112px"
          className="object-cover"
          priority
        />
      ) : (
        <span className="text-4xl font-semibold leading-none text-[#9F64AF]">
          {inicial || "?"}
        </span>
      )}

      <span className="absolute inset-0 rounded-full bg-black/0 transition-colors duration-200 group-hover:bg-black/45 group-focus:bg-black/45" />
      <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus:opacity-100">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-[1px]">
          <PencilLine size={18} aria-hidden="true" />
        </span>
      </span>
    </button>
  );
}
