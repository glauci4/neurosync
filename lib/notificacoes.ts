export const TIPOS_NOTIFICACAO = [
  "consulta_5_dias",
  "consulta_24h",
  "consulta_pendente",
  "feriado_30_dias",
  "feriado_7_dias",
  "transferencia_paciente",
  "consulta_remarcada",
  "consulta_cancelada",
  "paciente_sem_responsavel",
] as const;

export type TipoNotificacao = (typeof TIPOS_NOTIFICACAO)[number];
export const CATEGORIAS_NOTIFICACAO = [
  "consulta",
  "feriado",
  "transferencia",
  "pendente",
  "sistema",
] as const;

export type CategoriaNotificacao = (typeof CATEGORIAS_NOTIFICACAO)[number];
export const TIPOS_NOTIFICACAO_CONSULTA = [
  "consulta_5_dias",
  "consulta_24h",
] as const;

export type TipoNotificacaoConsulta =
  (typeof TIPOS_NOTIFICACAO_CONSULTA)[number];

const ROTULOS_TIPO: Record<TipoNotificacao, string> = {
  consulta_5_dias: "Consulta em 5 dias",
  consulta_24h: "Consulta em 24h",
  consulta_pendente: "Consulta pendente",
  feriado_30_dias: "Feriado em 30 dias",
  feriado_7_dias: "Feriado em 7 dias",
  transferencia_paciente: "Transferência de paciente",
  consulta_remarcada: "Consulta remarcada",
  consulta_cancelada: "Consulta cancelada",
  paciente_sem_responsavel: "Paciente sem responsável",
};

export function obterRotuloTipoNotificacao(tipo: string) {
  return ROTULOS_TIPO[tipo as TipoNotificacao] || "Notificação";
}

export function obterTituloNotificacaoConsulta(tipo: TipoNotificacaoConsulta) {
  return ROTULOS_TIPO[tipo];
}

const CATEGORIAS_POR_TIPO: Record<TipoNotificacao, CategoriaNotificacao> = {
  consulta_5_dias: "consulta",
  consulta_24h: "consulta",
  consulta_pendente: "pendente",
  feriado_30_dias: "feriado",
  feriado_7_dias: "feriado",
  transferencia_paciente: "transferencia",
  consulta_remarcada: "consulta",
  consulta_cancelada: "consulta",
  paciente_sem_responsavel: "sistema",
};

const ROTULOS_CATEGORIA: Record<CategoriaNotificacao, string> = {
  consulta: "Consulta",
  feriado: "Feriado",
  transferencia: "Transferência",
  pendente: "Pendente",
  sistema: "Sistema",
};

export function obterCategoriaNotificacao(tipo: string) {
  if (tipo in CATEGORIAS_POR_TIPO) {
    return CATEGORIAS_POR_TIPO[tipo as TipoNotificacao];
  }
  return "sistema";
}

export function obterRotuloCategoriaNotificacao(categoria: string) {
  return ROTULOS_CATEGORIA[categoria as CategoriaNotificacao] || "Sistema";
}

export function obterDestinoNotificacao(
  tipo: string,
  entidadeTipo?: string | null,
) {
  switch (tipo as TipoNotificacao) {
    case "consulta_5_dias":
    case "consulta_24h":
    case "consulta_pendente":
    case "consulta_remarcada":
    case "consulta_cancelada":
      return "/agenda";
    case "transferencia_paciente":
    case "paciente_sem_responsavel":
      return "/pacientes";
    case "feriado_30_dias":
    case "feriado_7_dias":
      return "/configuracoes?secao=funcionamento";
    default:
      return entidadeTipo ? undefined : undefined;
  }
}

export interface DadosNotificacaoConsulta {
  tipo: TipoNotificacaoConsulta;
  pacienteNome: string;
  psicologoNome?: string | null;
  salaNome?: string | null;
  dataConsulta: string;
  horarioInicio: string;
}

export function montarMensagemNotificacaoConsulta({
  tipo,
  pacienteNome,
  psicologoNome,
  salaNome,
  dataConsulta,
  horarioInicio,
}: DadosNotificacaoConsulta) {
  const sala = salaNome?.trim() || "Sala não informada";
  const horario = horarioInicio;
  const psicologo = psicologoNome?.trim();

  if (psicologo) {
    if (tipo === "consulta_24h") {
      return `${pacienteNome} possui consulta com ${psicologo} na ${sala} amanhã às ${horario}.`;
    }

    return `${pacienteNome} possui consulta com ${psicologo} na ${sala} em ${dataConsulta} às ${horario}.`;
  }

  if (tipo === "consulta_24h") {
    return `Seu atendimento com ${pacienteNome} está agendado para amanhã às ${horario} na ${sala}.`;
  }

  return `Seu atendimento com ${pacienteNome} está agendado para ${dataConsulta} às ${horario} na ${sala}.`;
}

