// app/configuracoes/funcionamento/utils/validacoesHorario.ts

import type { AplicacaoMensalFuncionamento, Excecao } from "../types";
import { excecaoAtingeData, obterDataLocalISO } from "./calendario";
import {
  intervalosSobrepostos,
  obterBloqueiosParciais,
  obterIndisponibilidadesTotais,
} from "./operacional";

const REGEX_HORARIO = /^([01]\d|2[0-3]):[0-5]\d$/;

function horarioValido(valor?: string | null): boolean {
  return Boolean(valor && REGEX_HORARIO.test(valor));
}

export function validarHorario(
  inicio: string,
  fim: string,
): Record<string, string | undefined> {
  const erros: Record<string, string | undefined> = {};

  if (!horarioValido(inicio)) erros.hora_inicio = "Obrigatório";
  if (!horarioValido(fim)) erros.hora_fim = "Obrigatório";
  if (horarioValido(inicio) && horarioValido(fim) && inicio >= fim) {
    erros.hora_inicio = "Inválido";
    erros.hora_fim = "Inválido";
  }
  return erros;
}

export function validarIntervalo(
  inicio: string,
  fim: string,
  intervaloInicio: string | null,
  intervaloFim: string | null,
  ativo: boolean,
): Record<string, string | undefined> {
  const erros: Record<string, string | undefined> = {};

  if (!ativo) return erros;

  // Validação do expediente
  if (!horarioValido(inicio)) erros.hora_inicio = "Obrigatório";
  if (!horarioValido(fim)) erros.hora_fim = "Obrigatório";
  if (horarioValido(inicio) && horarioValido(fim) && inicio >= fim) {
    erros.hora_inicio = "Inválido";
    erros.hora_fim = "Inválido";
  }

  // Se ambos os campos do intervalo estiverem vazios, considera-se que o dia
  // não possui intervalo — nenhum erro é gerado. Apenas quando um deles está
  // preenchido e o outro não é que ambos se tornam obrigatórios.
  const temParcial = intervaloInicio || intervaloFim;
  const inicioIntervaloValido = horarioValido(intervaloInicio);
  const fimIntervaloValido = horarioValido(intervaloFim);
  if (temParcial) {
    if (!inicioIntervaloValido) erros.intervalo_inicio = "Informe o início e o fim do intervalo.";
    if (!fimIntervaloValido) erros.intervalo_fim = "Informe o início e o fim do intervalo.";
  }

  if (inicioIntervaloValido && fimIntervaloValido) {
    const intervaloInicioSeguro = intervaloInicio as string;
    const intervaloFimSeguro = intervaloFim as string;

    if (intervaloInicioSeguro >= intervaloFimSeguro) {
      // Início do intervalo deve ser estritamente menor que o fim
      erros.intervalo_inicio = "O início do intervalo deve ser antes do fim do intervalo.";
    }
    // Intervalo deve estar contido no expediente (não pode ser igual aos limites)
    if (inicio && intervaloInicioSeguro <= inicio) {
      erros.intervalo_inicio = "O intervalo deve estar dentro do horário de funcionamento.";
    }
    if (fim && intervaloFimSeguro >= fim) {
      erros.intervalo_fim = "O intervalo deve estar dentro do horário de funcionamento.";
    }
  }

  return erros;
}

export interface ResultadoValidacaoMensal {
  erros: Record<string, string | undefined>;
  avisos: string[];
}

function obterMesesParaAplicacao(mes: number | null, ano: number): number[] {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;

  if (mes) return [mes];

  return Array.from({ length: 12 }, (_, indice) => indice + 1).filter(
    (mesDoAno) => ano > anoAtual || mesDoAno >= mesAtual,
  );
}

function obterDatasDaAplicacao(
  aplicacao: AplicacaoMensalFuncionamento,
): string[] {
  const datas: string[] = [];
  const meses = obterMesesParaAplicacao(aplicacao.mes, aplicacao.ano);
  const hoje = obterDataLocalISO(new Date());

  for (const mes of meses) {
    const ultimoDia = new Date(aplicacao.ano, mes, 0).getDate();
    for (let dia = 1; dia <= ultimoDia; dia++) {
      const data = new Date(aplicacao.ano, mes - 1, dia);
      if (!aplicacao.dias_semana.includes(data.getDay())) continue;
      const dataISO = `${aplicacao.ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
      if (dataISO >= hoje) datas.push(dataISO);
    }
  }

  return datas;
}

export function obterDatasDaAplicacaoPontual(
  aplicacao: AplicacaoMensalFuncionamento,
): string[] {
  return obterDatasDaAplicacao(aplicacao);
}

export function validarAplicacaoMensalFuncionamento(
  aplicacao: AplicacaoMensalFuncionamento,
  excecoes: Excecao[],
  anoAtual = new Date().getFullYear(),
): ResultadoValidacaoMensal {
  const erros: Record<string, string | undefined> = {};
  const avisos: string[] = [];

  if (!Number.isInteger(aplicacao.ano)) {
    erros.ano = "Ano inválido";
  } else if (aplicacao.ano < anoAtual) {
    erros.ano = `Informe um ano igual ou posterior a ${anoAtual}.`;
  } else if (aplicacao.ano > anoAtual + 10) {
    erros.ano = `Ano deve ser no máximo ${anoAtual + 10}`;
  }

  if (
    aplicacao.mes !== null &&
    (!Number.isInteger(aplicacao.mes) ||
      aplicacao.mes < 1 ||
      aplicacao.mes > 12)
  ) {
    erros.mes = "Mês inválido";
  }

  if (aplicacao.dias_semana.length === 0) {
    erros.dias_semana = "Selecione pelo menos um dia";
  }

  const errosHorario = validarIntervalo(
    aplicacao.hora_inicio,
    aplicacao.hora_fim,
    aplicacao.intervalo_inicio,
    aplicacao.intervalo_fim,
    true,
  );

  if (errosHorario.hora_inicio) erros.hora_inicio = errosHorario.hora_inicio;
  if (errosHorario.hora_fim) erros.hora_fim = errosHorario.hora_fim;
  if (errosHorario.intervalo_inicio)
    erros.intervalo_inicio = errosHorario.intervalo_inicio;
  if (errosHorario.intervalo_fim)
    erros.intervalo_fim = errosHorario.intervalo_fim;

  const datasAfetadas = obterDatasDaAplicacao(aplicacao);
  if (
    datasAfetadas.length === 0 &&
    !erros.ano &&
    !erros.mes &&
    !erros.dias_semana
  ) {
    erros.periodo = "Nenhuma data futura será afetada por essa seleção";
  }

  const indisponibilidadesTotais = obterIndisponibilidadesTotais(excecoes);
  const bloqueiosParciais = obterBloqueiosParciais(excecoes);
  const conflitosParciais = datasAfetadas.filter((dataISO) =>
    bloqueiosParciais.some(
      (excecao) =>
        excecaoAtingeData(excecao, dataISO) &&
        excecao.hora_inicio &&
        excecao.hora_fim &&
        intervalosSobrepostos(
          aplicacao.hora_inicio,
          aplicacao.hora_fim,
          excecao.hora_inicio,
          excecao.hora_fim,
        ),
    ),
  );

  const datasComIndisponibilidades = datasAfetadas.filter((dataISO) =>
    indisponibilidadesTotais.some((excecao) =>
      excecaoAtingeData(excecao, dataISO),
    ),
  );

  if (datasComIndisponibilidades.length > 0 || conflitosParciais.length > 0) {
    avisos.push(
      "Alguns dias serão preservados por já possuírem férias, bloqueios ou exceções cadastradas.",
    );
  }

  return { erros, avisos };
}
