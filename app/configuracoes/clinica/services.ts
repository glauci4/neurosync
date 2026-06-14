import type {
  ClinicaData,
  ClinicaPermissoes,
  ClinicaResponse,
  ClinicaUpdatePayload,
  TipoIdentidadeVisualClinica,
} from "./types";

async function tratarResposta(resposta: Response) {
  const data = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(data.error || "Não foi possível concluir a ação");
  }
  return data;
}

function textoOuNulo(valor: unknown): string | null {
  if (valor === null || typeof valor === "undefined") return null;
  return String(valor);
}

function texto(valor: unknown): string {
  return textoOuNulo(valor) || "";
}

function lerCampo(
  dados: Record<string, unknown>,
  ...chaves: string[]
): unknown {
  for (const chave of chaves) {
    if (Object.hasOwn(dados, chave)) {
      return dados[chave];
    }
  }
  return undefined;
}

function normalizarClinica(dados: Record<string, unknown>): ClinicaData {
  return {
    ...(dados as unknown as ClinicaData),
    id: Number(lerCampo(dados, "id") || 0),
    cnpj: texto(lerCampo(dados, "cnpj", "CNPJ")),
    nome_fantasia: texto(
      lerCampo(dados, "nome_fantasia", "nomeFantasia", "nome"),
    ),
    razao_social: texto(lerCampo(dados, "razao_social", "razaoSocial")),
    telefone: textoOuNulo(lerCampo(dados, "telefone", "phone")),
    email: textoOuNulo(lerCampo(dados, "email", "e_mail")),
    cep: textoOuNulo(lerCampo(dados, "cep", "CEP")),
    endereco: textoOuNulo(lerCampo(dados, "endereco", "rua", "logradouro")),
    numero: textoOuNulo(lerCampo(dados, "numero", "número", "number")),
    complemento: textoOuNulo(lerCampo(dados, "complemento")),
    bairro: textoOuNulo(lerCampo(dados, "bairro")),
    cidade: textoOuNulo(lerCampo(dados, "cidade", "city")),
    estado: textoOuNulo(lerCampo(dados, "estado", "uf", "UF")),
    logo_url: textoOuNulo(lerCampo(dados, "logo_url", "logoUrl", "logo")),
  };
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function extrairClinicaPayload(
  resposta: Record<string, unknown>,
): Record<string, unknown> | null {
  const data = resposta.data;

  if (ehObjeto(data)) {
    if (ehObjeto(data.data)) return data.data;
    return data;
  }

  if (ehObjeto(resposta.clinica)) return resposta.clinica;

  if (
    ["id", "cnpj", "nome_fantasia", "nomeFantasia", "razao_social"].some(
      (campo) => Object.hasOwn(resposta, campo),
    )
  ) {
    return resposta;
  }

  return null;
}

function normalizarClinicaResponse(resposta: unknown): ClinicaResponse {
  if (!ehObjeto(resposta)) {
    throw new Error("Formato inválido ao buscar clínica");
  }

  const payload = extrairClinicaPayload(resposta);
  if (!payload) {
    throw new Error("Dados da clínica não encontrados na resposta da API");
  }

  return {
    success: typeof resposta.success === "boolean" ? resposta.success : true,
    data: normalizarClinica(payload),
    permissoes: (resposta.permissoes as ClinicaPermissoes | undefined) || {
      podeVisualizarBasico: true,
      podeEditar: false,
      isAdmin: false,
    },
  };
}

export async function buscarClinica(): Promise<ClinicaResponse> {
  const resposta = await fetch("/api/clinicas");
  const data = await tratarResposta(resposta);
  return normalizarClinicaResponse(data);
}

export async function atualizarClinica(dados: ClinicaUpdatePayload) {
  const resposta = await fetch("/api/clinicas", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return tratarResposta(resposta);
}

export async function enviarIdentidadeClinica({
  tipo,
  arquivo,
}: {
  tipo: TipoIdentidadeVisualClinica;
  arquivo: File;
}) {
  const formData = new FormData();
  formData.append("tipo", tipo);
  formData.append("arquivo", arquivo);

  const resposta = await fetch("/api/clinicas/identidade", {
    method: "POST",
    body: formData,
  });
  return tratarResposta(resposta);
}

export async function removerIdentidadeClinica(
  tipo: TipoIdentidadeVisualClinica,
) {
  const resposta = await fetch(`/api/clinicas/identidade?tipo=${tipo}`, {
    method: "DELETE",
  });
  return tratarResposta(resposta);
}

export async function usarAssinaturaPerfilClinica() {
  const resposta = await fetch("/api/clinicas/assinatura", {
    method: "POST",
  });
  return tratarResposta(resposta);
}

export async function removerAssinaturaClinica() {
  const resposta = await fetch("/api/clinicas/assinatura", {
    method: "DELETE",
  });
  return tratarResposta(resposta);
}
