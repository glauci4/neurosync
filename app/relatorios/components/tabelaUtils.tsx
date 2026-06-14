import type { ReactNode } from "react";

type BadgeVariant =
  | "lilas"
  | "verde"
  | "cinza"
  | "vermelho"
  | "amarelo"
  | "azul";

export function formatarData(valor?: string | null) {
  if (!valor) return "-";
  const data = new Date(`${String(valor).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(data.getTime())) return String(valor);
  return new Intl.DateTimeFormat("pt-BR").format(data);
}

export function horaCurta(valor?: string | null) {
  return String(valor || "").slice(0, 5) || "-";
}

export function formatarTelefone(valor?: string | null) {
  const numeros = String(valor || "").replace(/\D/g, "");
  if (numeros.length === 11) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  }
  if (numeros.length === 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }
  return valor || "-";
}

export function Badge({
  children,
  variant = "lilas",
}: {
  children: ReactNode;
  variant?: BadgeVariant;
}) {
  const classes = {
    lilas: "border-[#D9BCE8] bg-[#F3E8F7] text-[#5F2D6D] hover:bg-[#EADCF2]",
    verde: "border-[#B8E1C7] bg-[#EAF8F0] text-[#2F7A4E] hover:bg-[#DDF2E6]",
    cinza: "border-[#D9E1EB] bg-[#EEF1F5] text-[#64748B] hover:bg-[#E6EAF0]",
    vermelho: "border-[#F4B8BE] bg-[#FEECEC] text-[#9F2F36] hover:bg-[#FBDDE1]",
    amarelo: "border-[#F4C98E] bg-[#FFF3E6] text-[#9A5A17] hover:bg-[#FFE8C7]",
    azul: "border-[#CBC5FF] bg-[#ECE9FF] text-[#433082] hover:bg-[#E1DCFF]",
  };

  return (
    <span
      className={`inline-flex min-w-[86px] justify-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold leading-4 ${classes[variant]}`}
    >
      {children}
    </span>
  );
}

export function labelStatusConsulta(status: string) {
  const labels: Record<string, string> = {
    agendado: "Agendado",
    remarcado: "Remarcado",
    cancelado: "Cancelado",
    falta: "Falta",
    concluido: "Concluído",
  };

  return labels[status] || status.replaceAll("_", " ");
}

export function varianteStatusConsulta(status: string): BadgeVariant {
  const variantes: Record<string, BadgeVariant> = {
    agendado: "lilas",
    remarcado: "azul",
    cancelado: "vermelho",
    falta: "amarelo",
    concluido: "verde",
  };

  return variantes[status] || "cinza";
}
