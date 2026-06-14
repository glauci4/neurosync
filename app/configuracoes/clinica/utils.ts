import type { ClinicaData, ResumoOperacionalClinica } from "./types";

export function normalizarSomenteNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

export function formatarCnpj(cnpj: string) {
  const numeros = normalizarSomenteNumeros(cnpj);
  if (numeros.length !== 14) return cnpj;
  return numeros.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    "$1.$2.$3/$4-$5",
  );
}

export function formatarCep(cep: string) {
  const numeros = normalizarSomenteNumeros(cep);
  if (numeros.length !== 8) return cep;
  return numeros.replace(/(\d{5})(\d{3})/, "$1-$2");
}

export function formatarTelefone(telefone: string) {
  const numeros = normalizarSomenteNumeros(telefone);
  if (numeros.length === 11) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  }
  if (numeros.length === 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }
  return telefone;
}

export function aplicarMascaraTelefone(valor: string) {
  const numeros = normalizarSomenteNumeros(valor).slice(0, 11);
  if (numeros.length <= 2) return numeros;
  if (numeros.length <= 6)
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  if (numeros.length <= 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }
  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

export function validarCnpj(cnpj: string) {
  const valor = normalizarSomenteNumeros(cnpj);
  if (valor.length !== 14) return false;
  if (/^(\d)\1+$/.test(valor)) return false;

  let tamanho = valor.length - 2;
  let numeros = valor.substring(0, tamanho);
  const digitos = valor.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i -= 1) {
    soma += Number(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== Number(digitos.charAt(0))) return false;

  tamanho += 1;
  numeros = valor.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i -= 1) {
    soma += Number(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado === Number(digitos.charAt(1));
}

export function validarEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validarTelefone(telefone: string) {
  const numeros = normalizarSomenteNumeros(telefone);
  return numeros.length === 10 || numeros.length === 11;
}

export function aplicarMascaraCrp(crp: string) {
  const numeros = normalizarSomenteNumeros(crp).slice(0, 7);
  if (numeros.length <= 2) return numeros;
  return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
}

export function validarCep(cep: string) {
  return normalizarSomenteNumeros(cep).length === 8;
}

export const UFS_BRASILEIRAS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

export function validarUf(uf: string) {
  return UFS_BRASILEIRAS.includes(
    uf.trim().toUpperCase() as (typeof UFS_BRASILEIRAS)[number],
  );
}

export function validarCrp(crp: string) {
  const valor = crp.trim();
  return /^\d{2}\/\d{5}$/.test(valor);
}

export function validarSite(site: string) {
  if (!site.trim()) return true;
  return /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i.test(site.trim());
}

export function validarImagemArquivo(arquivo: File) {
  const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];
  if (!tiposPermitidos.includes(arquivo.type)) {
    return "Use uma imagem JPG, JPEG, PNG ou WEBP.";
  }
  if (arquivo.size > 5 * 1024 * 1024) {
    return "A imagem deve ter no máximo 5MB.";
  }
  return "";
}

export async function cortarImagemEmQuadrado(arquivo: File) {
  const bitmap = await createImageBitmap(arquivo);
  const lado = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = lado;
  canvas.height = lado;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Não foi possível processar a imagem");
  }

  const origemX = Math.floor((bitmap.width - lado) / 2);
  const origemY = Math.floor((bitmap.height - lado) / 2);
  ctx.drawImage(bitmap, origemX, origemY, lado, lado, 0, 0, lado, lado);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (resultado) => {
        if (!resultado) {
          reject(new Error("Não foi possível gerar a imagem"));
          return;
        }
        resolve(resultado);
      },
      arquivo.type,
      0.92,
    );
  });

  return new File([blob], arquivo.name, { type: arquivo.type });
}

export function resumoOperacionalClinica(
  clinica: ClinicaData,
): ResumoOperacionalClinica {
  const campos = [
    clinica.nome_fantasia,
    clinica.razao_social,
    clinica.telefone,
    clinica.whatsapp,
    clinica.email,
    clinica.site,
    clinica.descricao_institucional,
    clinica.crp_clinica,
    clinica.endereco,
    clinica.numero,
    clinica.bairro,
    clinica.cidade,
    clinica.estado,
    clinica.cep,
    clinica.responsavel_tecnico_nome,
    clinica.responsavel_tecnico_crp,
    clinica.responsavel_tecnico_cargo,
    clinica.logo_url,
  ];

  const camposPreenchidos = campos.filter(Boolean).length;
  const contatoAtivo = [
    clinica.telefone,
    clinica.whatsapp,
    clinica.email,
  ].filter(Boolean).length;
  const identidadePronta = [clinica.logo_url, clinica.favicon_url].filter(
    Boolean,
  ).length;
  const responsavelCompleto = [
    clinica.responsavel_tecnico_nome,
    clinica.responsavel_tecnico_crp,
    clinica.responsavel_tecnico_cargo,
    clinica.responsavel_tecnico_assinatura_url,
  ].filter(Boolean).length;
  const regrasAtivas = [
    clinica.permitir_multiplos_psicologos,
    clinica.permitir_compartilhamento_prontuario,
    clinica.exigir_assinatura_evolucoes,
    clinica.bloquear_edicao_apos_assinatura,
    clinica.habilitar_auditoria_clinica,
  ].filter(Boolean).length;

  return {
    camposPreenchidos,
    contatoAtivo,
    identidadePronta,
    responsavelCompleto,
    regrasAtivas,
  };
}

export function temImagem(arquivo?: string | null) {
  return Boolean(arquivo?.trim());
}
