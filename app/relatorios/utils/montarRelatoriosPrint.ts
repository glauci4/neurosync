import type {
  AgendamentoFuturo,
  ConsultaStatus,
  OcupacaoSala,
  PacienteDetalhado,
  PacienteEspera,
  PacientesStatus,
  RelatorioPrintConfig,
  RelatoriosResumo,
  TaxaFaltas,
  VisaoGeralRelatorioDados,
} from "../types/relatorios.types";

function dataPtBr(valor?: string | null) {
  if (!valor) return "";
  const data = new Date(`${String(valor).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(data.getTime())) return String(valor);
  return new Intl.DateTimeFormat("pt-BR").format(data);
}

function hora(valor?: string | null) {
  return String(valor || "").slice(0, 5);
}

function telefone(valor?: string | null) {
  const numeros = String(valor || "").replace(/\D/g, "");
  if (numeros.length === 11) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  }
  if (numeros.length === 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }
  return valor || "";
}

function labelStatusConsulta(status: string) {
  const labels: Record<string, string> = {
    agendado: "Agendado",
    remarcado: "Remarcado",
    cancelado: "Cancelado",
    falta: "Falta",
    concluido: "Concluído",
  };
  return labels[status] || status;
}

function labelStatusPaciente(status: string) {
  const labels: Record<string, string> = {
    fila_espera: "Em espera",
    em_atendimento: "Em atendimento",
    encerrado: "Encerrado",
  };
  return labels[status] || status;
}

function itemResumo(label: string, valor: string | number) {
  return { label, valor };
}

function indicadorResumo(indicador: string, valor: string | number) {
  return { Indicador: indicador, Valor: valor };
}

export function montarPrintVisaoGeral(
  resumo?: RelatoriosResumo,
  dados?: VisaoGeralRelatorioDados,
): RelatorioPrintConfig {
  const psicologosAtivos = dados?.atendimentosPorPsicologo?.length || 0;
  const pacientesStatus = dados?.pacientesStatus;
  return {
    titulo: "Painel executivo",
    secoes: [
      {
        titulo: "Resumo operacional",
        colunas: ["Indicador", "Valor"],
        linhas: [
          indicadorResumo(
            "Atendimentos no período",
            Number(resumo?.consultas?.total || 0),
          ),
          indicadorResumo(
            "Taxa de faltas",
            `${Number(resumo?.consultas?.taxa_faltas || 0).toFixed(1)}%`,
          ),
          indicadorResumo(
            "Pacientes ativos",
            Number(resumo?.pacientes?.ativos || 0),
          ),
          indicadorResumo(
            "Pacientes em espera",
            Number(resumo?.pacientes?.fila_espera || 0),
          ),
          indicadorResumo(
            "Consultas futuras",
            Number(resumo?.agendamentos_futuros || 0),
          ),
          indicadorResumo("Psicólogos ativos", psicologosAtivos),
          indicadorResumo(
            "Tempo médio de acompanhamento",
            typeof resumo?.tempo_medio_acompanhamento_dias === "number"
              ? `${resumo.tempo_medio_acompanhamento_dias} dias`
              : "—",
          ),
        ],
      },
      {
        titulo: "Atendimentos por psicólogo",
        colunas: ["Psicólogo", "Atendimentos", "Faltas", "Taxa de faltas"],
        linhas: (dados?.atendimentosPorPsicologo || []).map((item) => ({
          Psicólogo: item.psicologo_nome,
          Atendimentos: item.total,
          Faltas: item.faltas,
          "Taxa de faltas": `${(
            item.total > 0 ? (item.faltas / item.total) * 100 : 0
          ).toFixed(1)}%`,
        })),
      },
      {
        titulo: "Pacientes por situação",
        colunas: ["Situação", "Total"],
        linhas: [
          { Situação: "Ativos", Total: Number(pacientesStatus?.ativos || 0) },
          {
            Situação: "Inativos",
            Total: Number(pacientesStatus?.inativos || 0),
          },
          {
            Situação: "Em espera",
            Total: Number(pacientesStatus?.fila_espera || 0),
          },
          {
            Situação: "Em atendimento",
            Total: Number(pacientesStatus?.em_atendimento || 0),
          },
          {
            Situação: "Encerrados",
            Total: Number(pacientesStatus?.encerrados || 0),
          },
        ],
      },
      {
        titulo: "Pacientes em espera",
        colunas: [
          "Paciente",
          "Cadastro",
          "Responsável",
          "Psicólogo responsável",
          "Status",
        ],
        linhas: (dados?.pacientesEspera || []).map((item) => ({
          Paciente: item.nome,
          Cadastro: dataPtBr(item.criado_em),
          Responsável: item.responsavel_nome || "-",
          "Psicólogo responsável": item.psicologo_responsavel_nome || "-",
          Status: labelStatusPaciente(item.status_atendimento),
        })),
      },
      {
        titulo: "Agendamentos futuros",
        colunas: ["Data", "Horário", "Paciente", "Psicólogo", "Sala", "Status"],
        linhas: (dados?.agendamentosFuturos || []).map((item) => ({
          Data: dataPtBr(item.data_consulta),
          Horário: `${hora(item.horario_inicio)} - ${hora(item.horario_fim)}`,
          Paciente: item.paciente_nome,
          Psicólogo: item.psicologo_nome,
          Sala: item.sala_nome,
          Status: labelStatusConsulta(item.status),
        })),
      },
    ],
  };
}

export function montarPrintAtendimentosPsicologo(
  data: Array<{
    psicologo_id: number;
    psicologo_nome: string;
    total: number;
    concluidos: number;
    faltas: number;
    cancelados: number;
    pendentes: number;
  }> = [],
): RelatorioPrintConfig {
  return {
    titulo: "Atendimentos por psicólogo",
    secoes: [
      {
        titulo: "Produtividade",
        colunas: [
          "Psicólogo",
          "Total",
          "Concluídos",
          "Faltas",
          "Cancelados",
          "Pendentes",
        ],
        linhas: data.map((item) => ({
          Psicólogo: item.psicologo_nome,
          Total: item.total,
          Concluídos: item.concluidos,
          Faltas: item.faltas,
          Cancelados: item.cancelados,
          Pendentes: item.pendentes,
        })),
      },
    ],
  };
}

export function montarPrintAgendamentosFuturos(
  data: AgendamentoFuturo[] = [],
): RelatorioPrintConfig {
  return {
    titulo: "Agendamentos futuros",
    secoes: [
      {
        titulo: "Agendamentos",
        colunas: ["Data", "Horário", "Paciente", "Psicólogo", "Sala", "Status"],
        linhas: data.map((item) => ({
          Data: dataPtBr(item.data_consulta),
          Horário: `${hora(item.horario_inicio)} - ${hora(item.horario_fim)}`,
          Paciente: item.paciente_nome,
          Psicólogo: item.psicologo_nome,
          Sala: item.sala_nome,
          Status: labelStatusConsulta(item.status),
        })),
      },
    ],
  };
}

export function montarPrintPacientesEspera(
  data: PacienteEspera[] = [],
): RelatorioPrintConfig {
  return {
    titulo: "Pacientes em espera",
    secoes: [
      {
        titulo: "Pacientes",
        colunas: [
          "Nome",
          "Telefone",
          "Cadastro",
          "Responsável",
          "Psicólogo responsável",
          "Status",
        ],
        linhas: data.map((item) => ({
          Nome: item.nome,
          Telefone: telefone(item.telefone),
          Cadastro: dataPtBr(item.criado_em),
          Responsável: item.responsavel_nome || "",
          "Psicólogo responsável": item.psicologo_responsavel_nome || "",
          Status: labelStatusPaciente(item.status_atendimento),
        })),
      },
    ],
  };
}

export function montarPrintPacientesStatus(
  data: PacienteDetalhado[] = [],
): RelatorioPrintConfig {
  return {
    titulo: "Pacientes ativos, inativos e encerrados",
    secoes: [
      {
        titulo: "Pacientes",
        colunas: [
          "Paciente",
          "Responsável",
          "Status",
          "Cadastro",
          "Primeira atribuição",
          "Tempo acompanhamento",
          "Encerrado em",
        ],
        linhas: data.map((item) => ({
          Paciente: item.nome,
          Responsável: item.psicologo_responsavel_nome || "",
          Status: labelStatusPaciente(item.status_atendimento),
          Cadastro: item.ativo ? "Ativo" : "Inativo",
          "Primeira atribuição": dataPtBr(
            item.psicologo_responsavel_atribuido_em,
          ),
          "Tempo acompanhamento": item.tempo_acompanhamento_dias
            ? `${item.tempo_acompanhamento_dias} dias`
            : "—",
          "Encerrado em": dataPtBr(item.encerrado_em),
        })),
      },
    ],
  };
}

export function montarPrintConsultasStatus(
  data: ConsultaStatus[] = [],
): RelatorioPrintConfig {
  return {
    titulo: "Consultas por status",
    secoes: [
      {
        titulo: "Distribuição de consultas",
        colunas: ["Status", "Total"],
        linhas: data.map((item) => ({
          Status: labelStatusConsulta(item.status),
          Total: item.total,
        })),
      },
    ],
  };
}

export function montarPrintTaxaFaltas(data?: TaxaFaltas): RelatorioPrintConfig {
  return {
    titulo: "Taxa de faltas",
    secoes: [
      {
        titulo: "Resumo",
        colunas: ["Métrica", "Valor"],
        linhas: [
          itemResumo(
            "Total de consultas",
            Number(data?.resumo?.total_consultas || 0),
          ),
          itemResumo(
            "Total de faltas",
            Number(data?.resumo?.total_faltas || 0),
          ),
          itemResumo(
            "Taxa de faltas",
            `${Number(data?.resumo?.taxa_faltas || 0).toFixed(1)}%`,
          ),
        ],
      },
      {
        titulo: "Por psicólogo",
        colunas: ["Psicólogo", "Total de consultas", "Total de faltas", "Taxa"],
        linhas: (data?.por_psicologo || []).map((item) => ({
          Psicólogo: item.psicologo_nome,
          "Total de consultas": item.total_consultas,
          "Total de faltas": item.total_faltas,
          Taxa: `${Number(item.taxa_faltas || 0).toFixed(1)}%`,
        })),
      },
    ],
  };
}

export function montarPrintPacientesResumo(
  data?: PacientesStatus,
): RelatorioPrintConfig {
  return {
    titulo: "Pacientes ativos e inativos",
    secoes: [
      {
        titulo: "Resumo de pacientes",
        colunas: ["Métrica", "Valor"],
        linhas: [
          itemResumo("Ativos", Number(data?.ativos || 0)),
          itemResumo("Inativos", Number(data?.inativos || 0)),
          itemResumo("Em espera", Number(data?.fila_espera || 0)),
          itemResumo("Em atendimento", Number(data?.em_atendimento || 0)),
          itemResumo("Encerrados", Number(data?.encerrados || 0)),
          itemResumo(
            "Tempo médio de acompanhamento",
            typeof data?.tempo_medio_acompanhamento_dias === "number"
              ? `${data.tempo_medio_acompanhamento_dias} dias`
              : "—",
          ),
        ],
      },
    ],
  };
}

export function montarPrintOcupacaoSalas(
  data: OcupacaoSala[] = [],
): RelatorioPrintConfig {
  return {
    titulo: "Ocupação de salas",
    secoes: [
      {
        titulo: "Salas",
        colunas: [
          "Sala",
          "Consultas",
          "Horas ocupadas",
          "Horários mais utilizados",
          "Status",
        ],
        linhas: data.map((item) => ({
          Sala: item.sala_nome,
          Consultas: Number(item.total_consultas || 0),
          "Horas ocupadas": Number(item.horas_ocupadas || 0).toFixed(1),
          "Horários mais utilizados": item.horarios_mais_utilizados || "-",
          Status: item.ativo ? "Ativa" : "Inativa",
        })),
      },
    ],
  };
}

