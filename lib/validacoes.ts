// lib/validacoes.ts
// Utilitários de validação e segurança do sistema NeuroSync.
// Inclui validação de CNPJ, CPF, CRP, e-mail, senha e utilitários de hash.

import bcrypt from "bcrypt";

// VALIDAÇÃO DE CNPJ

// Valida se um CNPJ é matematicamente válido, ou seja, se os dígitos verificadores estão corretos.
// @param cnpj - CNPJ a ser validado (pode conter caracteres de formatação como pontos, barras e hífens)
// @returns boolean - true se o CNPJ for válido, false caso contrário

export function validarCNPJ(cnpj: string): boolean {
  // Remove tudo que não é número
  cnpj = cnpj.replace(/[^\d]+/g, "");

  // Verifica se tem 14 dígitos
  if (cnpj.length !== 14) return false;

  // Verifica se não são todos números iguais
  if (/^(\d)\1+$/.test(cnpj)) return false;

  // Validação dos dígitos verificadores
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  const digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += Number.parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== Number.parseInt(digitos.charAt(0), 10)) return false;

  tamanho += 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += Number.parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  return resultado === Number.parseInt(digitos.charAt(1), 10);
}

// VALIDAÇÃO DE CPF

// Valida um CPF (apenas números, 11 dígitos, com dígitos verificadores corretos)
// @param cpf CPF sem formatação (apenas números) ou com formatação (pontos e hífen)
// @returns true se for válido

export function validarCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/\D/g, "");

  // Verifica se tem 11 dígitos ou se são todos iguais
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += Number.parseInt(cpf.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== Number.parseInt(cpf.charAt(9), 10)) {
    return false;
  }

  // Validação do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += Number.parseInt(cpf.charAt(i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== Number.parseInt(cpf.charAt(10), 10)) {
    return false;
  }

  return true;
}

// UTILITÁRIOS DE SENHA

// Gera um hash seguro para uma senha usando bcrypt
// @param senha - Senha em texto puro
// @returns Hash da senha

export async function gerarHashSenha(senha: string): Promise<string> {
  // O número 10 é o "custo" do hash, que determina a complexidade do processo de hashing
  // Valores comuns para o custo são entre 10 e 12, dependendo do nível de segurança desejado e do desempenho aceitável
  const saltRounds = 10;

  try {
    const hash = await bcrypt.hash(senha, saltRounds);
    return hash;
  } catch (error) {
    console.error("Erro ao gerar hash da senha:", error);
    throw new Error("Erro ao processar a senha. Por favor, tente novamente.");
  }
}

// Compara uma senha em texto puro com um hash para verificar se correspondem
// @param senha - Senha digitada pelo usuário em texto puro
// @param hash - Hash armazenado no banco de dados
// @returns boolean - true se a senha corresponder ao hash, false caso contrário
export async function compararSenha(
  senha: string,
  hash: string,
): Promise<boolean> {
  try {
    const resultado = await bcrypt.compare(senha, hash);
    return resultado;
  } catch (error) {
    console.error("Erro ao comparar senha:", error);
    return false; // Em caso de erro, retorna false para indicar que a comparação falhou
  }
}

// VALIDAÇÕES DIVERSAS

// Valida se um CRP tem formato válido
// @param crp - CRP a ser validado (ex: "12/34567")
// @returns boolean - true se o CRP for válido, false caso contrário

export function validarCRP(crp: string): boolean {
  if (!crp) return false;

  // Remove espaços
  crp = crp.trim();

  // Verifica o formato: dois dígitos, barra, cinco dígitos
  const regex = /^\d{2}\/\d{5}$/;
  if (!regex.test(crp)) return false;

  // Verifica se a região é válida (01 a 27)
  const regiao = Number.parseInt(crp.substring(0, 2), 10);
  if (regiao < 1 || regiao > 27) return false;

  return true;
}

// Valida se um email tem formato válido
// @param email - Email a ser validado
// @returns boolean - true se o email for válido, false caso contrário

export function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Valida se uma senha é forte (baseada em critérios como comprimento mínimo, presença de letras maiúsculas, minúsculas, números e caracteres especiais)
// @param senha - Senha a ser validada
// @returns { valida: boolean, mensagem: string } - Objeto indicando se a senha é válida e uma mensagem explicativa

export function validarSenhaForte(senha: string): {
  valida: boolean;
  mensagem: string;
} {
  // Verifica tamanho mínimo
  if (senha.length < 8) {
    return {
      valida: false,
      mensagem: "A senha deve conter no mínimo 8 caracteres.",
    };
  }
  // Verifica presença de letras maiúsculas
  if (!/[A-Z]/.test(senha)) {
    return {
      valida: false,
      mensagem: "A senha deve conter pelo menos uma letra maiúscula.",
    };
  }
  // Verifica presença de letras minúsculas
  if (!/[a-z]/.test(senha)) {
    return {
      valida: false,
      mensagem: "A senha deve conter pelo menos uma letra minúscula.",
    };
  }
  // Verifica presença de números
  if (!/[0-9]/.test(senha)) {
    return {
      valida: false,
      mensagem: "A senha deve conter pelo menos um número.",
    };
  }
  // Verifica presença de caracteres especiais
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(senha)) {
    return {
      valida: false,
      mensagem: "A senha deve conter pelo menos um caractere especial.",
    };
  }

  return { valida: true, mensagem: "Senha forte." };
}

