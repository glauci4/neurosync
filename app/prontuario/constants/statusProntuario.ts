import {
  FileCheck,
  type FileText,
  PencilLine,
  ShieldCheck,
} from "lucide-react";
import type {
  StatusProntuario,
  TipoAtendimentoProntuario,
} from "../types/prontuario";

export const TIPOS_ATENDIMENTO: Array<{
  valor: TipoAtendimentoProntuario;
  label: string;
}> = [
  { valor: "triagem", label: "Triagem" },
  { valor: "psicoterapia", label: "Psicoterapia" },
  { valor: "devolutiva", label: "Devolutiva" },
  { valor: "avaliacao", label: "Avaliação" },
  { valor: "orientacao", label: "Orientação" },
  { valor: "retorno", label: "Retorno" },
  { valor: "alta", label: "Alta" },
  { valor: "outro", label: "Outro" },
];

export const STATUS_CONFIG: Record<
  StatusProntuario,
  { label: string; classe: string; icone: typeof FileText }
> = {
  // Badges de status diferenciam rascunho, finalização e assinatura clínica.
  rascunho: {
    label: "Rascunho",
    classe: "border-amber-100 bg-amber-50 text-amber-700",
    icone: PencilLine,
  },
  finalizado: {
    label: "Finalizado",
    classe: "border-[#D9BCE8] bg-[#F3EAF8] text-[#5F2D6D]",
    icone: FileCheck,
  },
  assinado: {
    label: "Assinado",
    classe: "border-emerald-100 bg-emerald-50 text-emerald-700",
    icone: ShieldCheck,
  },
};
