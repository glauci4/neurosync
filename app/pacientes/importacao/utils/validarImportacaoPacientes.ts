import type { LinhaImportacaoPaciente } from "../types/importacaoPacientes.types";

function somenteNumeros(valor: string) {
  return String(valor || "").replace(/\D/g, "");
}

function validarCPF(cpf: string): boolean {
  const numeros = somenteNumeros(cpf);
  if (numeros.length !== 11 || /^(\d)\1{10}$/.test(numeros)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(numeros.charAt(i)) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== Number(numeros.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(numeros.charAt(i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === Number(numeros.charAt(10));
}

function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarTelefone(telefone: string) {
  const numeros = somenteNumeros(telefone);
  return numeros.length >= 10 && numeros.length <= 11;
}

function validarDataNascimento(data: string) {
  const parsed = new Date(`${data}T00:00:00`);
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(data) &&
    !Number.isNaN(parsed.getTime()) &&
    parsed <= new Date()
  );
}

export function validarLinhasImportacao(linhas: LinhaImportacaoPaciente[]) {
  const cpfs = new Map<string, number[]>();

  linhas.forEach((linha) => {
    const cpf = somenteNumeros(linha.cpf);
    if (!cpf) return;
    cpfs.set(cpf, [...(cpfs.get(cpf) || []), linha.linha]);
  });

  return linhas.map((linha) => {
    const erros: string[] = [];
    const cpfNumeros = somenteNumeros(linha.cpf);
    const responsavelCpfNumeros = somenteNumeros(linha.responsavel_cpf);

    if (!linha.nome || linha.nome.trim().length < 3) {
      erros.push("Nome obrigatório");
    }

    if (
      !linha.data_nascimento ||
      !validarDataNascimento(linha.data_nascimento)
    ) {
      erros.push("Data de nascimento inválida");
    }

    if (!linha.tipo || !["adulto", "menor"].includes(linha.tipo)) {
      erros.push("Tipo obrigatório: adulto ou menor");
    }

    if (!linha.telefone || !validarTelefone(linha.telefone)) {
      erros.push("Telefone inválido");
    }

    if (cpfNumeros && !validarCPF(cpfNumeros)) {
      erros.push("CPF inválido");
    }

    if (linha.email && !validarEmail(linha.email)) {
      erros.push("E-mail inválido");
    }

    if (linha.tipo === "menor" && !linha.responsavel_nome.trim()) {
      erros.push("Paciente menor exige responsável");
    }

    if (responsavelCpfNumeros && !validarCPF(responsavelCpfNumeros)) {
      erros.push("CPF do responsável inválido");
    }

    const linhasComMesmoCpf = cpfNumeros ? cpfs.get(cpfNumeros) || [] : [];
    if (linhasComMesmoCpf.length > 1) {
      erros.push(
        `CPF duplicado no arquivo nas linhas ${linhasComMesmoCpf.join(", ")}`,
      );
    }

    return {
      ...linha,
      cpf: cpfNumeros,
      telefone: somenteNumeros(linha.telefone),
      responsavel_cpf: responsavelCpfNumeros,
      email: linha.email.trim().toLowerCase(),
      erros,
      status:
        erros.length > 0
          ? erros.some((erro) => erro.includes("duplicado"))
            ? ("duplicado" as const)
            : ("invalido" as const)
          : ("valido" as const),
    };
  });
}

