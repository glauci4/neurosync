"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  ClipboardList,
  DoorOpen,
  type LucideIcon,
  TrendingDown,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { MouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useClinica } from "@/app/configuracoes/clinica/hooks/useClinica";
import {
  buscarExcecoes,
  buscarHorarios,
} from "@/app/configuracoes/funcionamento/services";
import { usePerfilUsuario } from "@/app/configuracoes/perfil-profissional/hooks/usePerfilUsuario";
import { useSidebar } from "@/app/context/SidebarContext";
import Sidebar from "@/app/inicio/components/Sidebar";
import { useAutenticacao } from "@/hooks/useAutenticacao";
import CardsResumoRelatorios from "./components/CardsResumoRelatorios";
import ExportarExcelButton from "./components/ExportarExcelButton";
import FiltrosRelatorios from "./components/FiltrosRelatorios";
import GerarPDFButton from "./components/GerarPDFButton";
import HeaderRelatorioAtual from "./components/HeaderRelatorioAtual";
import KpisExecutivosRelatorios from "./components/KpisExecutivosRelatorios";
import MenuAcoesRelatorioPadrao from "./components/MenuAcoesRelatorioPadrao";
import PainelExecutivoRelatorios from "./components/PainelExecutivoRelatorios";
import RelatorioEmptyState from "./components/RelatorioEmptyState";
import RelatorioPrintLayout from "./components/RelatorioPrintLayout";
import ResultadoPacientesRelatorio from "./components/ResultadoPacientesRelatorio";
import SecaoResultadoRelatorio from "./components/SecaoResultadoRelatorio";
import TabelaAgendamentosFuturos from "./components/TabelaAgendamentosFuturos";
import TabelaOcupacaoSalas from "./components/TabelaOcupacaoSalas";
import {
  obterConfigRelatorio,
  RELATORIOS_CATEGORIAS_CONFIG,
} from "./constants/relatoriosCategorias";
import { useAgendamentosFuturos } from "./hooks/useAgendamentosFuturos";
import { useAtendimentosPorPsicologo } from "./hooks/useAtendimentosPorPsicologo";
import { useConsultasStatus } from "./hooks/useConsultasStatus";
import { useFiltrosRelatorios } from "./hooks/useFiltrosRelatorios";
import { useImprimirRelatorio } from "./hooks/useImprimirRelatorio";
import { useOcupacaoSalas } from "./hooks/useOcupacaoSalas";
import { usePacientesDetalhados } from "./hooks/usePacientesDetalhados";
import { usePacientesEspera } from "./hooks/usePacientesEspera";
import { usePacientesStatus } from "./hooks/usePacientesStatus";
import { useRelatoriosResumo } from "./hooks/useRelatoriosResumo";
import type {
  CategoriaRelatorio,
  FiltrosRelatorios as FiltrosRelatoriosValores,
} from "./types/relatorios.types";
import type { ContextoExportacaoRelatorio } from "./utils/exportarExcel";
import { formatarDataExcel, horaExcel } from "./utils/exportarExcel";
import {
  montarPrintAgendamentosFuturos,
  montarPrintOcupacaoSalas,
  montarPrintPacientesStatus,
  montarPrintVisaoGeral,
} from "./utils/montarRelatoriosPrint";
import { calcularHorasDisponiveisPeriodo } from "./utils/ocupacaoPeriodo";
import { validarPeriodoRelatorios } from "./utils/validarPeriodoRelatorios";

type ErroRelatorio = {
  error: unknown;
  contexto: string;
};

function montarMensagemErroRelatorio(erro: ErroRelatorio) {
  const status = (erro.error as { status?: number } | null)?.status;
  const detalhe =
    erro.error instanceof Error ? erro.error.message.toLowerCase() : "";

  if (status === 400) {
    return "Não foi possível carregar os relatórios, devido a filtros inválidos.";
  }

  if (status === 401) {
    return "Não foi possível carregar os relatórios, devido a uma sessão expirada ou não autenticada.";
  }

  if (status === 403) {
    return "Não foi possível carregar os relatórios, devido à falta de permissão para acessar estes dados.";
  }

  if (
    detalhe.includes("failed to fetch") ||
    detalhe.includes("network") ||
    detalhe.includes("conexão")
  ) {
    return "Não foi possível carregar os relatórios, devido a falha na conexão com o servidor.";
  }

  return `Não foi possível carregar os relatórios, devido a ${erro.contexto}.`;
}

function metricaResumo(
  label: string,
  valor: string | number,
  icon: LucideIcon,
  detalhe?: string,
) {
  return {
    label,
    valor,
    icon,
    detalhe,
  };
}

function parseDataRelatorio(valor?: string) {
  if (!valor) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [ano, mes, dia] = valor.split("-").map(Number);
    const data = new Date(ano, mes - 1, dia);
    return Number.isNaN(data.getTime()) ? null : data;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
    const [dia, mes, ano] = valor.split("/").map(Number);
    const data = new Date(ano, mes - 1, dia);
    return Number.isNaN(data.getTime()) ? null : data;
  }

  return null;
}

function formatarDataPeriodoRelatorio(data: Date) {
  return new Intl.DateTimeFormat("pt-BR").format(data);
}

function formatoPeriodoRelatorio(filtros: FiltrosRelatoriosValores) {
  const inicio = parseDataRelatorio(filtros.data_inicio);
  const fim = parseDataRelatorio(filtros.data_fim);

  if (!filtros.data_inicio && !filtros.data_fim) {
    return "Período não informado";
  }

  if (!inicio || !fim) {
    if (filtros.data_inicio || filtros.data_fim) {
      return "Informe um período válido";
    }
    return "Período não informado";
  }

  if (inicio > fim) {
    return "Informe um período válido";
  }

  if (filtros.data_inicio && filtros.data_fim) {
    return `${formatarDataPeriodoRelatorio(inicio)} a ${formatarDataPeriodoRelatorio(fim)}`;
  }

  if (filtros.data_inicio) {
    return `A partir de ${formatarDataPeriodoRelatorio(inicio)}`;
  }

  if (filtros.data_fim) {
    return `Até ${formatarDataPeriodoRelatorio(fim)}`;
  }

  return "Período não informado";
}

export default function RelatoriosPage() {
  const { usuario, carregando, fazerLogout } = useAutenticacao();
  const { isCollapsed } = useSidebar();
  const [filtros, setFiltros] = useState<FiltrosRelatoriosValores>({});
  const [tentouAcaoComPeriodo, setTentouAcaoComPeriodo] = useState(false);
  const [camposPeriodoTocados, setCamposPeriodoTocados] = useState({
    data_inicio: false,
    data_fim: false,
  });
  const { printRef, relatorio, imprimirRelatorio } = useImprimirRelatorio();
  const searchParams = useSearchParams();

  const filtrosDisponiveis = useFiltrosRelatorios();
  const clinica = useClinica(!!usuario);
  const perfil = usePerfilUsuario();

  const filtrosQuery = filtros;
  const errosPeriodo = validarPeriodoRelatorios(filtrosQuery);
  const categoriaQuery = searchParams.get("categoria");
  const categoria = RELATORIOS_CATEGORIAS_CONFIG.some(
    (item) => item.key === categoriaQuery,
  )
    ? (categoriaQuery as CategoriaRelatorio)
    : "visao_geral";
  const configCategoriaAtual = obterConfigRelatorio(categoria);
  const periodoCompleto = Boolean(filtros.data_inicio && filtros.data_fim);
  const periodoInvalido = Boolean(
    errosPeriodo.geral || errosPeriodo.data_inicio || errosPeriodo.data_fim,
  );
  const periodoValidoParaBusca = periodoCompleto && !periodoInvalido;
  const mostrarErroPeriodo =
    tentouAcaoComPeriodo ||
    ((camposPeriodoTocados.data_inicio || camposPeriodoTocados.data_fim) &&
      periodoInvalido);
  const errosPeriodoVisiveis = mostrarErroPeriodo ? errosPeriodo : undefined;
  const consultasHabilitadas = periodoValidoParaBusca;
  const categoriaGeral = categoria === "visao_geral";
  const categoriaAgenda = categoria === "agenda";
  const categoriaPacientes = categoria === "pacientes";
  const categoriaSalas = categoria === "salas";
  const filtrosPacientesVisaoGeral = categoriaGeral
    ? {
        data_inicio: filtros.data_inicio,
        data_fim: filtros.data_fim,
      }
    : filtrosQuery;
  const funcionamentoQuery = useQuery({
    queryKey: ["relatorios", "funcionamento-base"],
    queryFn: buscarHorarios,
    enabled:
      consultasHabilitadas && Boolean(filtros.data_inicio && filtros.data_fim),
  });
  const excecoesFuncionamentoQuery = useQuery({
    queryKey: ["relatorios", "funcionamento-excecoes-base"],
    queryFn: buscarExcecoes,
    enabled:
      consultasHabilitadas && Boolean(filtros.data_inicio && filtros.data_fim),
  });
  const capacidadeHorasPeriodo = useMemo(() => {
    if (!filtros.data_inicio || !filtros.data_fim) return null;
    return calcularHorasDisponiveisPeriodo(
      funcionamentoQuery.data || [],
      excecoesFuncionamentoQuery.data || [],
      filtros.data_inicio,
      filtros.data_fim,
    );
  }, [
    excecoesFuncionamentoQuery.data,
    filtros.data_fim,
    filtros.data_inicio,
    funcionamentoQuery.data,
  ]);

  const resumo = useRelatoriosResumo(filtrosQuery, {
    enabled: consultasHabilitadas && categoriaGeral,
  });
  const atendimentos = useAtendimentosPorPsicologo(filtrosQuery, {
    enabled: consultasHabilitadas && categoriaGeral,
  });
  const consultasStatus = useConsultasStatus(filtrosQuery, {
    enabled: consultasHabilitadas && categoriaAgenda,
  });
  const pacientesStatus = usePacientesStatus(filtrosPacientesVisaoGeral, {
    enabled: consultasHabilitadas && (categoriaGeral || categoriaPacientes),
  });
  const ocupacaoSalas = useOcupacaoSalas(filtrosQuery, {
    enabled: consultasHabilitadas && (categoriaGeral || categoriaSalas),
  });
  const agendamentosFuturos = useAgendamentosFuturos(filtrosQuery, {
    enabled: consultasHabilitadas && (categoriaGeral || categoriaAgenda),
  });
  const pacientesEspera = usePacientesEspera(filtrosPacientesVisaoGeral, {
    enabled: consultasHabilitadas && (categoriaGeral || categoriaPacientes),
  });
  const pacientesDetalhados = usePacientesDetalhados(filtrosQuery, {
    enabled: consultasHabilitadas && categoriaPacientes,
  });

  const erroPrincipal = periodoInvalido
    ? null
    : periodoValidoParaBusca
      ? [
          {
            error: filtrosDisponiveis.error,
            contexto: "um erro na busca das opções de filtro",
          },
          {
            error: resumo.error,
            contexto: "um erro na busca do resumo operacional",
          },
          {
            error: atendimentos.error,
            contexto: "um erro na busca dos atendimentos por psicólogo",
          },
          {
            error: consultasStatus.error,
            contexto: "um erro na busca das consultas por status",
          },
          {
            error: pacientesStatus.error,
            contexto: "um erro na busca dos pacientes ativos e inativos",
          },
          {
            error: ocupacaoSalas.error,
            contexto: "um erro na busca da ocupação de salas",
          },
          {
            error: agendamentosFuturos.error,
            contexto: "um erro na busca dos agendamentos futuros",
          },
          {
            error: pacientesEspera.error,
            contexto: "um erro na busca da lista de pacientes em espera",
          },
          {
            error: pacientesDetalhados.error,
            contexto: "um erro na busca dos pacientes detalhados",
          },
        ].find((item) => item.error)
      : null;
  const mensagemErroPrincipal = erroPrincipal
    ? montarMensagemErroRelatorio(erroPrincipal)
    : null;

  useEffect(() => {
    if (!periodoInvalido) {
      setTentouAcaoComPeriodo(false);
    }
  }, [periodoInvalido]);

  useEffect(() => {
    if (!filtros.data_inicio && !filtros.data_fim && !tentouAcaoComPeriodo) {
      setCamposPeriodoTocados({ data_inicio: false, data_fim: false });
    }
  }, [filtros.data_inicio, filtros.data_fim, tentouAcaoComPeriodo]);

  useEffect(() => {
    if (!mensagemErroPrincipal) return;

    toast.error(mensagemErroPrincipal, {
      id: "erro-relatorios-principal",
      className: "border-red-300 bg-red-50 text-red-600",
    });
  }, [mensagemErroPrincipal]);

  function bloquearAcaoSePeriodoInvalido(evento: MouseEvent<HTMLElement>) {
    const botao = (evento.target as HTMLElement).closest("button");
    if (!botao || botao.disabled) return;

    const textoBotao = botao.textContent?.toLowerCase() || "";
    const ehAcaoRelatorio =
      textoBotao.includes("gerar pdf") ||
      textoBotao.includes("imprimir") ||
      textoBotao.includes("exportar excel");

    if (!ehAcaoRelatorio || !periodoInvalido) return;

    evento.preventDefault();
    evento.stopPropagation();
    setTentouAcaoComPeriodo(true);
    toast.error(
      errosPeriodo.geral ||
        "Selecione um período válido para gerar relatórios.",
      {
        className: "border-red-300 bg-red-50 text-red-600",
      },
    );
  }

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0] dark:bg-[var(--ns-background)]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#9F64AF] border-t-transparent" />
      </div>
    );
  }

  if (!usuario) return null;

  const contentMargin = isCollapsed ? "ml-20" : "ml-64";
  const perfilId =
    usuario.perfil_id || (usuario.perfil === "psicologo" ? 2 : 1);
  const usuarioPdf = {
    nome: perfil.data?.nome || usuario.nome,
    crp: perfil.data?.crp || null,
    assinatura_profissional_url:
      perfil.data?.assinatura_profissional_url || null,
  };
  const nomeClinicaExportacao =
    clinica.data?.data?.nome_fantasia ||
    clinica.data?.data?.razao_social ||
    "Clínica NeuroSync";

  const resumoData = resumo.data?.data;
  const consultasStatusData = consultasStatus.data?.data || [];
  const pacientesStatusData = pacientesStatus.data?.data;
  const ocupacaoSalasData = ocupacaoSalas.data?.data || [];
  const agendamentosFuturosData = agendamentosFuturos.data?.data || [];
  const pacientesEsperaData = pacientesEspera.data?.data || [];
  const pacientesDetalhadosData = pacientesDetalhados.data?.data || [];
  const psicologosAtivosVisaoGeral = atendimentos.data?.data?.length || 0;
  const agendaKpis = [
    metricaResumo(
      "Agendamentos futuros",
      agendamentosFuturosData.length,
      CalendarClock,
    ),
    metricaResumo(
      "Faltas",
      Number(
        consultasStatusData.find((item) => item.status === "falta")?.total || 0,
      ),
      TrendingDown,
    ),
    metricaResumo(
      "Cancelamentos",
      Number(
        consultasStatusData.find((item) => item.status === "cancelado")
          ?.total || 0,
      ),
      ClipboardList,
    ),
    metricaResumo(
      "Remarcações",
      Number(
        consultasStatusData.find((item) => item.status === "remarcado")
          ?.total || 0,
      ),
      CalendarClock,
    ),
  ];
  const pacientesKpis = [
    metricaResumo(
      "Pacientes ativos",
      Number(pacientesStatusData?.ativos || 0),
      Users,
    ),
    metricaResumo(
      "Pacientes inativos",
      Number(pacientesStatusData?.inativos || 0),
      Users,
    ),
    metricaResumo(
      "Pacientes em espera",
      Number(pacientesStatusData?.fila_espera || 0),
      UserRoundCheck,
    ),
    metricaResumo(
      "Em atendimento",
      Number(pacientesStatusData?.em_atendimento || 0),
      UserRoundCheck,
    ),
    metricaResumo(
      "Encerrados",
      Number(pacientesStatusData?.encerrados || 0),
      Users,
    ),
    metricaResumo(
      "Tempo médio de acompanhamento",
      typeof pacientesStatusData?.tempo_medio_acompanhamento_dias === "number"
        ? `${pacientesStatusData.tempo_medio_acompanhamento_dias} dias`
        : "—",
      CalendarClock,
    ),
  ];
  const salasKpis = [
    metricaResumo(
      "Salas ativas",
      Number(
        ocupacaoSalasData.filter((item) => Number(item.ativo) === 1).length,
      ),
      DoorOpen,
    ),
    metricaResumo(
      "Consultas",
      Number(
        ocupacaoSalasData.reduce(
          (total, item) => total + Number(item.total_consultas || 0),
          0,
        ),
      ),
      ClipboardList,
    ),
    metricaResumo(
      "Horas ocupadas",
      `${ocupacaoSalasData
        .reduce((total, item) => total + Number(item.horas_ocupadas || 0), 0)
        .toFixed(1)}h`,
      CalendarClock,
    ),
    metricaResumo(
      "Ocupação média",
      capacidadeHorasPeriodo
        ? `${Math.round(
            (ocupacaoSalasData.reduce(
              (total, item) => total + Number(item.horas_ocupadas || 0),
              0,
            ) /
              capacidadeHorasPeriodo) *
              100,
          )}%`
        : "—",
      TrendingDown,
    ),
  ];
  const contextoExportacaoRelatorio: ContextoExportacaoRelatorio = {
    tituloRelatorio: configCategoriaAtual.titulo,
    nomeClinica: nomeClinicaExportacao,
    periodo: formatoPeriodoRelatorio(filtros),
    filtros: [
      filtros.psicologo_id
        ? {
            label: "Psicólogo",
            valor:
              filtrosDisponiveis.data?.data.psicologos.find(
                (item) => item.id === filtros.psicologo_id,
              )?.nome || String(filtros.psicologo_id),
          }
        : null,
      filtros.sala_id
        ? {
            label: "Sala",
            valor:
              filtrosDisponiveis.data?.data.salas.find(
                (item) => item.id === filtros.sala_id,
              )?.nome || String(filtros.sala_id),
          }
        : null,
      filtros.status
        ? {
            label: "Status",
            valor: filtros.status,
          }
        : null,
      filtros.paciente_id
        ? {
            label: "Paciente",
            valor:
              filtrosDisponiveis.data?.data.pacientes.find(
                (item) => item.id === filtros.paciente_id,
              )?.nome || String(filtros.paciente_id),
          }
        : null,
      filtros.letra_inicial
        ? {
            label: "Letra inicial",
            valor: filtros.letra_inicial,
          }
        : null,
      filtros.psicologo_responsavel_id
        ? {
            label: "Psicólogo responsável",
            valor:
              filtrosDisponiveis.data?.data.psicologos.find(
                (item) => item.id === filtros.psicologo_responsavel_id,
              )?.nome || String(filtros.psicologo_responsavel_id),
          }
        : null,
    ].filter(Boolean) as Array<{ label: string; valor: string }>,
    resumoOperacional:
      categoriaGeral || categoriaPacientes || categoriaAgenda || categoriaSalas
        ? (() => {
            switch (categoria) {
              case "agenda":
                return agendaKpis;
              case "pacientes":
                return pacientesKpis;
              case "salas":
                return salasKpis;
              default:
                return [
                  metricaResumo(
                    "Atendimentos no período",
                    Number(resumoData?.consultas?.total || 0),
                    ClipboardList,
                  ),
                  metricaResumo(
                    "Taxa de faltas",
                    `${Number(resumoData?.consultas?.taxa_faltas || 0).toFixed(1)}%`,
                    TrendingDown,
                  ),
                  metricaResumo(
                    "Pacientes ativos",
                    Number(resumoData?.pacientes?.ativos || 0),
                    Users,
                  ),
                  metricaResumo(
                    "Pacientes em espera",
                    Number(resumoData?.pacientes?.fila_espera || 0),
                    UserRoundCheck,
                  ),
                  metricaResumo(
                    "Consultas futuras",
                    Number(resumoData?.agendamentos_futuros || 0),
                    CalendarClock,
                  ),
                  metricaResumo(
                    "Psicólogos ativos",
                    psicologosAtivosVisaoGeral,
                    Users,
                  ),
                  metricaResumo(
                    "Tempo médio de acompanhamento",
                    typeof resumoData?.tempo_medio_acompanhamento_dias ===
                      "number"
                      ? `${resumoData.tempo_medio_acompanhamento_dias} dias`
                      : "—",
                    CalendarClock,
                  ),
                ];
            }
          })()
        : [],
  };
  const planilhasVisaoGeral = [
    {
      nome: "Resumo operacional",
      dados: [
        {
          Indicador: "Atendimentos no período",
          Valor: Number(resumoData?.consultas?.total || 0),
        },
        {
          Indicador: "Taxa de faltas",
          Valor: `${Number(resumoData?.consultas?.taxa_faltas || 0).toFixed(1)}%`,
        },
        {
          Indicador: "Pacientes ativos",
          Valor: Number(resumoData?.pacientes?.ativos || 0),
        },
        {
          Indicador: "Pacientes em espera",
          Valor: Number(resumoData?.pacientes?.fila_espera || 0),
        },
        {
          Indicador: "Consultas futuras",
          Valor: Number(resumoData?.agendamentos_futuros || 0),
        },
        {
          Indicador: "Psicólogos ativos",
          Valor: psicologosAtivosVisaoGeral,
        },
        {
          Indicador: "Tempo médio de acompanhamento",
          Valor:
            typeof resumoData?.tempo_medio_acompanhamento_dias === "number"
              ? `${resumoData.tempo_medio_acompanhamento_dias} dias`
              : "—",
        },
      ],
    },
    {
      nome: "Atendimentos por psicólogo",
      dados: (atendimentos.data?.data || []).map((item) => ({
        Psicólogo: item.psicologo_nome,
        Atendimentos: item.total,
        Faltas: item.faltas,
        "Taxa de faltas": `${(
          item.total > 0 ? (item.faltas / item.total) * 100 : 0
        ).toFixed(1)}%`,
      })),
    },
    {
      nome: "Pacientes por situação",
      dados: pacientesStatusData
        ? [
            { Situação: "Ativos", Total: pacientesStatusData.ativos },
            { Situação: "Inativos", Total: pacientesStatusData.inativos },
            { Situação: "Em espera", Total: pacientesStatusData.fila_espera },
            {
              Situação: "Em atendimento",
              Total: pacientesStatusData.em_atendimento,
            },
            { Situação: "Encerrados", Total: pacientesStatusData.encerrados },
          ]
        : [],
    },
    {
      nome: "Pacientes em espera",
      dados: pacientesEsperaData.map((item) => ({
        Nome: item.nome,
        Cadastro: formatarDataExcel(item.criado_em),
        Status: item.status_atendimento,
        Responsável: item.psicologo_responsavel_nome || "",
      })),
    },
    {
      nome: "Agendamentos futuros",
      dados: (agendamentosFuturos.data?.data || []).map((item) => ({
        Data: formatarDataExcel(item.data_consulta),
        Horário: `${horaExcel(item.horario_inicio)} - ${horaExcel(item.horario_fim)}`,
        Paciente: item.paciente_nome,
        Psicólogo: item.psicologo_nome,
        Sala: item.sala_nome,
        Status: item.status,
      })),
    },
  ];
  const relatorioGlobalBloqueado = !periodoValidoParaBusca;

  function montarRelatorioCategoriaAtual() {
    switch (categoria) {
      case "agenda":
        return montarPrintAgendamentosFuturos(agendamentosFuturos.data?.data);
      case "pacientes":
        return montarPrintPacientesStatus(pacientesDetalhados.data?.data);
      case "salas":
        return montarPrintOcupacaoSalas(ocupacaoSalas.data?.data);
      default:
        return montarPrintVisaoGeral(resumo.data?.data, {
          atendimentosPorPsicologo: atendimentos.data?.data,
          pacientesStatus: pacientesStatus.data?.data,
          pacientesEspera: pacientesEspera.data?.data,
          agendamentosFuturos: agendamentosFuturos.data?.data,
        });
    }
  }

  function categoriaAtualCarregando() {
    if (!periodoValidoParaBusca) return false;

    switch (categoria) {
      case "agenda":
        return consultasStatus.isLoading || agendamentosFuturos.isLoading;
      case "pacientes":
        return pacientesStatus.isLoading || pacientesDetalhados.isLoading;
      case "salas":
        return ocupacaoSalas.isLoading;
      default:
        return (
          resumo.isLoading ||
          atendimentos.isLoading ||
          consultasStatus.isLoading ||
          pacientesStatus.isLoading ||
          ocupacaoSalas.isLoading
        );
    }
  }

  const relatorioGlobal = montarRelatorioCategoriaAtual();
  const acaoGlobalDesabilitada = categoriaAtualCarregando();

  function renderAcaoPdfMenu() {
    return (
      <GerarPDFButton
        relatorio={relatorioGlobal}
        clinica={clinica.data?.data}
        filtros={filtros}
        usuario={usuarioPdf}
        disabled={acaoGlobalDesabilitada}
        periodoValido={periodoValidoParaBusca}
        modo="menu"
      />
    );
  }

  function handleImprimirRelatorioAtual() {
    if (relatorioGlobalBloqueado || !periodoValidoParaBusca) {
      toast.error("Selecione um período válido para imprimir o relatório.", {
        className: "border-red-300 bg-red-50 text-red-600",
      });
      return;
    }

    imprimirRelatorio(relatorioGlobal);
  }

  function renderIndicadoresCategoria() {
    switch (categoria) {
      case "agenda":
        return (
          <KpisExecutivosRelatorios
            metricas={agendaKpis}
            isLoading={
              consultasStatus.isLoading || agendamentosFuturos.isLoading
            }
          />
        );
      case "pacientes":
        return (
          <KpisExecutivosRelatorios
            metricas={pacientesKpis}
            isLoading={pacientesStatus.isLoading}
          />
        );
      case "salas":
        return (
          <KpisExecutivosRelatorios
            metricas={salasKpis}
            isLoading={ocupacaoSalas.isLoading}
          />
        );
      default:
        return null;
    }
  }

  function renderConteudoCategoria() {
    if (!periodoValidoParaBusca) {
      return (
        <RelatorioEmptyState
          titulo="Relatório ainda não gerado"
          mensagem="Informe um período válido para gerar o relatório."
          altura="media"
        />
      );
    }

    switch (categoria) {
      case "visao_geral":
        return (
          <PainelExecutivoRelatorios
            atendimentosPorPsicologo={atendimentos.data?.data}
            pacientesStatus={pacientesStatus.data?.data}
            pacientesEspera={pacientesEsperaData}
            agendamentosFuturos={agendamentosFuturos.data?.data}
            isLoadingAtendimentos={atendimentos.isLoading}
            isLoadingPacientesStatus={pacientesStatus.isLoading}
            isLoadingPacientesEspera={pacientesEspera.isLoading}
            isLoadingAgendamentosFuturos={agendamentosFuturos.isLoading}
            acoes={
              <MenuAcoesRelatorioPadrao
                acaoPdf={renderAcaoPdfMenu()}
                onImprimir={handleImprimirRelatorioAtual}
                imprimirDesabilitado={acaoGlobalDesabilitada}
                acaoExcel={
                  <ExportarExcelButton
                    disabled={acaoGlobalDesabilitada}
                    modo="menu"
                    contexto={contextoExportacaoRelatorio}
                    periodoValido={periodoValidoParaBusca}
                    planilhas={planilhasVisaoGeral}
                  />
                }
              />
            }
          />
        );

      case "agenda":
        return (
          <TabelaAgendamentosFuturos
            data={agendamentosFuturosData}
            isLoading={agendamentosFuturos.isLoading}
            error={agendamentosFuturos.error}
            acoesBloqueadas={categoriaAtualCarregando()}
            acaoHeaderExtra={renderAcaoPdfMenu()}
            contextoExportacao={contextoExportacaoRelatorio}
            periodoValido={periodoValidoParaBusca}
          />
        );

      case "pacientes":
        return (
          <ResultadoPacientesRelatorio
            pacientesDetalhados={pacientesDetalhadosData}
            isLoadingPacientesDetalhados={pacientesDetalhados.isLoading}
            errorPacientesDetalhados={pacientesDetalhados.error}
            onImprimir={handleImprimirRelatorioAtual}
            acoesBloqueadas={categoriaAtualCarregando()}
            acaoHeaderExtra={renderAcaoPdfMenu()}
            contextoExportacao={contextoExportacaoRelatorio}
            periodoValido={periodoValidoParaBusca}
          />
        );

      case "salas":
        return (
          <div className="space-y-5">
            <TabelaOcupacaoSalas
              data={ocupacaoSalas.data?.data}
              isLoading={ocupacaoSalas.isLoading}
              error={ocupacaoSalas.error}
              onImprimir={handleImprimirRelatorioAtual}
              acoesBloqueadas={categoriaAtualCarregando()}
              acaoHeaderExtra={renderAcaoPdfMenu()}
              capacidadePeriodoHoras={capacidadeHorasPeriodo}
              contextoExportacao={contextoExportacaoRelatorio}
              periodoValido={periodoValidoParaBusca}
            />
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0] dark:bg-[var(--ns-background)]">
      <Sidebar perfilId={perfilId} onLogout={fazerLogout} usuario={usuario} />

      <div className={contentMargin}>
        <div className="px-8 pt-8 pb-2">
          <HeaderRelatorioAtual
            titulo={configCategoriaAtual.titulo}
            descricao={configCategoriaAtual.descricao}
            icone={configCategoriaAtual.icone}
          />
        </div>

        <main
          className="px-8 pb-8"
          onClickCapture={bloquearAcaoSePeriodoInvalido}
        >
          <div className="mx-auto max-w-5xl space-y-8 pt-4">
            {categoriaGeral ? (
              <div className="mt-4">
                <CardsResumoRelatorios
                  resumo={resumoData}
                  isLoading={resumo.isLoading}
                  psicologosAtivos={psicologosAtivosVisaoGeral}
                />
              </div>
            ) : null}

            {!categoriaGeral ? (
              <div className="mt-4">{renderIndicadoresCategoria()}</div>
            ) : null}

            <FiltrosRelatorios
              filtros={filtros}
              opcoes={filtrosDisponiveis.data?.data}
              onChange={setFiltros}
              errosPeriodo={errosPeriodoVisiveis}
              categoria={categoria}
              onPeriodoBlur={(campo) =>
                setCamposPeriodoTocados((atual) => ({
                  ...atual,
                  [campo]: true,
                }))
              }
            />

            {categoriaGeral ? (
              renderConteudoCategoria()
            ) : (
              <SecaoResultadoRelatorio
                titulo="Resultado do relatório"
                descricao="Conteúdo consolidado conforme o relatório e os filtros selecionados."
              >
                {renderConteudoCategoria()}
              </SecaoResultadoRelatorio>
            )}

            {periodoValidoParaBusca ? (
              <div ref={printRef}>
                <RelatorioPrintLayout
                  relatorio={relatorio}
                  clinica={clinica.data?.data}
                  filtros={filtros}
                  usuario={usuarioPdf}
                  usuarioNome={usuario.nome}
                />
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

