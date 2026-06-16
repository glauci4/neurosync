// lib/utils.ts
// Funções utilitárias para formatação

// Formata um número de telefone
// @param telefone - Telefone com apenas números
// @returns Telefone formatado (ex: (11) 99999-9999)

export function formatarTelefone(telefone?: string | null): string {
  if (!telefone) return "Não informado";

  const numeros = telefone.replace(/\D/g, "");

  if (numeros.length === 11) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  }
  if (numeros.length === 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }

  return telefone;
}

// Formata um CPF
// @param cpf - CPF com apenas números
// @returns CPF formatado (ex: 123.456.789-00)

export function formatarCPF(cpf: string): string {
  const numeros = cpf.replace(/\D/g, "");

  if (numeros.length === 11) {
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
  }

  return cpf;
}
