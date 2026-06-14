"use client";

import { Mail } from "lucide-react";
import { LiaUserSolid, LiaUserTieSolid } from "react-icons/lia";
import { PiClockUserBold } from "react-icons/pi";
import { TbCalendarUser } from "react-icons/tb";
import type { PerfilData } from "../../types";

function formatarData(data?: string | null) {
  if (!data) return "Não informado";
  const date = new Date(data);
  if (Number.isNaN(date.getTime())) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function perfilLabel(perfil: PerfilData) {
  return perfil.perfil_id === 2 ? "Psicólogo(a)" : "Secretária";
}

function CampoConta({
  icone,
  label,
  valor,
}: {
  icone: React.ReactNode;
  label: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white/70 px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
        {icone}
        {label}
      </div>
      <p className="mt-1 truncate text-sm font-medium text-gray-800">{valor}</p>
    </div>
  );
}

export default function CardContaAcesso({ perfil }: { perfil: PerfilData }) {
  const isPsicologo = perfil.perfil_id === 2;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Conta e acesso</h3>
        <p className="mt-1 text-xs text-gray-500">
          Dados atuais usados para autenticação no NeuroSync.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <CampoConta
          icone={<Mail size={14} />}
          label="E-mail atual"
          valor={perfil.email}
        />
        <CampoConta
          icone={
            isPsicologo ? (
              <LiaUserTieSolid size={15} />
            ) : (
              <LiaUserSolid size={15} />
            )
          }
          label="Perfil atual"
          valor={perfilLabel(perfil)}
        />
        <CampoConta
          icone={<TbCalendarUser size={15} />}
          label="Data de criação"
          valor={formatarData(perfil.criado_em)}
        />
        <CampoConta
          icone={<PiClockUserBold size={15} />}
          label="Último acesso"
          valor={formatarData(perfil.ultimo_acesso)}
        />
      </div>
    </section>
  );
}
