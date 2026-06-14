import type { FiltrosRelatorios } from "../types/relatorios.types";

export interface ErrosPeriodoRelatorios {
  data_inicio?: string;
  data_fim?: string;
  geral?: string;
  isValid: boolean;
  errors: {
    dataInicio?: string;
    dataFim?: string;
  };
  errorMessage?: string;
}

const MENSAGEM_DATA_INVALIDA = "Informe uma data válida.";
const ANO_MINIMO = 1900;
const ANO_MAXIMO = 2100;

function resultado(erros: Omit<ErrosPeriodoRelatorios, "isValid" | "errors">) {
  const dataInicio = erros.data_inicio || erros.geral;
  const dataFim = erros.data_fim || erros.geral;

  return {
    ...erros,
    isValid: !dataInicio && !dataFim,
    errors: {
      dataInicio,
      dataFim,
    },
    errorMessage: erros.geral || erros.data_inicio || erros.data_fim,
  };
}

function parseDataIso(valor?: string) {
  if (!valor) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!match) return null;

  const ano = Number(match[1]);
  const mes = Number(match[2]);
  const dia = Number(match[3]);

  if (ano < ANO_MINIMO || ano > ANO_MAXIMO) return null;
  if (mes < 1 || mes > 12) return null;
  if (dia < 1 || dia > 31) return null;

  const data = new Date(ano, mes - 1, dia);
  if (
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia
  ) {
    return null;
  }

  return data;
}

export function validarPeriodoRelatorios(
  filtros: FiltrosRelatorios,
): ErrosPeriodoRelatorios {
  const erros: Omit<ErrosPeriodoRelatorios, "isValid" | "errors"> = {};
  const { data_inicio, data_fim } = filtros;

  if (!data_inicio && !data_fim) {
    return resultado(erros);
  }

  if (data_inicio && !data_fim) {
    erros.data_fim = "Informe a data final do período.";
  }

  if (!data_inicio && data_fim) {
    erros.data_inicio = "Informe a data inicial do período.";
  }

  const dataInicio = parseDataIso(data_inicio);
  const dataFim = parseDataIso(data_fim);

  if (data_inicio && !dataInicio) {
    erros.data_inicio = MENSAGEM_DATA_INVALIDA;
  }

  if (data_fim && !dataFim) {
    erros.data_fim = MENSAGEM_DATA_INVALIDA;
  }

  if (dataInicio && dataFim) {
    if (dataInicio > dataFim) {
      erros.geral = "A data inicial não pode ser maior que a data final.";
    }
  }

  return resultado(erros);
}
