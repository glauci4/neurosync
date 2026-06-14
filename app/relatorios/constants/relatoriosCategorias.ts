import {
  BarChart3,
  Calendar,
  DoorOpen,
  type LucideIcon,
  Users,
} from "lucide-react";
import type { CategoriaRelatorio } from "../types/relatorios.types";

export interface ConfigRelatorioCategoria {
  key: CategoriaRelatorio;
  labelSidebar: string;
  titulo: string;
  descricao: string;
  icone: LucideIcon;
}

export const RELATORIOS_CATEGORIAS_CONFIG: ConfigRelatorioCategoria[] = [
  {
    key: "visao_geral",
    labelSidebar: "Relatório Geral",
    titulo: "Relatórios",
    descricao:
      "Painel executivo para acompanhar operação, produtividade e indicadores clínicos da clínica.",
    icone: BarChart3,
  },
  {
    key: "agenda",
    labelSidebar: "Relatório da Agenda",
    titulo: "Relatório da Agenda",
    descricao:
      "Acompanhe consultas, agendamentos futuros, status e movimentações da agenda.",
    icone: Calendar,
  },
  {
    key: "pacientes",
    labelSidebar: "Relatório de Pacientes",
    titulo: "Relatório de Pacientes",
    descricao:
      "Visualize pacientes ativos, inativos, em espera, em atendimento e acompanhamentos encerrados.",
    icone: Users,
  },
  {
    key: "salas",
    labelSidebar: "Relatório de Salas",
    titulo: "Relatório de Salas",
    descricao:
      "Analise ocupação das salas, horários utilizados e distribuição dos atendimentos.",
    icone: DoorOpen,
  },
];

export function obterConfigRelatorio(categoria: CategoriaRelatorio) {
  return (
    RELATORIOS_CATEGORIAS_CONFIG.find((item) => item.key === categoria) ||
    RELATORIOS_CATEGORIAS_CONFIG[0]
  );
}
