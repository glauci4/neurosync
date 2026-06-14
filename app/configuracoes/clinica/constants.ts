import type { LucideIcon } from "lucide-react";
import {
  BadgeInfo,
  FileSignature,
  LayoutDashboard,
  Phone,
  Shield,
  WandSparkles,
} from "lucide-react";

export interface SecaoClinicaConfig {
  chave:
    | "dados"
    | "contato"
    | "endereco"
    | "identidade"
    | "responsavel"
    | "internas";
  titulo: string;
  descricao: string;
  icone: LucideIcon;
}

export const SECOES_CLINICA: SecaoClinicaConfig[] = [
  {
    chave: "dados",
    titulo: "Dados institucionais",
    descricao: "Identificação principal da clínica e dados cadastrais.",
    icone: LayoutDashboard,
  },
  {
    chave: "contato",
    titulo: "Contato",
    descricao: "Canais oficiais de atendimento e presença digital.",
    icone: Phone,
  },
  {
    chave: "endereco",
    titulo: "Endereço",
    descricao: "Localização física com preenchimento automatizado por CEP.",
    icone: BadgeInfo,
  },
  {
    chave: "identidade",
    titulo: "Identidade visual",
    descricao: "Logo, favicon e identidade institucional do sistema.",
    icone: WandSparkles,
  },
  {
    chave: "responsavel",
    titulo: "Responsável técnico",
    descricao: "Dados do psicólogo responsável e assinatura clínica.",
    icone: FileSignature,
  },
  {
    chave: "internas",
    titulo: "Configurações internas",
    descricao: "Regras operacionais e permissões clínicas da unidade.",
    icone: Shield,
  },
];

export const RESUMO_ROTULOS = [
  "Campos preenchidos",
  "Contato ativo",
  "Identidade pronta",
  "Responsável completo",
] as const;

export const CARGOS_RESPONSAVEL_TECNICO = [
  "Responsável técnico",
  "Coordenador clínico",
  "Diretor técnico",
  "Psicólogo responsável",
] as const;

export const CONFIGURACOES_PADRAO = {
  permitir_multiplos_psicologos: true,
  permitir_compartilhamento_prontuario: true,
  exigir_assinatura_evolucoes: true,
  bloquear_edicao_apos_assinatura: true,
  tempo_maximo_edicao_evolucao: 30,
  habilitar_auditoria_clinica: true,
} as const;
