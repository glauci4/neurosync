import type { Excecao, Horario } from "@/app/configuracoes/funcionamento/types";
import { calcularMinutos } from "@/app/configuracoes/funcionamento/utils/calculos";
import {
  excecaoAtingeData,
  obterDataLocalISO,
} from "@/app/configuracoes/funcionamento/utils/calendario";
import {
  obterBloqueiosParciais,
  obterExcecoesAtivas,
  obterIndisponibilidadesTotais,
} from "@/app/configuracoes/funcionamento/utils/operacional";

interface IntervaloMinutos {
  inicio: number;
  fim: number;
}

function criarIntervalosBase(horario: Horario): IntervaloMinutos[] {
  const inicio = calcularMinutos(horario.hora_inicio);
  const fim = calcularMinutos(horario.hora_fim);

  if (!horario.intervalo_inicio || !horario.intervalo_fim) {
    return [{ inicio, fim }];
  }

  const intervaloInicio = calcularMinutos(horario.intervalo_inicio);
  const intervaloFim = calcularMinutos(horario.intervalo_fim);

  return [
    { inicio, fim: intervaloInicio },
    { inicio: intervaloFim, fim },
  ].filter((intervalo) => intervalo.fim > intervalo.inicio);
}

function subtrairIntervalo(
  intervalos: IntervaloMinutos[],
  corte: IntervaloMinutos,
): IntervaloMinutos[] {
  return intervalos.flatMap((intervalo) => {
    if (intervalo.inicio >= corte.fim || corte.inicio >= intervalo.fim) {
      return [intervalo];
    }

    const partes: IntervaloMinutos[] = [];
    if (corte.inicio > intervalo.inicio) {
      partes.push({
        inicio: intervalo.inicio,
        fim: Math.min(corte.inicio, intervalo.fim),
      });
    }
    if (corte.fim < intervalo.fim) {
      partes.push({
        inicio: Math.max(corte.fim, intervalo.inicio),
        fim: intervalo.fim,
      });
    }
    return partes.filter((parte) => parte.fim > parte.inicio);
  });
}

function somarIntervalos(intervalos: IntervaloMinutos[]) {
  return intervalos.reduce(
    (total, intervalo) => total + (intervalo.fim - intervalo.inicio),
    0,
  );
}

export function calcularHorasDisponiveisPeriodo(
  horarios: Horario[],
  excecoes: Excecao[],
  dataInicio: string,
  dataFim: string,
) {
  if (!dataInicio || !dataFim) return 0;

  const inicio = new Date(`${dataInicio}T12:00:00`);
  const fim = new Date(`${dataFim}T12:00:00`);

  if (
    Number.isNaN(inicio.getTime()) ||
    Number.isNaN(fim.getTime()) ||
    inicio > fim
  ) {
    return 0;
  }

  const horariosAtivos = horarios.filter(
    (horario) => horario.ativo && horario.hora_inicio && horario.hora_fim,
  );
  const excecoesAtivas = obterExcecoesAtivas(excecoes);
  const indisponibilidadesTotais = obterIndisponibilidadesTotais(excecoes);
  const bloqueiosParciais = obterBloqueiosParciais(excecoesAtivas);

  let totalMinutos = 0;

  for (
    const dataAtual = new Date(inicio);
    dataAtual <= fim;
    dataAtual.setDate(dataAtual.getDate() + 1)
  ) {
    const dataISO = obterDataLocalISO(dataAtual);
    const diaSemana = dataAtual.getDay();

    const horariosDoDia = horariosAtivos.filter(
      (horario) => horario.dia_semana === diaSemana,
    );

    if (horariosDoDia.length === 0) continue;

    if (
      indisponibilidadesTotais.some((excecao) =>
        excecaoAtingeData(excecao, dataISO),
      )
    ) {
      continue;
    }

    let intervalosDisponiveis = horariosDoDia.flatMap(criarIntervalosBase);

    const bloqueiosDoDia = bloqueiosParciais.filter(
      (excecao) =>
        excecaoAtingeData(excecao, dataISO) &&
        Boolean(excecao.hora_inicio && excecao.hora_fim),
    );

    for (const bloqueio of bloqueiosDoDia) {
      const corte = {
        inicio: calcularMinutos(bloqueio.hora_inicio as string),
        fim: calcularMinutos(bloqueio.hora_fim as string),
      };
      intervalosDisponiveis = subtrairIntervalo(intervalosDisponiveis, corte);
    }

    totalMinutos += somarIntervalos(intervalosDisponiveis);
  }

  return Number((totalMinutos / 60).toFixed(2));
}

