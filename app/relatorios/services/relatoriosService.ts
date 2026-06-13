import type {
  AgendamentoFuturo,
  ApiRelatoriosResponse,
  AtendimentosPsicologo,
  ConsultaStatus,
  FiltrosRelatorios,
  FiltrosRelatoriosResponse,
  OcupacaoSala,
  PacienteDetalhado,
  PacienteEspera,
  PacientesStatus,
  RelatoriosResumo,
  TaxaFaltas,
} from "../types/relatorios.types";

function montarQuery(filtros: FiltrosRelatorios = {}) {
  const params = new URLSearchParams();

  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor === undefined || valor === null || valor === "") return;
    params.set(chave, String(valor));
  });

  const query = params.toString();
  return query ? `?${query}` : "";
}

async function buscarRelatorio<T>(
  endpoint: string,
  filtros?: FiltrosRelatorios,
) {
  const response = await fetch(`${endpoint}${montarQuery(filtros)}`);
  const resultado = await response.json();

  if (!response.ok) {
    const erro = new Error(
      resultado.error || "Erro ao carregar relatório",
    ) as Error & { endpoint?: string; status?: number };
    erro.endpoint = endpoint;
    erro.status = response.status;
    throw erro;
  }

  return resultado as ApiRelatoriosResponse<T>;
}

export const relatoriosService = {
  filtros: async () => {
    const response = await fetch("/api/relatorios/filtros");
    const resultado = await response.json();
    if (!response.ok) {
      const erro = new Error(
        resultado.error || "Erro ao carregar filtros",
      ) as Error & { endpoint?: string; status?: number };
      erro.endpoint = "/api/relatorios/filtros";
      erro.status = response.status;
      throw erro;
    }
    return resultado as FiltrosRelatoriosResponse;
  },

  resumo: (filtros: FiltrosRelatorios) =>
    buscarRelatorio<RelatoriosResumo>("/api/relatorios/resumo", filtros),

  atendimentosPorPsicologo: (filtros: FiltrosRelatorios) =>
    buscarRelatorio<AtendimentosPsicologo[]>(
      "/api/relatorios/atendimentos-por-psicologo",
      filtros,
    ),

  consultasStatus: (filtros: FiltrosRelatorios) =>
    buscarRelatorio<ConsultaStatus[]>(
      "/api/relatorios/consultas-status",
      filtros,
    ),

  pacientesStatus: (filtros: FiltrosRelatorios = {}) =>
    buscarRelatorio<PacientesStatus>(
      "/api/relatorios/pacientes-status",
      filtros,
    ),

  taxaFaltas: (filtros: FiltrosRelatorios) =>
    buscarRelatorio<TaxaFaltas>("/api/relatorios/taxa-faltas", filtros),

  ocupacaoSalas: (filtros: FiltrosRelatorios) =>
    buscarRelatorio<OcupacaoSala[]>("/api/relatorios/ocupacao-salas", filtros),

  agendamentosFuturos: (filtros: FiltrosRelatorios) =>
    buscarRelatorio<AgendamentoFuturo[]>(
      "/api/relatorios/agendamentos-futuros",
      filtros,
    ),

  pacientesEspera: (filtros: FiltrosRelatorios = {}) =>
    buscarRelatorio<PacienteEspera[]>(
      "/api/relatorios/pacientes-espera",
      filtros,
    ),

  pacientesDetalhados: (filtros: FiltrosRelatorios = {}) =>
    buscarRelatorio<PacienteDetalhado[]>(
      "/api/relatorios/pacientes-detalhados",
      filtros,
    ),
};

