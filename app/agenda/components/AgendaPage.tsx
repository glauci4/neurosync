"use client";

import { Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RxGear } from "react-icons/rx";
import { useExcecoes } from "@/app/configuracoes/funcionamento/hooks/useExcecoes";
import { useFuncionamento } from "@/app/configuracoes/funcionamento/hooks/useFuncionamento";
import type { Excecao, Horario } from "@/app/configuracoes/funcionamento/types";
import { useSidebar } from "@/app/context/SidebarContext";
import Sidebar from "@/app/inicio/components/Sidebar";
import { useAutenticacao } from "@/hooks/useAutenticacao";
import { useAgenda, useFiltrosAgenda } from "../hooks/useAgenda";
import {
  dataLocalISO,
  dataLocalMeioDia,
  getDiaSemanaLocal,
} from "../utils/datas";
import CalendarioAgenda, {
  type CalendarioAgendaHandle,
  type ConsultaAgenda,
} from "./CalendarioAgenda";
import FiltrosAgenda, { type EstadoFiltrosAgenda } from "./FiltrosAgenda";
import ModalConsultasDia from "./ModalConsultasDia";
import ModalNovaConsulta from "./ModalNovaConsulta";
import PainelDetalhesConsulta from "./PainelDetalhesConsulta";
import ToolbarAgenda, { type VisualizacaoAgenda } from "./ToolbarAgenda";

function mapearOpcoes(
  itens?: Array<{ id: number; nome: string; tipo?: string }>,
) {
  return (itens || []).map((item) => ({
    valor: String(item.id),
    label: item.tipo ? `${item.nome} (${item.tipo})` : item.nome,
  }));
}

function mapearPacientesAgendaveis(
  itens?: Array<{
    id: number;
    nome: string;
    status_atendimento?: "fila_espera" | "em_atendimento" | "encerrado" | null;
  }>,
  pacienteInicialId?: number | null,
) {
  return mapearOpcoes(
    (itens || []).filter(
      (item) =>
        item.status_atendimento === "em_atendimento" ||
        (pacienteInicialId ? item.id === pacienteInicialId : false),
    ),
  );
}

function numeroParametro(params: URLSearchParams, chave: string) {
  const valor = Number(params.get(chave) || 0);
  return valor > 0 ? valor : undefined;
}

function filtrosPorQueryParams(params: URLSearchParams): EstadoFiltrosAgenda {
  return {
    psicologo_id: numeroParametro(params, "psicologo_id"),
    sala_id: numeroParametro(params, "sala_id"),
    paciente_id: numeroParametro(params, "paciente_id"),
    status: params.get("status") || undefined,
    tipo_atendimento: params.get("tipo_atendimento") || undefined,
  };
}

function contadorConsultas(total: number) {
  return `${total} ${total === 1 ? "consulta" : "consultas"}`;
}

function dataHojeISO() {
  return dataLocalISO(new Date());
}

function formatarDataCurta(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(data);
}

function inicioSemanaISO(dataReferencia: Date) {
  const inicio = dataLocalMeioDia(dataReferencia);
  const diaSemana = getDiaSemanaLocal(inicio);
  inicio.setDate(inicio.getDate() - diaSemana);
  const ano = inicio.getFullYear();
  const mes = String(inicio.getMonth() + 1).padStart(2, "0");
  const dia = String(inicio.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function fimSemanaISO(dataReferencia: Date) {
  const fim = dataLocalMeioDia(dataReferencia);
  const diaSemana = getDiaSemanaLocal(fim);
  fim.setDate(fim.getDate() + (6 - diaSemana));
  const ano = fim.getFullYear();
  const mes = String(fim.getMonth() + 1).padStart(2, "0");
  const dia = String(fim.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function mesAnoAtual(dataReferencia: Date) {
  const hoje = new Date();
  return (
    dataReferencia.getFullYear() === hoje.getFullYear() &&
    dataReferencia.getMonth() === hoje.getMonth()
  );
}

function formatarProximaConsulta(
  consulta: ConsultaAgenda | undefined,
  psicologoFiltrado?: number,
) {
  if (!consulta) {
    return {
      horario: "Nenhuma",
      descricao: "Sem próximas consultas hoje",
    };
  }

  if (psicologoFiltrado) {
    return {
      horario: horaCurta(consulta.horario_inicio),
      descricao: consulta.paciente_nome,
    };
  }

  return {
    horario: horaCurta(consulta.horario_inicio),
    descricao: "Próxima consulta de hoje",
  };
}

function dataHoraLocal(consulta: ConsultaAgenda) {
  const [ano, mes, dia] = String(consulta.data_consulta)
    .slice(0, 10)
    .split("-")
    .map(Number);
  const [hora = "0", minuto = "0"] = horaCurta(consulta.horario_inicio).split(
    ":",
  );
  return new Date(ano, mes - 1, dia, Number(hora), Number(minuto), 0, 0);
}

function horaCurta(hora: string) {
  return hora?.slice(0, 5) || "";
}

function horaSlot(hora?: string | null) {
  const valor = horaCurta(String(hora || ""));
  return valor ? `${valor}:00` : "";
}

function minutosHorario(hora?: string | null) {
  const valor = horaCurta(String(hora || ""));
  const [horas, minutos] = valor.split(":").map(Number);
  if (Number.isNaN(horas) || Number.isNaN(minutos)) return null;
  return horas * 60 + minutos;
}

function compararHorarios(a?: string | null, b?: string | null) {
  const minutosA = minutosHorario(a);
  const minutosB = minutosHorario(b);
  if (minutosA === null || minutosB === null) return 0;
  return minutosA - minutosB;
}

function registroAtivo(valor: boolean | number | string | undefined | null) {
  return valor === true || valor === 1 || valor === "1";
}

function periodoContemData(excecao: Excecao, data: string) {
  const inicio = String(excecao.data_especifica || "").slice(0, 10);
  const fim = String(excecao.data_fim || inicio).slice(0, 10);
  return data >= inicio && data <= fim;
}

function obterDatasSemana(dataReferencia: Date) {
  const inicio = dataLocalMeioDia(dataReferencia);
  const diaSemana = getDiaSemanaLocal(inicio);
  inicio.setDate(inicio.getDate() - diaSemana);

  return Array.from({ length: 7 }, (_, indice) => {
    const data = dataLocalMeioDia(inicio);
    data.setDate(inicio.getDate() + indice);
    return dataLocalMeioDia(data);
  });
}

type ExpedienteAgenda = {
  inicio: string;
  fim: string;
  intervaloInicio?: string | null;
  intervaloFim?: string | null;
};

function obterExpedienteDia(
  data: Date,
  horarios: Horario[],
  excecoes: Excecao[],
): ExpedienteAgenda | null {
  const dataConsulta = dataLocalISO(data);
  const excecoesDia = excecoes.filter(
    (excecao) =>
      registroAtivo(excecao.ativo) && periodoContemData(excecao, dataConsulta),
  );
  const bloqueioDiaInteiro = excecoesDia.some(
    (excecao) =>
      ["feriado", "ferias", "bloqueio"].includes(excecao.tipo) &&
      !excecao.hora_inicio &&
      !excecao.hora_fim,
  );

  if (bloqueioDiaInteiro) return null;

  const horarioEspecial = excecoesDia.find(
    (excecao) =>
      excecao.tipo === "excecao" && excecao.hora_inicio && excecao.hora_fim,
  );

  if (horarioEspecial?.hora_inicio && horarioEspecial?.hora_fim) {
    return {
      inicio: horaCurta(horarioEspecial.hora_inicio),
      fim: horaCurta(horarioEspecial.hora_fim),
      intervaloInicio: null,
      intervaloFim: null,
    };
  }

  const horarioPontual = horarios
    .filter(
      (horario) =>
        registroAtivo(horario.ativo) &&
        String(horario.data_especifica || "").slice(0, 10) === dataConsulta,
    )
    .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))[0];

  if (!horarioPontual?.hora_inicio || !horarioPontual?.hora_fim) return null;

  return {
    inicio: horaCurta(horarioPontual.hora_inicio),
    fim: horaCurta(horarioPontual.hora_fim),
    intervaloInicio: horarioPontual.intervalo_inicio
      ? horaCurta(horarioPontual.intervalo_inicio)
      : null,
    intervaloFim: horarioPontual.intervalo_fim
      ? horaCurta(horarioPontual.intervalo_fim)
      : null,
  };
}

function obterBloqueiosParciaisDia(data: Date, excecoes: Excecao[]) {
  const dataConsulta = dataLocalISO(data);
  return excecoes.filter(
    (excecao) =>
      registroAtivo(excecao.ativo) &&
      excecao.tipo === "bloqueio" &&
      excecao.hora_inicio &&
      excecao.hora_fim &&
      periodoContemData(excecao, dataConsulta),
  );
}

function montarBloqueiosIntervalo(
  dataConsulta: string,
  expediente: ExpedienteAgenda,
) {
  if (!expediente.intervaloInicio || !expediente.intervaloFim) return [];
  return [
    {
      id: `intervalo-funcionamento-${dataConsulta}`,
      start: `${dataConsulta}T${horaSlot(expediente.intervaloInicio)}`,
      end: `${dataConsulta}T${horaSlot(expediente.intervaloFim)}`,
    },
  ];
}

function montarBusinessHoursDia(data: Date, expediente: ExpedienteAgenda) {
  const diaSemana = getDiaSemanaLocal(data);

  if (
    expediente.intervaloInicio &&
    expediente.intervaloFim &&
    compararHorarios(expediente.inicio, expediente.intervaloInicio) < 0 &&
    compararHorarios(expediente.intervaloFim, expediente.fim) < 0
  ) {
    return [
      {
        daysOfWeek: [diaSemana],
        startTime: expediente.inicio,
        endTime: expediente.intervaloInicio,
      },
      {
        daysOfWeek: [diaSemana],
        startTime: expediente.intervaloFim,
        endTime: expediente.fim,
      },
    ];
  }

  return [
    {
      daysOfWeek: [diaSemana],
      startTime: expediente.inicio,
      endTime: expediente.fim,
    },
  ];
}

export default function AgendaPage() {
  const { usuario, fazerLogout } = useAutenticacao();
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const calendarioRef = useRef<CalendarioAgendaHandle | null>(null);
  const [visualizacao, setVisualizacao] =
    useState<VisualizacaoAgenda>("dayGridMonth");
  const [tituloCalendario, setTituloCalendario] = useState("");
  const [dataReferencia, setDataReferencia] = useState(() => new Date());
  const [modalConsultaAberto, setModalConsultaAberto] = useState(false);
  const [modoModalConsulta, setModoModalConsulta] = useState<
    "criar" | "editar" | "remarcar"
  >("criar");
  const [consultaSelecionada, setConsultaSelecionada] =
    useState<ConsultaAgenda | null>(null);
  const [consultasDiaSelecionado, setConsultasDiaSelecionado] = useState<{
    data: string;
    consultas: ConsultaAgenda[];
  } | null>(null);
  const [valoresIniciaisConsulta, setValoresIniciaisConsulta] = useState<
    | {
        data_consulta?: string;
        horario_inicio?: string;
        horario_fim?: string;
        id?: number;
        paciente_id?: number;
        psicologo_id?: number;
        sala_id?: number;
        tipo_atendimento?: ConsultaAgenda["tipo_atendimento"];
        tipo_outro?: string | null;
        observacoes?: string | null;
      }
    | undefined
  >();
  const fluxoIniciarAtendimentoRef = useRef<number | null>(null);
  const consultaSalvaNoFluxoRef = useRef(false);

  const filtros = useMemo(
    () => filtrosPorQueryParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const { data: agendaData, isLoading } = useAgenda(filtros);
  const { data: filtrosData } = useFiltrosAgenda();
  const { query: funcionamentoQuery } = useFuncionamento();
  const { query: excecoesQuery } = useExcecoes();

  const consultas = (agendaData?.data || []) as ConsultaAgenda[];
  const horariosFuncionamento = funcionamentoQuery.data || [];
  const excecoesFuncionamento = excecoesQuery.data || [];
  const filtrosDisponiveis = filtrosData?.data;
  const resumoOperacional = useMemo(() => {
    const hoje = dataHojeISO();
    const inicioSemana = inicioSemanaISO(dataReferencia);
    const fimSemana = fimSemanaISO(dataReferencia);
    const consultasHoje = consultas.filter(
      (consulta) => consulta.data_consulta === hoje,
    );
    const agora = new Date();
    const consultasFuturasHoje = consultasHoje
      .filter((consulta) => ["agendado", "remarcado"].includes(consulta.status))
      .filter((consulta) => dataHoraLocal(consulta).getTime() > agora.getTime())
      .sort((a, b) =>
        `${a.data_consulta}T${a.horario_inicio}`.localeCompare(
          `${b.data_consulta}T${b.horario_inicio}`,
        ),
      );
    const proximaConsulta = consultas
      .filter(
        (consulta) =>
          consulta.data_consulta >= hoje &&
          ["agendado", "remarcado"].includes(consulta.status),
      )
      .filter((consulta) => dataHoraLocal(consulta).getTime() > agora.getTime())
      .sort((a, b) =>
        `${a.data_consulta}T${a.horario_inicio}`.localeCompare(
          `${b.data_consulta}T${b.horario_inicio}`,
        ),
      )[0];
    const salasOcupadas = new Set(
      consultasHoje
        .filter((consulta) =>
          ["agendado", "remarcado"].includes(consulta.status),
        )
        .map((consulta) => consulta.sala_id),
    ).size;
    const faltasSemana = consultas.filter(
      (consulta) =>
        consulta.status === "falta" &&
        consulta.data_consulta >= inicioSemana &&
        consulta.data_consulta <= fimSemana,
    ).length;
    const agendaFechada = consultasHoje.some((consulta) =>
      Boolean(consulta.fechado_dia),
    );

    const proximaConsultaFormatada = filtros.psicologo_id
      ? formatarProximaConsulta(proximaConsulta, filtros.psicologo_id)
      : formatarProximaConsulta(consultasFuturasHoje[0]);

    return {
      consultasHoje: consultasHoje.length,
      proximaConsulta: proximaConsultaFormatada,
      salasOcupadas,
      faltasSemana,
      agendaDia: agendaFechada ? "Fechada" : "Aberta",
    };
  }, [consultas, dataReferencia, filtros.psicologo_id]);

  const opcoes = useMemo(
    () => ({
      pacientes: mapearOpcoes(filtrosDisponiveis?.pacientes),
      psicologos: mapearOpcoes(filtrosDisponiveis?.psicologos),
      salas: mapearOpcoes(filtrosDisponiveis?.salas),
    }),
    [filtrosDisponiveis],
  );
  const pacientesModal = useMemo(
    () =>
      mapearPacientesAgendaveis(
        filtrosDisponiveis?.pacientes as
          | Array<{
              id: number;
              nome: string;
              status_atendimento?:
                | "fila_espera"
                | "em_atendimento"
                | "encerrado"
                | null;
            }>
          | undefined,
        valoresIniciaisConsulta?.paciente_id,
      ),
    [filtrosDisponiveis?.pacientes, valoresIniciaisConsulta?.paciente_id],
  );

  const gradeFuncionamento = useMemo(() => {
    const datas =
      visualizacao === "timeGridWeek"
        ? obterDatasSemana(dataReferencia)
        : [dataReferencia];
    const expedientes = datas
      .map((data) => ({
        data,
        expediente: obterExpedienteDia(
          data,
          horariosFuncionamento,
          excecoesFuncionamento,
        ),
      }))
      .filter(
        (
          item,
        ): item is {
          data: Date;
          expediente: ExpedienteAgenda;
        } => Boolean(item.expediente),
      );

    if (visualizacao === "dayGridMonth") {
      return {
        slotMinTime: "07:00:00",
        slotMaxTime: "21:00:00",
        businessHoursGrade: [],
        bloqueiosGrade: [],
        datasSemExpediente: [],
        semFuncionamento: false,
      };
    }

    if (expedientes.length === 0) {
      return {
        slotMinTime: "00:00:00",
        slotMaxTime: "00:30:00",
        businessHoursGrade: [],
        bloqueiosGrade: [],
        datasSemExpediente: [],
        semFuncionamento: true,
      };
    }

    const menorInicio = expedientes
      .map((item) => item.expediente.inicio)
      .sort(compararHorarios)[0];
    const maiorFim = expedientes
      .map((item) => item.expediente.fim)
      .sort(compararHorarios)
      .at(-1);

    const slotMinTime = horaSlot(menorInicio);
    const slotMaxTime = horaSlot(maiorFim);
    const businessHoursGrade =
      visualizacao === "timeGridWeek"
        ? expedientes.flatMap(({ data, expediente }) =>
            montarBusinessHoursDia(data, expediente),
          )
        : [];
    const datasSemExpediente =
      visualizacao === "timeGridWeek"
        ? datas
            .filter(
              (data) =>
                !obterExpedienteDia(
                  data,
                  horariosFuncionamento,
                  excecoesFuncionamento,
                ),
            )
            .map(dataLocalISO)
        : [];

    const bloqueiosGrade =
      visualizacao === "timeGridWeek"
        ? datas.flatMap((data) => {
            const dataConsulta = dataLocalISO(data);
            const expediente = obterExpedienteDia(
              data,
              horariosFuncionamento,
              excecoesFuncionamento,
            );
            const bloqueios: Array<{ id: string; start: string; end: string }> =
              [];

            if (!expediente) {
              bloqueios.push({
                id: `sem-funcionamento-${dataConsulta}`,
                start: `${dataConsulta}T${slotMinTime}`,
                end: `${dataConsulta}T${slotMaxTime}`,
              });
              return bloqueios;
            }

            if (compararHorarios(expediente.inicio, menorInicio) > 0) {
              bloqueios.push({
                id: `antes-funcionamento-${dataConsulta}`,
                start: `${dataConsulta}T${slotMinTime}`,
                end: `${dataConsulta}T${horaSlot(expediente.inicio)}`,
              });
            }

            if (maiorFim && compararHorarios(expediente.fim, maiorFim) < 0) {
              bloqueios.push({
                id: `apos-funcionamento-${dataConsulta}`,
                start: `${dataConsulta}T${horaSlot(expediente.fim)}`,
                end: `${dataConsulta}T${slotMaxTime}`,
              });
            }

            bloqueios.push(
              ...montarBloqueiosIntervalo(dataConsulta, expediente),
            );

            for (const bloqueio of obterBloqueiosParciaisDia(
              data,
              excecoesFuncionamento,
            )) {
              bloqueios.push({
                id: `bloqueio-${bloqueio.id}-${dataConsulta}`,
                start: `${dataConsulta}T${horaSlot(bloqueio.hora_inicio)}`,
                end: `${dataConsulta}T${horaSlot(bloqueio.hora_fim)}`,
              });
            }

            return bloqueios;
          })
        : (() => {
            const dataConsulta = dataLocalISO(dataReferencia);
            const expediente = obterExpedienteDia(
              dataReferencia,
              horariosFuncionamento,
              excecoesFuncionamento,
            );
            const bloqueios = expediente
              ? montarBloqueiosIntervalo(dataConsulta, expediente)
              : [];

            for (const bloqueio of obterBloqueiosParciaisDia(
              dataReferencia,
              excecoesFuncionamento,
            )) {
              bloqueios.push({
                id: `bloqueio-${bloqueio.id}-${dataConsulta}`,
                start: `${dataConsulta}T${horaSlot(bloqueio.hora_inicio)}`,
                end: `${dataConsulta}T${horaSlot(bloqueio.hora_fim)}`,
              });
            }

            return bloqueios;
          })();

    return {
      slotMinTime,
      slotMaxTime,
      businessHoursGrade,
      bloqueiosGrade,
      datasSemExpediente,
      semFuncionamento: false,
    };
  }, [
    dataReferencia,
    excecoesFuncionamento,
    horariosFuncionamento,
    visualizacao,
  ]);

  const contentMargin = isCollapsed ? "ml-20" : "ml-64";
  const carregandoFuncionamento =
    visualizacao !== "dayGridMonth" &&
    (funcionamentoQuery.isLoading || excecoesQuery.isLoading);
  const mostrarEstadoSemFuncionamento =
    visualizacao !== "dayGridMonth" && gradeFuncionamento.semFuncionamento;

  const handleVisualizacao = (novaVisualizacao: VisualizacaoAgenda) => {
    setVisualizacao(novaVisualizacao);
    calendarioRef.current?.changeView(novaVisualizacao);
  };

  const anteriorDesabilitado = useMemo(() => {
    const hoje = dataHojeISO();
    if (visualizacao === "dayGridMonth") return mesAnoAtual(dataReferencia);
    if (visualizacao === "timeGridWeek") {
      return (
        inicioSemanaISO(dataReferencia) <= hoje &&
        fimSemanaISO(dataReferencia) >= hoje
      );
    }
    const dataAtual = dataLocalISO(dataReferencia);
    return dataAtual <= hoje;
  }, [dataReferencia, visualizacao]);

  const hojeLabel = `Hoje · ${formatarDataCurta(new Date())}`;

  const handleFiltrosChange = (novosFiltros: EstadoFiltrosAgenda) => {
    const params = new URLSearchParams(searchParams.toString());

    // Os filtros operacionais ficam na URL para permitir compartilhamento,
    // recarregamento da página e cache consistente no TanStack Query.
    for (const chave of [
      "psicologo_id",
      "sala_id",
      "paciente_id",
      "status",
      "tipo_atendimento",
    ]) {
      const valor = novosFiltros[chave as keyof EstadoFiltrosAgenda];
      if (valor === undefined || valor === null || valor === "") {
        params.delete(chave);
      } else {
        params.set(chave, String(valor));
      }
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const abrirModalConsulta = useCallback(
    (valores?: {
      data_consulta?: string;
      horario_inicio?: string;
      horario_fim?: string;
      paciente_id?: number;
    }) => {
      setConsultasDiaSelecionado(null);
      setModoModalConsulta("criar");
      setValoresIniciaisConsulta(valores);
      setModalConsultaAberto(true);
    },
    [],
  );

  const fecharModalConsulta = useCallback(() => {
    setModalConsultaAberto(false);
    setValoresIniciaisConsulta(undefined);
    fluxoIniciarAtendimentoRef.current = null;
    consultaSalvaNoFluxoRef.current = false;
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const abrirNovaConsulta =
      params.get("abrir_nova_consulta") === "1" ||
      Boolean(sessionStorage.getItem("neurosync:nova_consulta_paciente"));

    if (!abrirNovaConsulta) return;

    const pacienteAgendarId =
      numeroParametro(params, "paciente_agendar_id") ??
      (() => {
        try {
          const backup = sessionStorage.getItem(
            "neurosync:nova_consulta_paciente",
          );
          if (!backup) return undefined;
          const parsed = JSON.parse(backup) as {
            paciente_id?: number;
            abrir_nova_consulta?: string;
          };
          return parsed.paciente_id;
        } catch {
          return undefined;
        }
      })();

    abrirModalConsulta({
      data_consulta: dataHojeISO(),
      paciente_id: pacienteAgendarId,
    });
    fluxoIniciarAtendimentoRef.current = pacienteAgendarId ?? null;
    consultaSalvaNoFluxoRef.current = false;

    params.delete("abrir_nova_consulta");
    params.delete("paciente_agendar_id");

    sessionStorage.removeItem("neurosync:nova_consulta_paciente");

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [abrirModalConsulta, pathname, router, searchParams]);

  const abrirEdicaoConsulta = (
    consulta: ConsultaAgenda,
    modo: "editar" | "remarcar",
  ) => {
    setConsultasDiaSelecionado(null);
    setConsultaSelecionada(null);
    setModoModalConsulta(modo);
    setValoresIniciaisConsulta({
      id: consulta.id,
      paciente_id: consulta.paciente_id,
      psicologo_id: consulta.psicologo_id,
      sala_id: consulta.sala_id,
      data_consulta: consulta.data_consulta,
      horario_inicio: consulta.horario_inicio.slice(0, 5),
      horario_fim: consulta.horario_fim.slice(0, 5),
      tipo_atendimento: consulta.tipo_atendimento,
      tipo_outro: consulta.tipo_outro,
      observacoes: consulta.observacoes,
    });
    setModalConsultaAberto(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0]">
      <Sidebar
        perfilId={usuario?.perfil_id || 1}
        onLogout={fazerLogout}
        usuario={usuario}
      />

      <div className={contentMargin}>
        <div className="px-8 pt-8 pb-2">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Agenda</h1>
              <p className="mt-1 text-sm text-gray-500">
                Gerencie consultas, horários e disponibilidade da clínica.
              </p>
            </div>

            <button
              type="button"
              onClick={() => abrirModalConsulta()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#9F64AF] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#8B509B]"
            >
              <Plus size={16} />
              Nova consulta
            </button>
          </header>
        </div>

        <main className="px-8 pb-8">
          <div className="mx-auto max-w-5xl space-y-8 pt-4">
            <section className="mt-4 rounded-2xl border border-[#9F64AF]/20 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-2">
                <RxGear size={16} className="text-[#9F64AF] animate-spin" />
                <h2 className="text-sm font-semibold text-gray-800">
                  Resumo operacional
                </h2>
              </div>

              <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
                <div className="flex min-w-0 flex-col">
                  <span className="text-xs text-gray-500">Consultas hoje</span>
                  <span className="font-semibold text-gray-800">
                    {resumoOperacional.consultasHoje}
                  </span>
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="text-xs text-gray-500">
                    Próxima consulta
                  </span>
                  <span className="min-w-0 font-semibold text-gray-800">
                    <span className="block leading-5">
                      {resumoOperacional.proximaConsulta.horario}
                    </span>
                    {resumoOperacional.proximaConsulta.descricao && (
                      <span className="block truncate text-xs leading-4 text-gray-500">
                        {resumoOperacional.proximaConsulta.descricao}
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="text-xs text-gray-500">Salas ocupadas</span>
                  <span className="font-semibold text-gray-800">
                    {resumoOperacional.salasOcupadas}
                  </span>
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="text-xs text-gray-500">
                    Faltas da semana
                  </span>
                  <span className="font-semibold text-gray-800">
                    {resumoOperacional.faltasSemana}
                  </span>
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="text-xs text-gray-500">Agenda do dia</span>
                  <span className="font-semibold text-gray-800">
                    {resumoOperacional.agendaDia}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#9F64AF]/20 bg-white/70 p-4 shadow-sm backdrop-blur-sm sm:p-5">
              <div className="relative z-30 mb-4 flex flex-wrap items-center justify-between gap-3">
                <ToolbarAgenda
                  titulo={tituloCalendario}
                  hojeLabel={hojeLabel}
                  visualizacao={visualizacao}
                  onVisualizacaoChange={handleVisualizacao}
                  onHoje={() => calendarioRef.current?.today()}
                  onAnterior={() => {
                    if (!anteriorDesabilitado) calendarioRef.current?.prev();
                  }}
                  onProximo={() => calendarioRef.current?.next()}
                  anteriorDesabilitado={anteriorDesabilitado}
                />

                <div className="flex items-center gap-3">
                  <FiltrosAgenda
                    filtros={filtros}
                    pacientes={opcoes.pacientes}
                    psicologos={opcoes.psicologos}
                    salas={opcoes.salas}
                    onChange={handleFiltrosChange}
                  />
                  <span className="whitespace-nowrap text-sm text-gray-600">
                    {contadorConsultas(consultas.length)}
                  </span>
                </div>
              </div>

              {isLoading || carregandoFuncionamento ? (
                <div className="flex justify-center py-16">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#9F64AF] border-t-transparent" />
                </div>
              ) : mostrarEstadoSemFuncionamento ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#9F64AF]/25 bg-white/55 px-6 py-16 text-center">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#9F64AF]">
                    <RxGear size={18} />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    Nenhum horário de funcionamento configurado
                  </h3>
                  <p className="mt-2 max-w-md text-sm text-gray-500">
                    Configure os horários de atendimento da clínica para
                    visualizar a agenda deste período.
                  </p>
                </div>
              ) : (
                <CalendarioAgenda
                  ref={calendarioRef}
                  consultas={consultas}
                  visualizacao={visualizacao}
                  slotMinTime={gradeFuncionamento.slotMinTime}
                  slotMaxTime={gradeFuncionamento.slotMaxTime}
                  businessHoursGrade={gradeFuncionamento.businessHoursGrade}
                  bloqueiosGrade={gradeFuncionamento.bloqueiosGrade}
                  datasSemExpediente={gradeFuncionamento.datasSemExpediente}
                  onPeriodoChange={({ titulo, dataReferencia }) => {
                    setTituloCalendario((tituloAtual) =>
                      tituloAtual === titulo ? tituloAtual : titulo,
                    );
                    setDataReferencia((dataAtual) =>
                      dataLocalISO(dataAtual) === dataLocalISO(dataReferencia)
                        ? dataAtual
                        : dataReferencia,
                    );
                  }}
                  onSelecionarHorario={abrirModalConsulta}
                  onSelecionarConsulta={setConsultaSelecionada}
                  onSelecionarDiaComConsultas={(params) =>
                    setConsultasDiaSelecionado(params)
                  }
                />
              )}
            </section>
          </div>
        </main>
      </div>

      <ModalNovaConsulta
        aberto={modalConsultaAberto}
        onClose={fecharModalConsulta}
        pacientes={pacientesModal}
        psicologos={opcoes.psicologos}
        salas={opcoes.salas}
        valoresIniciais={valoresIniciaisConsulta}
        modo={modoModalConsulta}
        onSuccess={() => {
          setConsultaSelecionada(null);
          consultaSalvaNoFluxoRef.current = true;
        }}
      />

      <ModalConsultasDia
        aberto={Boolean(consultasDiaSelecionado)}
        data={consultasDiaSelecionado?.data || ""}
        consultas={consultasDiaSelecionado?.consultas || []}
        onClose={() => setConsultasDiaSelecionado(null)}
        onNovaConsulta={(data) =>
          abrirModalConsulta({
            data_consulta: data,
          })
        }
        onSelecionarConsulta={(consulta) => {
          setConsultasDiaSelecionado(null);
          setConsultaSelecionada(consulta);
        }}
      />

      <PainelDetalhesConsulta
        aberto={Boolean(consultaSelecionada)}
        consulta={consultaSelecionada}
        onClose={() => setConsultaSelecionada(null)}
        onRemarcar={(consulta) => abrirEdicaoConsulta(consulta, "remarcar")}
      />
    </div>
  );
}
