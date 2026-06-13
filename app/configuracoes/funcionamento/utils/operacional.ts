import type { Excecao, Horario } from "../types";
import { calcularMinutos, formatarMinutos } from "./calculos";
import { excecaoAtingeData, obterDataLocalISO } from "./calendario";

export const DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const DIAS_UTEIS = [1, 2, 3, 4, 5];
export const FINS_DE_SEMANA = [0, 6];

export function normalizarHorario(valor?: string | null): string {
  return !valor || valor === "00:00" ? "" : valor;
}

export function normalizarHorarioNullable(
  valor?: string | null,
): string | null {
  const normalizado = normalizarHorario(valor);
  return normalizado || null;
}

export function normalizarHorarioSemanal(horario: Horario): Horario {
  return {
    ...horario,
    hora_inicio: normalizarHorario(horario.hora_inicio),
    hora_fim: normalizarHorario(horario.hora_fim),
    intervalo_inicio: normalizarHorarioNullable(horario.intervalo_inicio),
    intervalo_fim: normalizarHorarioNullable(horario.intervalo_fim),
    ativo: Boolean(horario.ativo),
  };
}

export function criarHorarioPadrao(diaSemana: number): Horario {
  return {
    dia_semana: diaSemana,
    hora_inicio: "",
    hora_fim: "",
    intervalo_inicio: null,
    intervalo_fim: null,
    ativo: false,
  };
}

export function montarHorariosSemana(dataSemanal?: Horario[]): Horario[] {
  return Array.from({ length: 7 }, (_, diaSemana) => {
    const existente = dataSemanal?.find(
      (h) => h.dia_semana === diaSemana && !h.data_especifica,
    );
    return existente
      ? normalizarHorarioSemanal(existente)
      : criarHorarioPadrao(diaSemana);
  });
}

export function clonarHorarios(lista: Horario[]): Horario[] {
  return lista.map((horario) => ({ ...horario }));
}

export function horariosIguais(a: Horario, b: Horario): boolean {
  return (
    Boolean(a.ativo) === Boolean(b.ativo) &&
    normalizarHorario(a.hora_inicio) === normalizarHorario(b.hora_inicio) &&
    normalizarHorario(a.hora_fim) === normalizarHorario(b.hora_fim) &&
    normalizarHorarioNullable(a.intervalo_inicio) ===
      normalizarHorarioNullable(b.intervalo_inicio) &&
    normalizarHorarioNullable(a.intervalo_fim) ===
      normalizarHorarioNullable(b.intervalo_fim)
  );
}

export function listasHorariosIguais(a: Horario[], b: Horario[]): boolean {
  return a.length === b.length && a.every((h, i) => horariosIguais(h, b[i]));
}

export function temExpedienteOuIntervalo(horario: Horario): boolean {
  return Boolean(
    normalizarHorario(horario.hora_inicio) ||
      normalizarHorario(horario.hora_fim) ||
      normalizarHorarioNullable(horario.intervalo_inicio) ||
      normalizarHorarioNullable(horario.intervalo_fim),
  );
}

export function temHorarioPreenchido(horario: Horario): boolean {
  return Boolean(
    horario.ativo &&
      normalizarHorario(horario.hora_inicio) &&
      normalizarHorario(horario.hora_fim),
  );
}

export function calcularEstatisticasFuncionamento(horarios: Horario[]) {
  const diasAtivos = horarios.filter((h) => h.ativo).length;
  const minutosSemanais = horarios.reduce((total, h) => {
    if (!h.ativo || !h.hora_inicio || !h.hora_fim) return total;
    let duracao = calcularMinutos(h.hora_fim) - calcularMinutos(h.hora_inicio);
    if (h.intervalo_inicio && h.intervalo_fim) {
      duracao -=
        calcularMinutos(h.intervalo_fim) - calcularMinutos(h.intervalo_inicio);
    }
    return total + duracao;
  }, 0);

  return {
    diasAtivos,
    horasSemanais: formatarMinutos(minutosSemanais),
  };
}

export function obterExcecoesAtivas(excecoes: Excecao[]): Excecao[] {
  return excecoes.filter((excecao) => excecao.ativo !== 0);
}

export function excecaoBloqueiaDiaTodo(excecao: Excecao): boolean {
  return (
    ["ferias", "bloqueio"].includes(excecao.tipo) &&
    !excecao.hora_inicio &&
    !excecao.hora_fim
  );
}

export function excecaoBloqueiaParcialmente(excecao: Excecao): boolean {
  return (
    (excecao.tipo === "bloqueio" || excecao.tipo === "excecao") &&
    Boolean(excecao.hora_inicio && excecao.hora_fim)
  );
}

export function obterIndisponibilidadesTotais(excecoes: Excecao[]): Excecao[] {
  return obterExcecoesAtivas(excecoes).filter(excecaoBloqueiaDiaTodo);
}

export function obterBloqueiosParciais(excecoes: Excecao[]): Excecao[] {
  return obterExcecoesAtivas(excecoes).filter(excecaoBloqueiaParcialmente);
}

export function intervalosSobrepostos(
  inicioA: string,
  fimA: string,
  inicioB: string,
  fimB: string,
): boolean {
  return inicioA < fimB && inicioB < fimA;
}

export function obterBloqueiosFuturos(excecoes: Excecao[]): Excecao[] {
  const hoje = obterDataLocalISO(new Date());
  return obterExcecoesAtivas(excecoes).filter(
    (e) => e.tipo === "bloqueio" && e.data_especifica >= hoje,
  );
}

export function obterProximoFeriado(excecoes: Excecao[]): Excecao | null {
  const hoje = obterDataLocalISO(new Date());
  return (
    obterExcecoesAtivas(excecoes)
      .filter((e) => e.tipo === "feriado" && e.data_especifica >= hoje)
      .sort((a, b) => a.data_especifica.localeCompare(b.data_especifica))[0] ||
    null
  );
}

export function obterFeriasProgramadas(excecoes: Excecao[]): Excecao[] {
  const hoje = obterDataLocalISO(new Date());
  return obterExcecoesAtivas(excecoes)
    .filter(
      (e) =>
        e.tipo === "ferias" &&
        (e.data_especifica >= hoje || (e.data_fim && e.data_fim >= hoje)),
    )
    .sort((a, b) => a.data_especifica.localeCompare(b.data_especifica));
}

export function dataPossuiIndisponibilidadeTotal(
  excecoes: Excecao[],
  dataISO: string,
): boolean {
  return obterIndisponibilidadesTotais(excecoes).some((excecao) =>
    excecaoAtingeData(excecao, dataISO),
  );
}
