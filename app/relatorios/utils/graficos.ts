import type { ReactNode } from "react";

export const CORES_RELATORIOS = {
  roxo: "#9F64AF",
  roxoSecundario: "#B77AC7",
  roxoClaro: "#E1D4F0",
  roxoMuitoClaro: "#F8F3FB",
  texto: "#5F2D6D",
  textoSecundario: "#6B7280",
  borda: "#E8DBF2",
} as const;

export function calcularMaximoEscala(
  valores: Array<number | null | undefined>,
  margem = 0.25,
  minimo = 3,
) {
  const maximo = Math.max(
    0,
    ...valores.map((valor) => Number(valor || 0)).filter(Number.isFinite),
  );

  if (maximo <= 0) return minimo;

  const base = maximo + Math.max(0.5, maximo * margem);
  return Math.max(minimo, Math.ceil(base));
}

export function formatarNumero(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(valor);
}

export function formatarPercentual(valor: number) {
  return `${formatarNumero(valor)}%`;
}

export function formatarHoras(valor: number) {
  return `${formatarNumero(valor)}h`;
}

export function classeBadgeStatus(
  cor: "lilas" | "verde" | "cinza" | "vermelho" | "amarelo",
) {
  const classes = {
    lilas: "border-[#D9BCE8] bg-[#F3E8F7] text-[#5F2D6D] hover:bg-[#EADCF2]",
    verde: "border-[#B8E1C7] bg-[#EAF8F0] text-[#2F7A4E] hover:bg-[#DDF2E6]",
    cinza: "border-[#D9E1EB] bg-[#EEF1F5] text-[#64748B] hover:bg-[#E6EAF0]",
    vermelho: "border-[#F4B8BE] bg-[#FEECEC] text-[#9F2F36] hover:bg-[#FBDDE1]",
    amarelo: "border-[#F4C98E] bg-[#FFF3E6] text-[#9A5A17] hover:bg-[#FFE8C7]",
  };

  return classes[cor];
}

export function gerarLabelTooltip(
  titulo?: string,
  detalhes?: Array<{ label: string; valor: ReactNode }>,
) {
  return {
    titulo,
    detalhes,
  };
}

