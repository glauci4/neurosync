import Papa from "papaparse";
import * as XLSX from "xlsx";
import type {
  LinhaImportacaoPaciente,
  TipoPacienteImportacao,
} from "../types/importacaoPacientes.types";

const COLUNAS_ESPERADAS = [
  "nome",
  "cpf",
  "telefone",
  "email",
  "data_nascimento",
  "tipo",
  "responsavel_nome",
  "responsavel_cpf",
  "observacoes",
];

function removerAcentos(valor: string) {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizarChaveColuna(chave: string) {
  return removerAcentos(String(chave || ""))
    .trim()
    .toLowerCase()
    .replace(/[^\w]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizarTipo(valor: unknown): TipoPacienteImportacao | "" {
  const texto = removerAcentos(String(valor || ""))
    .trim()
    .toLowerCase();
  if (["adulto", "maior", "maior_de_idade"].includes(texto)) return "adulto";
  if (["menor", "crianca", "adolescente", "menor_de_idade"].includes(texto))
    return "menor";
  return "";
}

function formatarDataExcel(serial: number) {
  const data = XLSX.SSF.parse_date_code(serial);
  if (!data) return "";
  return `${data.y}-${String(data.m).padStart(2, "0")}-${String(data.d).padStart(2, "0")}`;
}

export function normalizarDataImportada(valor: unknown) {
  if (typeof valor === "number") return formatarDataExcel(valor);
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    const ano = valor.getFullYear();
    const mes = String(valor.getMonth() + 1).padStart(2, "0");
    const dia = String(valor.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }

  const texto = String(valor || "").trim();
  if (!texto) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;

  const dataBr = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dataBr) {
    const [, dia, mes, ano] = dataBr;
    return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  }

  const dataBrHifen = texto.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dataBrHifen) {
    const [, dia, mes, ano] = dataBrHifen;
    return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  }

  return texto;
}

function obterResponsavelNome(mapa: Record<string, unknown>) {
  return (
    mapa.responsavel_nome ??
    mapa.responsavel ??
    mapa.nome_responsavel ??
    mapa.nome_do_responsavel ??
    ""
  );
}

function normalizarRegistro(
  registro: Record<string, unknown>,
  indice: number,
): LinhaImportacaoPaciente {
  const mapa = Object.entries(registro).reduce<Record<string, unknown>>(
    (acc, [chave, valor]) => {
      acc[normalizarChaveColuna(chave)] = valor;
      return acc;
    },
    {},
  );

  const dataNascimento =
    mapa.data_nascimento ?? mapa.nascimento ?? mapa.data_de_nascimento ?? "";

  return {
    linha: indice + 2,
    nome: String(mapa.nome || "").trim(),
    cpf: String(mapa.cpf || "").trim(),
    telefone: String(mapa.telefone || "").trim(),
    email: String(mapa.email || "").trim(),
    data_nascimento: normalizarDataImportada(dataNascimento),
    tipo: normalizarTipo(mapa.tipo),
    responsavel_nome: String(obterResponsavelNome(mapa) || "").trim(),
    responsavel_cpf: String(mapa.responsavel_cpf || "").trim(),
    observacoes: String(mapa.observacoes || "").trim(),
    erros: [],
    status: "valido",
  };
}

export async function lerArquivoPacientes(
  arquivo: File,
): Promise<LinhaImportacaoPaciente[]> {
  const extensao = arquivo.name.split(".").pop()?.toLowerCase();

  if (extensao === "csv") {
    const texto = await arquivo.text();
    const resultado = Papa.parse<Record<string, unknown>>(texto, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizarChaveColuna,
    });

    if (resultado.errors.length > 0) {
      throw new Error(
        "Não foi possível ler o CSV. Verifique o formato do arquivo.",
      );
    }

    return resultado.data.map(normalizarRegistro);
  }

  if (extensao === "xlsx") {
    const buffer = await arquivo.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
    const primeiraAba = workbook.SheetNames[0];
    if (!primeiraAba) return [];

    const registros = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      workbook.Sheets[primeiraAba],
      {
        defval: "",
        raw: true,
      },
    );

    return registros.map(normalizarRegistro);
  }

  throw new Error("Formato inválido. Envie um arquivo .xlsx ou .csv.");
}

export function obterColunasEsperadas() {
  return COLUNAS_ESPERADAS;
}
