"use client";

import { ArchiveRestore, Mail, UserMinus } from "lucide-react";
import Image from "next/image";
import { PiClockUserBold } from "react-icons/pi";
import { TbCalendarUser } from "react-icons/tb";
import type { UsuarioSistema } from "../types/usuariosSistema.types";

interface CardUsuarioSistemaProps {
  usuario: UsuarioSistema;
  usuarioAtualId?: number | null;
  onInativar: (usuario: UsuarioSistema) => void;
  onReativar: (usuario: UsuarioSistema) => void;
  podeGerenciar?: boolean;
}

function formatarData(data?: string | null) {
  if (!data) return "Não informado";
  const date = new Date(data);
  if (Number.isNaN(date.getTime())) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function perfilLabel(usuario: UsuarioSistema) {
  return usuario.perfil_id === 2 ? "Psicólogo" : "Secretária";
}

export default function CardUsuarioSistema({
  usuario,
  usuarioAtualId,
  onInativar,
  onReativar,
  podeGerenciar = true,
}: CardUsuarioSistemaProps) {
  const ativo = Boolean(usuario.ativo);
  const inicial = usuario.nome.trim().charAt(0).toUpperCase() || "U";
  const usuarioAtual = Number(usuarioAtualId || 0) === Number(usuario.id);

  return (
    <div className="group flex flex-col gap-4 rounded-xl border border-gray-100 bg-white/80 p-4 shadow-sm backdrop-blur-sm transition hover:bg-gray-50/60 hover:shadow-md lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3EAF8] text-[#9F64AF]">
            {usuario.avatar_url ? (
              <Image
                src={usuario.avatar_url}
                alt={`Foto de ${usuario.nome}`}
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold">{inicial}</span>
            )}
          </div>
          <h3 className="truncate text-base font-semibold text-gray-800">
            {usuario.nome}
          </h3>
          <span className="rounded-full bg-[#F3E8F7] px-2 py-0.5 text-xs text-[#9F64AF]">
            {perfilLabel(usuario)}
          </span>
          {usuario.isResponsavelClinica ? (
            <span className="rounded-full bg-[#F3EAF8] px-2 py-0.5 text-xs text-[#7E4A8F]">
              Responsável
            </span>
          ) : null}
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              ativo
                ? "bg-green-100 text-green-700"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {ativo ? "Ativo" : "Inativo"}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
          <span className="flex min-w-0 items-center gap-1.5">
            <Mail size={14} className="shrink-0 text-gray-400" />
            <span className="truncate">{usuario.email}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <TbCalendarUser size={15} className="text-gray-400" />
            Criado em {formatarData(usuario.criado_em)}
          </span>
          <span className="flex items-center gap-1.5">
            <PiClockUserBold size={15} className="text-gray-400" />
            Último acesso: {formatarData(usuario.ultimo_acesso)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {ativo ? (
          <button
            type="button"
            onClick={() => onInativar(usuario)}
            disabled={!podeGerenciar}
            title={
              !podeGerenciar
                ? "Apenas o administrador da clínica pode alterar acessos."
                : usuario.isResponsavelClinica
                  ? usuarioAtual
                    ? "Definir novo responsável e inativar usuário"
                    : "Definir novo responsável antes de inativar"
                  : "Inativar usuário"
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-[#9F64AF] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gray-100 disabled:hover:text-gray-700"
          >
            <UserMinus size={14} />
            Inativar
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onReativar(usuario)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-[#9F64AF] hover:text-white"
          >
            <ArchiveRestore size={14} />
            Reativar
          </button>
        )}
      </div>
    </div>
  );
}
