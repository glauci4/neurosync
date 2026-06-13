"use client";

import ExcelJS from "exceljs";

export interface PlanilhaExcel {
  nome: string;
  dados: Array<Record<string, string | number | null>>;
}

export interface ContextoExportacaoRelatorio {
  tituloRelatorio: string;
  nomeClinica?: string | null;
  periodo?: string;
  filtros?: Array<{ label: string; valor: string }>;
  resumoOperacional?: Array<{ label: string; valor: string | number }>;
}

type ValorCelula = string | number | null;
type LinhaDados = Record<string, ValorCelula>;

const CORES = {
  roxo: "5F2D6D",
  roxoClaro: "EADCF2",
  roxoMuitoClaro: "F8F3FB",
  roxoLuz: "FBF7FF",
  borda: "D9BCE8",
  texto: "334155",
  textoSecundario: "64748B",
  branco: "FFFFFF",
  verdeFundo: "EAF8F0",
  verdeTexto: "2F7A4E",
  amareloFundo: "FFF3E6",
  amareloTexto: "9A5A17",
  cinzaFundo: "EEF1F5",
  cinzaTexto: "64748B",
  vermelhoFundo: "FEECEC",
  vermelhoTexto: "9F2F36",
} as const;

function argb(rgb: string) {
  return `FF${rgb}`;
}

function dataArquivo() {
  return new Date().toISOString().slice(0, 10);
}

function dataHoraExportacao() {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());
}

function nomePlanilha(nome: string) {
  return (
    nome
      .replace(/[\\/?*[\]:]/g, " ")
      .trim()
      .slice(0, 31) || "Relatorio"
  );
}

function textoFiltros(contexto?: ContextoExportacaoRelatorio) {
  if (!contexto?.filtros?.length) return "Nenhum filtro aplicado";
  return contexto.filtros
    .map((item) => `${item.label}: ${item.valor}`)
    .join(" | ");
}

function tituloAbaResumo(nome: string) {
  return /resumo/i.test(nome);
}

function normalizarPlanilhasExportacao(
  planilhas: PlanilhaExcel[],
  contexto?: ContextoExportacaoRelatorio,
) {
  const lista = planilhas.length > 0 ? [...planilhas] : [];
  const primeiraEhResumo = tituloAbaResumo(lista[0]?.nome || "");
  const resumoAutomatico =
    contexto?.resumoOperacional?.length && !primeiraEhResumo
      ? ({
          nome: "Resumo operacional",
          dados: contexto.resumoOperacional.map((item) => ({
            Indicador: item.label,
            Valor: item.valor,
          })),
        } satisfies PlanilhaExcel)
      : null;

  if (resumoAutomatico) {
    lista.unshift(resumoAutomatico);
  }

  if (lista.length === 0) {
    return [
      {
        nome: "Relatorio",
        dados: [{ Mensagem: "Nenhum dado encontrado" }],
      } satisfies PlanilhaExcel,
    ];
  }

  return lista;
}

function obterColunas(dados: LinhaDados[]) {
  const conjunto = new Set<string>();
  for (const linha of dados) {
    for (const chave of Object.keys(linha || {})) {
      conjunto.add(chave);
    }
  }
  return Array.from(conjunto);
}

function valorComoTexto(valor: ValorCelula) {
  if (valor === null || valor === undefined) return "";
  return String(valor).trim();
}

function estimarLinhasTexto(texto: string, larguraColuna: number) {
  const conteudo = texto.trim();
  if (!conteudo) return 1;

  const linhas = conteudo.split(/\r?\n/);
  const caracteresPorLinha = Math.max(Math.floor(larguraColuna * 1.25), 10);

  return linhas.reduce((total, linha) => {
    const blocos = Math.max(1, Math.ceil(linha.length / caracteresPorLinha));
    return total + blocos;
  }, 0);
}

function calcularAlturaTexto(
  texto: string,
  larguraColuna: number,
  alturaMinima = 20,
  alturaMaxima = 72,
) {
  const linhas = estimarLinhasTexto(texto, larguraColuna);
  return Math.min(alturaMaxima, Math.max(alturaMinima, linhas * 16));
}

function valorEhNumero(valor: ValorCelula) {
  return typeof valor === "number" && Number.isFinite(valor);
}

function valorEhData(valor: ValorCelula) {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(valorComoTexto(valor));
}

function valorEhHora(valor: ValorCelula) {
  return /^\d{2}:\d{2}$/.test(valorComoTexto(valor));
}

function valorEhPercentual(valor: ValorCelula) {
  return /^\d+(?:[.,]\d+)?%$/.test(valorComoTexto(valor));
}

function colunaExigeCentralizar(cabecalho: string, valor: ValorCelula) {
  if (valorEhNumero(valor)) return true;
  if (valorEhData(valor)) return true;
  if (valorEhHora(valor)) return true;
  if (valorEhPercentual(valor)) return true;

  return /status|situa|cadastro|quantidade|total|taxa|dia|dias|hor[aá]rio|hora|ocupa|percentual/i.test(
    cabecalho,
  );
}

function estiloStatus(valor: ValorCelula) {
  const texto = valorComoTexto(valor).toLowerCase();
  if (!texto) return null;

  if (
    texto.includes("ativo") ||
    texto.includes("atendimento") ||
    texto.includes("conclu")
  ) {
    return {
      font: { bold: true, color: { argb: argb(CORES.verdeTexto) } },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: argb(CORES.verdeFundo) },
      },
    } as const;
  }

  if (texto.includes("espera")) {
    return {
      font: { bold: true, color: { argb: argb(CORES.amareloTexto) } },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: argb(CORES.amareloFundo) },
      },
    } as const;
  }

  if (texto.includes("inativo") || texto.includes("encerrad")) {
    return {
      font: { bold: true, color: { argb: argb(CORES.cinzaTexto) } },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: argb(CORES.cinzaFundo) },
      },
    } as const;
  }

  if (texto.includes("cancel")) {
    return {
      font: { bold: true, color: { argb: argb(CORES.vermelhoTexto) } },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: argb(CORES.vermelhoFundo) },
      },
    } as const;
  }

  return null;
}

function criarRangeAutoFiltro(
  linhaCabecalho: number,
  totalLinhas: number,
  totalColunas: number,
) {
  const letraColuna = (indice: number) => {
    let valor = indice + 1;
    let resultado = "";
    while (valor > 0) {
      const resto = (valor - 1) % 26;
      resultado = String.fromCharCode(65 + resto) + resultado;
      valor = Math.floor((valor - 1) / 26);
    }
    return resultado;
  };

  return `A${linhaCabecalho}:${letraColuna(totalColunas - 1)}${totalLinhas}`;
}

function aplicarBordasTodasCelulas(
  worksheet: ExcelJS.Worksheet,
  linha: number,
  totalColunas: number,
  estilo?: Partial<ExcelJS.Style>,
) {
  const row = worksheet.getRow(linha);
  for (let coluna = 1; coluna <= totalColunas; coluna += 1) {
    const cell = row.getCell(coluna);
    cell.border = {
      top: { style: "thin", color: { argb: argb(CORES.borda) } },
      bottom: { style: "thin", color: { argb: argb(CORES.borda) } },
      left: { style: "thin", color: { argb: argb(CORES.borda) } },
      right: { style: "thin", color: { argb: argb(CORES.borda) } },
    };
    if (estilo?.fill) cell.fill = estilo.fill as ExcelJS.Fill;
    if (estilo?.font) cell.font = estilo.font as ExcelJS.Font;
    if (estilo?.alignment)
      cell.alignment = estilo.alignment as ExcelJS.Alignment;
    if (estilo?.numFmt) cell.numFmt = estilo.numFmt;
  }
}

function estilizarLinhaTitulo(
  worksheet: ExcelJS.Worksheet,
  linha: number,
  totalColunas: number,
  texto: string,
) {
  worksheet.mergeCells(linha, 1, linha, totalColunas);
  const cell = worksheet.getCell(linha, 1);
  cell.value = texto;
  cell.font = { bold: true, size: 16, color: { argb: argb(CORES.roxo) } };
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: argb(CORES.roxoMuitoClaro) },
  };
  cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
  aplicarBordasTodasCelulas(worksheet, linha, totalColunas);
}

function estilizarLinhaSecao(
  worksheet: ExcelJS.Worksheet,
  linha: number,
  totalColunas: number,
  texto: string,
) {
  worksheet.mergeCells(linha, 1, linha, totalColunas);
  const cell = worksheet.getCell(linha, 1);
  cell.value = texto;
  cell.font = { bold: true, size: 12, color: { argb: argb(CORES.roxo) } };
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: argb(CORES.roxoClaro) },
  };
  cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
  aplicarBordasTodasCelulas(worksheet, linha, totalColunas);
}

function estilizarLinhaMetadado(
  worksheet: ExcelJS.Worksheet,
  linha: number,
  totalColunas: number,
  rotulo: string,
  valor: string,
) {
  const ultimaColuna = Math.max(2, totalColunas);
  worksheet.mergeCells(linha, 2, linha, ultimaColuna);

  const celulaRotulo = worksheet.getCell(linha, 1);
  const celulaValor = worksheet.getCell(linha, 2);

  celulaRotulo.value = rotulo;
  celulaValor.value = valor;

  celulaRotulo.font = { bold: true, color: { argb: argb(CORES.roxo) } };
  celulaRotulo.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: argb(CORES.roxoMuitoClaro) },
  };
  celulaRotulo.alignment = {
    vertical: "middle",
    horizontal: "left",
    wrapText: true,
  };

  celulaValor.font = { color: { argb: argb(CORES.texto) } };
  celulaValor.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: argb(CORES.branco) },
  };
  celulaValor.alignment = {
    vertical: "middle",
    horizontal: "left",
    wrapText: true,
  };

  aplicarBordasTodasCelulas(worksheet, linha, totalColunas);
}

function valorParaCelula(valor: ValorCelula) {
  if (valor === null || valor === undefined) return "";
  return valor;
}

function preencherTabela(
  worksheet: ExcelJS.Worksheet,
  dados: LinhaDados[],
  colunas: string[],
  linhaCabecalho: number,
) {
  const linhaDadosInicial = linhaCabecalho + 1;

  const headerRow = worksheet.getRow(linhaCabecalho);
  colunas.forEach((coluna, indice) => {
    const cell = headerRow.getCell(indice + 1);
    cell.value = coluna;
    cell.font = { bold: true, color: { argb: argb(CORES.roxo) } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: argb(CORES.roxoClaro) },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin", color: { argb: argb(CORES.borda) } },
      bottom: { style: "thin", color: { argb: argb(CORES.borda) } },
      left: { style: "thin", color: { argb: argb(CORES.borda) } },
      right: { style: "thin", color: { argb: argb(CORES.borda) } },
    };
  });

  dados.forEach((linha, indiceLinha) => {
    const numeroLinha = linhaDadosInicial + indiceLinha;
    const row = worksheet.getRow(numeroLinha);
    const zebra = indiceLinha % 2 === 1;

    colunas.forEach((coluna, indiceColuna) => {
      const valor = linha[coluna] ?? "";
      const cell = row.getCell(indiceColuna + 1);
      cell.value = valorParaCelula(valor);

      const estiloStatusCelula = estiloStatus(valor);
      const alinhamento = colunaExigeCentralizar(coluna, valor)
        ? "center"
        : "left";

      if (estiloStatusCelula) {
        cell.font = estiloStatusCelula.font as ExcelJS.Font;
        cell.fill = estiloStatusCelula.fill as ExcelJS.Fill;
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
      } else {
        cell.font = { color: { argb: argb(CORES.texto) } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: argb(zebra ? CORES.roxoLuz : CORES.branco) },
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: alinhamento,
          wrapText: true,
        };
      }

      cell.border = {
        top: { style: "thin", color: { argb: argb(CORES.borda) } },
        bottom: { style: "thin", color: { argb: argb(CORES.borda) } },
        left: { style: "thin", color: { argb: argb(CORES.borda) } },
        right: { style: "thin", color: { argb: argb(CORES.borda) } },
      };
    });
  });
}

function ajustarLarguras(
  worksheet: ExcelJS.Worksheet,
  dados: LinhaDados[],
  colunas: string[],
) {
  const larguraPorColuna = colunas.map((coluna, indice) => {
    const larguraBase = Math.max(coluna.length + 4, 14);
    const maiorConteudo = dados.reduce((maior, linha) => {
      const valor = valorComoTexto(linha[coluna]);
      return Math.max(maior, valor.length + 2);
    }, larguraBase);

    const larguraMinima =
      coluna === "Indicador"
        ? 24
        : coluna === "Valor"
          ? 16
          : indice === 0
            ? 16
            : 14;

    const larguraMaxima =
      coluna === "Indicador"
        ? 36
        : coluna === "Valor"
          ? 24
          : indice === 0
            ? 34
            : 44;

    const larguraLimitada = Math.min(
      Math.max(maiorConteudo, larguraBase, larguraMinima),
      larguraMaxima,
    );

    return larguraLimitada;
  });

  worksheet.columns = larguraPorColuna.map((largura) => ({
    width: largura,
  }));
}

function definirLarguraMinimaResumo(
  worksheet: ExcelJS.Worksheet,
  colunas: string[],
) {
  if (!colunas.includes("Indicador") || !colunas.includes("Valor")) return;
  worksheet.getColumn(1).width = Math.max(
    worksheet.getColumn(1).width || 0,
    28,
  );
  worksheet.getColumn(2).width = Math.max(
    worksheet.getColumn(2).width || 0,
    18,
  );
}

function somarLarguraColunas(
  worksheet: ExcelJS.Worksheet,
  inicio: number,
  fim: number,
) {
  let total = 0;
  for (let coluna = inicio; coluna <= fim; coluna += 1) {
    total += Number(worksheet.getColumn(coluna).width || 14);
  }
  return total;
}

function ajustarAlturasPlanilha(
  worksheet: ExcelJS.Worksheet,
  dados: LinhaDados[],
  colunas: string[],
  temMetadados: boolean,
  linhaSecao: number,
  linhaCabecalho: number,
) {
  worksheet.getRow(1).height = 24;
  worksheet.getRow(linhaSecao).height = 22;
  worksheet.getRow(linhaCabecalho).height = 22;

  if (temMetadados) {
    const larguraRotulo = Number(worksheet.getColumn(1).width || 14);
    const larguraValor = Math.max(
      somarLarguraColunas(worksheet, 2, Math.max(colunas.length, 2)),
      18,
    );

    [
      { linha: 2, rotulo: "Clínica", valor: "Não informada" },
      { linha: 3, rotulo: "Período", valor: "Todos os registros disponíveis" },
      { linha: 4, rotulo: "Filtros", valor: "Nenhum filtro aplicado" },
      { linha: 5, rotulo: "Gerado em", valor: dataHoraExportacao() },
    ].forEach(({ linha, rotulo, valor }) => {
      const alturaRotulo = calcularAlturaTexto(rotulo, larguraRotulo, 20, 32);
      const alturaValor = calcularAlturaTexto(valor, larguraValor, 20, 72);
      worksheet.getRow(linha).height = Math.max(20, alturaRotulo, alturaValor);
    });

    worksheet.getRow(6).height = 8;
  } else {
    worksheet.getRow(2).height = 10;
  }

  const linhaInicialDados = linhaCabecalho + 1;
  dados.forEach((linha, indice) => {
    const numeroLinha = linhaInicialDados + indice;
    let maiorAltura = 20;

    colunas.forEach((coluna, indiceColuna) => {
      const valor = valorComoTexto(linha[coluna]);
      const larguraColuna = Number(
        worksheet.getColumn(indiceColuna + 1).width || 14,
      );
      maiorAltura = Math.max(
        maiorAltura,
        calcularAlturaTexto(valor, larguraColuna, 20, 72),
      );
    });

    worksheet.getRow(numeroLinha).height = maiorAltura;
  });
}

function configurarLayoutDaPlanilha(
  worksheet: ExcelJS.Worksheet,
  totalLinhas: number,
  totalColunas: number,
  linhaCabecalho: number,
) {
  worksheet.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
    margins: {
      left: 0.3,
      right: 0.3,
      top: 0.45,
      bottom: 0.45,
      header: 0.2,
      footer: 0.2,
    },
  };
  worksheet.views = [
    {
      state: "frozen",
      ySplit: linhaCabecalho,
      topLeftCell: `A${linhaCabecalho + 1}`,
      activeCell: `A${linhaCabecalho + 1}`,
    },
  ];
  worksheet.autoFilter = criarRangeAutoFiltro(
    linhaCabecalho,
    totalLinhas,
    totalColunas,
  );
  worksheet.properties.defaultRowHeight = 20;
}

async function criarWorkbookExcel(
  planilhas: PlanilhaExcel[],
  contexto?: ContextoExportacaoRelatorio,
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "NeuroSync";
  workbook.company = contexto?.nomeClinica || "NeuroSync";
  workbook.created = new Date();
  workbook.modified = new Date();

  if (contexto?.tituloRelatorio) {
    workbook.subject = contexto.tituloRelatorio;
    workbook.title = contexto.tituloRelatorio;
    workbook.description =
      contexto.periodo || "Relatório exportado pelo NeuroSync";
  }

  const planilhasValidas = normalizarPlanilhasExportacao(planilhas, contexto);

  planilhasValidas.forEach((planilha) => {
    const dados =
      planilha.dados.length > 0
        ? planilha.dados
        : [{ Mensagem: "Nenhum dado encontrado" }];
    const colunas = obterColunas(dados);
    const totalColunas = Math.max(colunas.length, 2);
    const worksheet = workbook.addWorksheet(nomePlanilha(planilha.nome));

    const tituloRelatorio =
      contexto?.tituloRelatorio?.toUpperCase() || planilha.nome.toUpperCase();
    const temMetadados = Boolean(contexto);

    let linhaAtual = 1;
    estilizarLinhaTitulo(worksheet, linhaAtual, totalColunas, tituloRelatorio);
    linhaAtual += 1;

    if (temMetadados) {
      estilizarLinhaMetadado(
        worksheet,
        linhaAtual,
        totalColunas,
        "Clínica",
        contexto?.nomeClinica || "Não informada",
      );
      linhaAtual += 1;

      estilizarLinhaMetadado(
        worksheet,
        linhaAtual,
        totalColunas,
        "Período",
        contexto?.periodo || "Todos os registros disponíveis",
      );
      linhaAtual += 1;

      estilizarLinhaMetadado(
        worksheet,
        linhaAtual,
        totalColunas,
        "Filtros",
        textoFiltros(contexto),
      );
      linhaAtual += 1;

      estilizarLinhaMetadado(
        worksheet,
        linhaAtual,
        totalColunas,
        "Gerado em",
        dataHoraExportacao(),
      );
      linhaAtual += 1;

      worksheet.getRow(linhaAtual).height = 8;
      linhaAtual += 1;
    } else {
      worksheet.getRow(linhaAtual).height = 10;
      linhaAtual += 1;
    }

    estilizarLinhaSecao(worksheet, linhaAtual, totalColunas, planilha.nome);
    const linhaSecao = linhaAtual;
    linhaAtual += 1;

    const linhaCabecalho = linhaAtual;
    preencherTabela(worksheet, dados, colunas, linhaCabecalho);

    const totalLinhas = linhaCabecalho + dados.length;
    ajustarLarguras(worksheet, dados, colunas);
    if (
      colunas.length === 2 &&
      colunas.includes("Indicador") &&
      colunas.includes("Valor")
    ) {
      definirLarguraMinimaResumo(worksheet, colunas);
    }
    ajustarAlturasPlanilha(
      worksheet,
      dados,
      colunas,
      temMetadados,
      linhaSecao,
      linhaCabecalho,
    );
    configurarLayoutDaPlanilha(
      worksheet,
      totalLinhas,
      totalColunas,
      linhaCabecalho,
    );

    const ultimaLinha = totalLinhas;
    for (let linha = 1; linha <= ultimaLinha; linha += 1) {
      if (linha === 1) {
        worksheet.getRow(linha).height = 24;
        continue;
      }

      if (temMetadados && linha >= 2 && linha <= 5) {
        worksheet.getRow(linha).height = 20;
        continue;
      }

      if (temMetadados && linha === 6) {
        worksheet.getRow(linha).height = 8;
        continue;
      }

      if (linha === linhaSecao) {
        worksheet.getRow(linha).height = 22;
        continue;
      }

      if (linha === linhaCabecalho) {
        worksheet.getRow(linha).height = 22;
        continue;
      }

      worksheet.getRow(linha).height = 20;
    }
  });

  return workbook.xlsx.writeBuffer();
}

export async function exportarExcel(
  planilhas: PlanilhaExcel[],
  nomeArquivo = `relatorio-neurosync-${dataArquivo()}.xlsx`,
  contexto?: ContextoExportacaoRelatorio,
) {
  const buffer = await criarWorkbookExcel(planilhas, contexto);
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}

export function formatarDataExcel(valor?: string | null) {
  if (!valor) return "";
  const data = new Date(`${String(valor).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(data.getTime())) return String(valor);
  return new Intl.DateTimeFormat("pt-BR").format(data);
}

export function horaExcel(valor?: string | null) {
  return String(valor || "").slice(0, 5);
}
