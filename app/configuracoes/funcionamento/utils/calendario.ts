import type { Excecao, Horario } from "../types";

export type TipoEventoCalendario = "funcionamento" | Excecao["tipo"];

export interface EventoCalendario {
  id: string;
  titulo: string;
  tipo: TipoEventoCalendario;
  corBg: string;
  corTexto: string;
  allDay: boolean;
  dataInicio?: string;
  dataFim?: string | null;
  diaSemana?: number;
  horaInicio?: string | null;
  horaFim?: string | null;
  descricao?: string | null;
}

const CORES_EVENTO: Record<TipoEventoCalendario, { bg: string; text: string }> =
  {
    funcionamento: { bg: "#F3EAF8", text: "#5F2D6D" },
    feriado: { bg: "#EFE3F6", text: "#6F3A82" },
    ferias: { bg: "#ECE9FF", text: "#433082" },
    bloqueio: { bg: "#F4EAF2", text: "#74375F" },
    excecao: { bg: "#F8E9F3", text: "#8A3363" },
  };

const TITULOS_PADRAO: Record<
  Exclude<TipoEventoCalendario, "funcionamento">,
  string
> = {
  feriado: "Feriado",
  ferias: "Férias",
  bloqueio: "Bloqueio",
  excecao: "Horário especial",
};

export function obterDataLocalISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function normalizarDataISO(data?: string | null): string {
  if (!data) return "";
  const match = String(data).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

export function adicionarDiasISO(dataISO: string, dias: number): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  data.setDate(data.getDate() + dias);
  return obterDataLocalISO(data);
}

export function excecaoAtingeData(excecao: Excecao, dataISO: string): boolean {
  const inicio = normalizarDataISO(excecao.data_especifica);
  const fim = normalizarDataISO(excecao.data_fim) || inicio;
  return dataISO >= inicio && dataISO <= fim;
}

export function montarEventosCalendario(
  horarios: Horario[],
  excecoes: Excecao[],
): EventoCalendario[] {
  const eventosFuncionamento = horarios
    .filter((h) => h.ativo && h.hora_inicio && h.hora_fim)
    .map<EventoCalendario>((h) => {
      const cores = CORES_EVENTO.funcionamento;
      const dataEspecifica = normalizarDataISO(h.data_especifica);
      const fimData = dataEspecifica ? adicionarDiasISO(dataEspecifica, 1) : "";
      return {
        id: dataEspecifica
          ? `func-data-${dataEspecifica}`
          : `func-${h.dia_semana}`,
        titulo: `${h.hora_inicio.slice(0, 5)} até ${h.hora_fim.slice(0, 5)}`,
        tipo: "funcionamento",
        corBg: cores.bg,
        corTexto: cores.text,
        allDay: Boolean(dataEspecifica),
        dataInicio: dataEspecifica || undefined,
        dataFim: dataEspecifica ? fimData : null,
        diaSemana: h.dia_semana,
        horaInicio: h.hora_inicio,
        horaFim: h.hora_fim,
      };
    });

  const eventosExcecoes = excecoes
    .filter((e) => e.ativo !== 0)
    .map<EventoCalendario>((e) => {
      const cores = CORES_EVENTO[e.tipo] || CORES_EVENTO.excecao;
      const temHorario = Boolean(e.hora_inicio && e.hora_fim);
      const tituloBase = e.descricao || TITULOS_PADRAO[e.tipo];
      const titulo = temHorario
        ? `${e.hora_inicio?.slice(0, 5)} até ${e.hora_fim?.slice(0, 5)} ${e.descricao || ""}`.trim()
        : tituloBase;

      return {
        id: `exc-${e.id}`,
        titulo,
        tipo: e.tipo,
        corBg: cores.bg,
        corTexto: cores.text,
        allDay: !temHorario,
        dataInicio: normalizarDataISO(e.data_especifica),
        dataFim: normalizarDataISO(e.data_fim) || null,
        horaInicio: e.hora_inicio || null,
        horaFim: e.hora_fim || null,
        descricao: e.descricao || null,
      };
    });

  return [...eventosFuncionamento, ...eventosExcecoes];
}

export function eventosDoDia(
  eventos: EventoCalendario[],
  data: Date,
): EventoCalendario[] {
  const dataISO = obterDataLocalISO(data);
  const diaSemana = data.getDay();

  // Pontual de funcionamento prevalece sobre semanal para a mesma data
  const temFuncionamentoPontual = eventos.some(
    (e) => e.tipo === "funcionamento" && e.dataInicio === dataISO,
  );

  return eventos
    .filter((evento) => {
      if (evento.tipo === "funcionamento") {
        if (evento.dataInicio) {
          const inicio = evento.dataInicio;
          const fim = evento.dataFim || inicio;
          return dataISO >= inicio && dataISO <= fim;
        }
        if (temFuncionamentoPontual) return false;
        return evento.diaSemana === diaSemana;
      }
      const inicio = evento.dataInicio || "";
      const fim = evento.dataFim || inicio;
      return dataISO >= inicio && dataISO <= fim;
    })
    .map((evento) => ({ ...evento, id: `${evento.id}-${dataISO}` }));
}

export function eventosParaFullCalendar(eventos: EventoCalendario[]) {
  return eventos.map((evento) => {
    const base = {
      id: evento.id,
      title: evento.titulo,
      backgroundColor: evento.corBg,
      textColor: evento.corTexto,
      borderColor: "transparent",
      classNames: [
        `evento-${evento.tipo}`,
        evento.tipo === "funcionamento"
          ? "evento-funcionamento"
          : "evento-excecao",
      ],
      extendedProps: {
        tipo: evento.tipo,
        descricao: evento.descricao,
      },
    };

    if (evento.tipo === "funcionamento") {
      if (evento.dataInicio) {
        return {
          ...base,
          start: evento.dataInicio,
          end: evento.dataFim || adicionarDiasISO(evento.dataInicio, 1),
          allDay: true,
        };
      }
      return {
        ...base,
        daysOfWeek: [evento.diaSemana],
        startTime: evento.horaInicio,
        endTime: evento.horaFim,
        allDay: false,
      };
    }

    if (!evento.allDay) {
      return {
        ...base,
        start: `${evento.dataInicio}T${evento.horaInicio}`,
        end: `${evento.dataInicio}T${evento.horaFim}`,
        allDay: false,
      };
    }

    // FullCalendar usa fim exclusivo para eventos all-day; o sistema armazena data_fim inclusiva.
    return {
      ...base,
      start: evento.dataInicio,
      end: evento.dataFim ? adicionarDiasISO(evento.dataFim, 1) : undefined,
      allDay: true,
    };
  });
}


