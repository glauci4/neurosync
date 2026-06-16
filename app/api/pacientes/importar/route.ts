import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import { registrarLog } from "@/lib/auditoria";
import { getConnection } from "@/lib/mysql";
import { validarCPF, validarEmail } from "@/lib/validacoes";

type ConexaoMySQL = Awaited<ReturnType<typeof getConnection>>;
type StatusImportacao = "importado" | "invalido" | "duplicado" | "ignorado";
type TipoPaciente = "adulto" | "menor";

interface SessaoUsuario {
  id: number;
  clinica_id?: number;
}

interface LinhaImportacaoPayload {
  linha?: number;
  nome?: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  data_nascimento?: string;
  tipo?: TipoPaciente | "";
  responsavel_nome?: string;
  responsavel_cpf?: string;
  observacoes?: string;
}

interface ResultadoLinha {
  linha: number;
  nome: string;
  cpf: string;
  status: StatusImportacao;
  erros: string[];
  paciente_id?: number;
}

function somenteNumeros(valor?: string | null) {
  return String(valor || "").replace(/\D/g, "");
}

function normalizarTexto(valor?: string | null) {
  return String(valor || "").trim();
}

function validarTelefone(telefone: string) {
  const numeros = somenteNumeros(telefone);
  return numeros.length >= 10 && numeros.length <= 11;
}

function calcularIdade(dataNascimento: string) {
  const hoje = new Date();
  const nascimento = new Date(`${dataNascimento}T00:00:00`);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) idade--;
  return idade;
}

function inferirTipoPaciente(
  tipo: TipoPaciente | "",
  dataNascimento: string,
): TipoPaciente | "" {
  if (tipo === "adulto" || tipo === "menor") return tipo;
  if (!validarDataNascimento(dataNascimento)) return "";
  return calcularIdade(dataNascimento) < 18 ? "menor" : "adulto";
}

function validarDataNascimento(data: string) {
  const dataNasc = new Date(`${data}T00:00:00`);
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(data) &&
    !Number.isNaN(dataNasc.getTime()) &&
    dataNasc <= new Date()
  );
}

async function obterSessao() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("usuario_neurosync");
  if (!sessionCookie) return null;

  try {
    return JSON.parse(sessionCookie.value) as SessaoUsuario;
  } catch {
    return null;
  }
}

async function obterUsuarioAtivo(connection: ConexaoMySQL, usuarioId: number) {
  const [usuarios] = await connection.execute<RowDataPacket[]>(
    "SELECT id, clinica_id, COALESCE(ativo, 1) AS ativo FROM usuarios WHERE id = ?",
    [usuarioId],
  );

  if (usuarios.length === 0) return null;
  return usuarios[0];
}

function validarLinha(
  linha: LinhaImportacaoPayload,
  cpfsArquivo: Map<string, number[]>,
) {
  const erros: string[] = [];
  const nome = normalizarTexto(linha.nome);
  const cpf = somenteNumeros(linha.cpf);
  const telefone = somenteNumeros(linha.telefone);
  const email = normalizarTexto(linha.email).toLowerCase();
  const dataNascimento = normalizarTexto(linha.data_nascimento);
  const tipo =
    linha.tipo === "adulto" || linha.tipo === "menor" ? linha.tipo : "";
  const dataNascimentoValida = validarDataNascimento(dataNascimento);
  const tipoInferido = inferirTipoPaciente(tipo, dataNascimento);
  const responsavelNome = normalizarTexto(linha.responsavel_nome);
  const responsavelCpf = somenteNumeros(linha.responsavel_cpf);

  if (!nome || nome.length < 3) erros.push("Nome obrigatório");
  if (!dataNascimentoValida)
    erros.push("Data de nascimento inválida");
  if (!telefone || !validarTelefone(telefone)) erros.push("Telefone inválido");
  if (cpf && !validarCPF(cpf)) erros.push("CPF inválido");
  if (email && !validarEmail(email)) erros.push("E-mail inválido");
  if (responsavelCpf && !validarCPF(responsavelCpf))
    erros.push("CPF do responsável inválido");

  if (dataNascimentoValida && !tipoInferido) {
    erros.push("Tipo obrigatório: adulto ou menor");
  }

  if (tipoInferido && dataNascimento && validarDataNascimento(dataNascimento)) {
    const idade = calcularIdade(dataNascimento);
    if (tipoInferido === "adulto" && idade < 18)
      erros.push("Paciente adulto deve ter 18 anos ou mais");
    if (tipoInferido === "menor" && idade >= 18)
      erros.push("Paciente menor deve ter menos de 18 anos");
  }

  if (tipoInferido === "menor" && !responsavelNome) {
    erros.push("Paciente menor exige responsável");
  }

  const linhasMesmoCpf = cpf ? cpfsArquivo.get(cpf) || [] : [];
  if (linhasMesmoCpf.length > 1) {
    erros.push(
      `CPF duplicado no arquivo nas linhas ${linhasMesmoCpf.join(", ")}`,
    );
  }

  return {
    dados: {
      linha: Number(linha.linha || 0),
      nome,
      cpf,
      telefone,
      email,
      data_nascimento: dataNascimento,
      tipo: tipoInferido,
      responsavel_nome: responsavelNome,
      responsavel_cpf: responsavelCpf,
      observacoes: normalizarTexto(linha.observacoes),
    },
    erros,
  };
}

async function cpfJaExiste(
  connection: ConexaoMySQL,
  cpf: string,
  clinicaId: number,
) {
  if (!cpf) return false;
  const [existentes] = await connection.execute<RowDataPacket[]>(
    "SELECT id FROM pacientes WHERE cpf = ? LIMIT 1",
    [cpf],
  );
  return existentes.length > 0;
}

async function telefoneJaExiste(
  connection: ConexaoMySQL,
  telefone: string,
  clinicaId: number,
) {
  const [existentes] = await connection.execute<RowDataPacket[]>(
    "SELECT id FROM pacientes WHERE telefone = ? AND clinica_id = ? AND deleted_at IS NULL LIMIT 1",
    [telefone, clinicaId],
  );
  return existentes.length > 0;
}

export async function POST(request: Request) {
  const sessao = await obterSessao();
  if (!sessao?.id) {
    return Response.json({ error: "Usuário não autenticado" }, { status: 401 });
  }

  let connection: ConexaoMySQL | undefined;

  try {
    const body = await request.json();
    const pacientes = Array.isArray(body.pacientes)
      ? (body.pacientes as LinhaImportacaoPayload[])
      : [];

    if (pacientes.length === 0) {
      return Response.json(
        { error: "Nenhum paciente enviado para importação" },
        { status: 400 },
      );
    }

    connection = await getConnection();
    const usuario = await obterUsuarioAtivo(connection, sessao.id);

    if (!usuario) {
      return Response.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    if (Number(usuario.ativo) !== 1) {
      return Response.json({ error: "Usuário inativo" }, { status: 403 });
    }

    const clinicaId = Number(usuario.clinica_id || sessao.clinica_id);
    if (!clinicaId) {
      return Response.json(
        { error: "Usuário não pertence a nenhuma clínica" },
        { status: 400 },
      );
    }

    const cpfsArquivo = pacientes.reduce<Map<string, number[]>>(
      (acc, paciente, indice) => {
        const cpf = somenteNumeros(paciente.cpf);
        if (!cpf) return acc;
        acc.set(cpf, [
          ...(acc.get(cpf) || []),
          Number(paciente.linha || indice + 2),
        ]);
        return acc;
      },
      new Map(),
    );

    const resultados: ResultadoLinha[] = [];
    let importados = 0;
    let ignorados = 0;
    let invalidos = 0;

    await connection.beginTransaction();

    for (const [indice, linha] of pacientes.entries()) {
      const { dados, erros } = validarLinha(
        { ...linha, linha: linha.linha || indice + 2 },
        cpfsArquivo,
      );

      if (erros.length > 0) {
        const duplicadoNoArquivo = erros.some((erro) =>
          erro.includes("duplicado"),
        );
        if (duplicadoNoArquivo) {
          ignorados += 1;
        } else {
          invalidos += 1;
        }
        resultados.push({
          linha: dados.linha,
          nome: dados.nome,
          cpf: dados.cpf,
          status: duplicadoNoArquivo ? "duplicado" : "invalido",
          erros,
        });
        continue;
      }

      if (dados.cpf && (await cpfJaExiste(connection, dados.cpf, clinicaId))) {
        ignorados += 1;
        resultados.push({
          linha: dados.linha,
          nome: dados.nome,
          cpf: dados.cpf,
          status: "duplicado",
          erros: ["Já existe um paciente cadastrado com este CPF."],
        });
        continue;
      }

      if (await telefoneJaExiste(connection, dados.telefone, clinicaId)) {
        ignorados += 1;
        resultados.push({
          linha: dados.linha,
          nome: dados.nome,
          cpf: dados.cpf,
          status: "duplicado",
          erros: ["Telefone principal já cadastrado para outro paciente"],
        });
        continue;
      }

      const [resultadoPaciente] = await connection.execute<ResultSetHeader>(
        `INSERT INTO pacientes (
          clinica_id, nome, data_nascimento, genero, raca_etnia, cpf, telefone,
          telefone_alternativo, email, tipo, possui_deficiencia, descricao_deficiencia,
          renda_familiar, possui_cadastro_unico, observacoes, ativo,
          responsavel_nome, responsavel_cpf, responsavel_telefone, responsavel_email,
          responsavel_parentesco, responsavel_escolaridade
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          clinicaId,
          dados.nome,
          dados.data_nascimento,
          "Prefiro não informar",
          "Prefiro não informar",
          dados.cpf || null,
          dados.telefone,
          null,
          dados.email || null,
          dados.tipo,
          0,
          null,
          null,
          0,
          dados.observacoes || null,
          1,
          dados.tipo === "menor" ? dados.responsavel_nome || null : null,
          dados.tipo === "menor" && dados.responsavel_cpf
            ? dados.responsavel_cpf.replace(/\D/g, "")
            : null,
          null,
          null,
          null,
          null,
        ],
      );

      const pacienteId = resultadoPaciente.insertId;

      await registrarLog({
        usuario_id: sessao.id,
        tabela: "pacientes",
        registro_id: pacienteId,
        acao: "INSERT",
        dados_novos: {
          origem: "importacao_pacientes",
          linha: dados.linha,
          nome: dados.nome,
          cpf: dados.cpf || null,
          tipo: dados.tipo,
        },
      });

      importados += 1;
      resultados.push({
        linha: dados.linha,
        nome: dados.nome,
        cpf: dados.cpf,
        status: "importado",
        erros: [],
        paciente_id: pacienteId,
      });
    }

    await connection.commit();

    return Response.json({
      success: true,
      resumo: {
        total: pacientes.length,
        importados,
        ignorados,
        invalidos,
      },
      resultados,
    });
  } catch (error: unknown) {
    if (connection) await connection.rollback();
    console.error("Erro ao importar pacientes:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      return Response.json(
        {
          error:
            "Há dados duplicados na importação. Verifique CPF e responsáveis já cadastrados.",
        },
        { status: 400 },
      );
    }

    return Response.json(
      { error: "Erro interno ao importar pacientes" },
      { status: 500 },
    );
  } finally {
    if (connection) await connection.end();
  }
}
