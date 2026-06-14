export interface DadosEmpresaCnpj {
  razao_social: string;
  nome_fantasia: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
}

export function validarFormatoCNPJ(cnpj: string): boolean {
  const cnpjNumeros = cnpj.replace(/[^\d]+/g, "");
  return cnpjNumeros.length === 14;
}

export function limparCNPJ(cnpj: string): string {
  return cnpj.replace(/[^\d]+/g, "");
}

export async function consultarBrasilAPI(
  cnpjLimpo: string,
): Promise<DadosEmpresaCnpj> {
  const url = `https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`;
  const resposta = await fetch(url);

  if (!resposta.ok) {
    throw new Error(`BrasilAPI falhou com status ${resposta.status}`);
  }

  const dados = await resposta.json();

  return {
    razao_social: dados.razao_social || "",
    nome_fantasia: dados.nome_fantasia || "",
    logradouro: `${dados.descricao_tipo_de_logradouro || ""} ${dados.logradouro || ""}`,
    numero: dados.numero || "",
    bairro: dados.bairro || "",
    cidade: dados.municipio || "",
    estado: dados.uf || "",
    cep: dados.cep || "",
    telefone: dados.ddd_telefone_1 || "",
    email: dados.email || "",
  };
}

export async function consultarReceitaWS(
  cnpjLimpo: string,
): Promise<DadosEmpresaCnpj> {
  const url = `https://receitaws.com.br/v1/cnpj/${cnpjLimpo}`;
  const resposta = await fetch(url);

  if (!resposta.ok) {
    throw new Error(`ReceitaWS falhou com status ${resposta.status}`);
  }

  const dados = await resposta.json();

  if (dados.status === "ERROR") {
    throw new Error(dados.message);
  }

  let logradouro = "";
  if (dados.tipo_logradouro) {
    logradouro = `${dados.tipo_logradouro} `;
  }
  if (dados.logradouro) {
    logradouro += dados.logradouro;
  }

  return {
    razao_social: dados.nome || "",
    nome_fantasia: dados.fantasia || "",
    logradouro,
    numero: dados.numero || "",
    bairro: dados.bairro || "",
    cidade: dados.municipio || "",
    estado: dados.uf || "",
    cep: dados.cep || "",
    telefone: dados.telefone || "",
    email: dados.email || "",
  };
}

export async function consultarDadosEmpresaPorCnpj(cnpj: string) {
  if (!validarFormatoCNPJ(cnpj)) {
    throw new Error("Formato de CNPJ inválido. Use 00.000.000/0000-00");
  }

  const cnpjLimpo = limparCNPJ(cnpj);
  let dadosEmpresa: DadosEmpresaCnpj | null = null;
  let fonteUsada = "";
  let erroDetalhado = "";

  try {
    dadosEmpresa = await consultarBrasilAPI(cnpjLimpo);
    fonteUsada = "BrasilAPI";
  } catch (erroBrasilAPI) {
    erroDetalhado = `BrasilAPI: ${(erroBrasilAPI as Error).message}`;

    try {
      dadosEmpresa = await consultarReceitaWS(cnpjLimpo);
      fonteUsada = "ReceitaWS";
    } catch (erroReceitaWS) {
      erroDetalhado += ` | ReceitaWS: ${(erroReceitaWS as Error).message}`;
      throw new Error(erroDetalhado);
    }
  }

  if (!dadosEmpresa.razao_social && !dadosEmpresa.nome_fantasia) {
    throw new Error("CNPJ encontrado mas sem dados cadastrais.");
  }

  return {
    ...dadosEmpresa,
    fonte_consulta: fonteUsada,
    cnpj_consultado: cnpjLimpo,
  };
}
