// app/api/pacientes/route.ts
// API para criar (POST) e listar (GET) pacientes
// Inclui validações, auditoria, suporte a paginação, validação de idade
// Agora com campo 'rua' (consistente com o frontend) e idade mínima/máxima por tipo
// O INSERT utiliza construção dinâmica para evitar erros de contagem de colunas.
// Suporte à ordenação por 'ultima_sessao' (data da última consulta).
// GET agora aceita 'visibilidade' (ativo/inativo/todos) e 'status_atendimento'.
// POST adiciona verificação de telefone principal duplicado na mesma clínica.
// POST adiciona verificação de telefone do paciente igual ao do responsável (paciente menor).

import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { registrarLog } from "@/lib/auditoria";
import { getConnection } from "@/lib/mysql";

// ============================================
// INTERFACES E TIPOS
// ============================================

interface PacienteData {
  nome: string;
  data_nascimento: string;
  genero: string;
  raca_etnia: string;
  cpf?: string;
  telefone: string;
  telefone_alternativo?: string;
  email?: string;
  tipo: "adulto" | "menor";
  possui_deficiencia: boolean;
  descricao_deficiencia?: string;
  renda_familiar?: number;
  possui_cadastro_unico: boolean;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  observacoes?: string;
  responsavel?: {
    nome: string;
    cpf?: string;
    telefone: string;
    email?: string;
    grau_parentesco: string;
    escolaridade?: string;
    mesmo_endereco_paciente: boolean;
    sem_numero?: boolean;
    cep?: string;
    rua?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
  };
  contato_emergencia?: { nome: string; telefone: string; parentesco?: string };
}

// ============================================
// FUNÇÕES AUXILIARES DE VALIDAÇÃO
// ============================================

function validarCPF(cpf: string): boolean {
  const cpfNumeros = cpf.replace(/\D/g, "");
  if (cpfNumeros.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpfNumeros)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++)
    soma += parseInt(cpfNumeros.charAt(i), 10) * (10 - i);
  let resto = 11 - (soma % 11);
  const digito1 = resto >= 10 ? 0 : resto;
  if (digito1 !== parseInt(cpfNumeros.charAt(9), 10)) return false;
  soma = 0;
  for (let i = 0; i < 10; i++)
    soma += parseInt(cpfNumeros.charAt(i), 10) * (11 - i);
  resto = 11 - (soma % 11);
  const digito2 = resto >= 10 ? 0 : resto;
  return digito2 === parseInt(cpfNumeros.charAt(10), 10);
}

function calcularIdade(dataNascimento: string): number {
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
}

function validarDadosPaciente(dados: PacienteData): string | null {
  if (!dados.nome || dados.nome.trim().length < 3) {
    return "Nome completo é obrigatório (mínimo 3 caracteres)";
  }
  if (!dados.data_nascimento) return "Data de nascimento é obrigatória";
  const dataNasc = new Date(dados.data_nascimento);
  if (Number.isNaN(dataNasc.getTime())) return "Data de nascimento inválida";
  if (dataNasc > new Date()) return "Data de nascimento não pode ser futura";

  const idade = calcularIdade(dados.data_nascimento);
  if (dados.tipo === "adulto" && idade < 18) {
    return "Paciente adulto deve ter 18 anos ou mais";
  }
  if (dados.tipo === "menor" && idade >= 18) {
    return "Paciente menor deve ter menos de 18 anos";
  }

  const telefoneNumeros = dados.telefone.replace(/\D/g, "");
  if (telefoneNumeros.length < 10 || telefoneNumeros.length > 11) {
    return "Telefone inválido (deve ter 10 ou 11 dígitos)";
  }
  if (dados.cpf && !validarCPF(dados.cpf)) return "CPF inválido";
  if (dados.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) {
    return "E-mail inválido";
  }
  return null;
}

// ============================================
// API POST - CRIAR PACIENTE
// ============================================

export async function POST(request: Request) {
  let connection = null;
  try {
    const body = await request.json();
    const dados = body as PacienteData;
    const { usuario_id } = body;

    if (!usuario_id) {
      return Response.json(
        { error: "Usuário não autenticado" },
        { status: 401 },
      );
    }

    const erroValidacao = validarDadosPaciente(dados);
    if (erroValidacao) {
      return Response.json({ error: erroValidacao }, { status: 400 });
    }

    connection = await getConnection();

    const [usuarios] = await connection.execute<RowDataPacket[]>(
      "SELECT clinica_id FROM usuarios WHERE id = ?",
      [usuario_id],
    );
    if (usuarios.length === 0) {
      return Response.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }
    const clinica_id = usuarios[0].clinica_id;
    if (!clinica_id) {
      return Response.json(
        { error: "Usuário não pertence a nenhuma clínica" },
        { status: 400 },
      );
    }

    // ========== VERIFICAÇÃO DE CPF DUPLICADO ==========
    if (dados.cpf) {
      const cpfNumeros = dados.cpf.replace(/\D/g, "");
      const [existentes] = await connection.execute<RowDataPacket[]>(
        `SELECT id FROM pacientes WHERE cpf = ?`,
        [cpfNumeros],
      );
      if (existentes.length > 0) {
        return Response.json(
          { error: "Já existe um paciente cadastrado com este CPF." },
          { status: 400 },
        );
      }
    }

    // ========== VERIFICAÇÃO DE TELEFONE PRINCIPAL DUPLICADO ==========
    if (dados.telefone) {
      const telefoneNumeros = dados.telefone.replace(/\D/g, "");
      const [existentesTel] = await connection.execute<RowDataPacket[]>(
        `SELECT id FROM pacientes WHERE telefone = ? AND clinica_id = ? AND deleted_at IS NULL`,
        [telefoneNumeros, clinica_id],
      );
      if (existentesTel.length > 0) {
        return Response.json(
          { error: "Telefone principal já cadastrado para outro paciente" },
          { status: 400 },
        );
      }
    }

    // VERIFICAÇÃO DE TELEFONE DO PACIENTE IGUAL AO DO RESPONSÁVEL (PACIENTE MENOR)
    if (dados.tipo === "menor" && dados.responsavel) {
      const telPacienteNumeros = dados.telefone?.replace(/\D/g, "");
      const telResponsavelNumeros = dados.responsavel.telefone?.replace(
        /\D/g,
        "",
      );
      if (
        telPacienteNumeros &&
        telResponsavelNumeros &&
        telPacienteNumeros === telResponsavelNumeros
      ) {
        return Response.json(
          {
            error:
              "Telefone do paciente não pode ser igual ao telefone do responsável",
          },
          { status: 400 },
        );
      }
    }

    // INSERE PACIENTE COM CONSTRUÇÃO DINÂMICA

    const colunas = [
      "clinica_id",
      "nome",
      "data_nascimento",
      "genero",
      "raca_etnia",
      "cpf",
      "telefone",
      "telefone_alternativo",
      "email",
      "tipo",
      "possui_deficiencia",
      "descricao_deficiencia",
      "renda_familiar",
      "possui_cadastro_unico",
      "cep",
      "rua",
      "numero",
      "complemento",
      "bairro",
      "cidade",
      "estado",
      "observacoes",
      "ativo",
    ];

    const valores = [
      clinica_id,
      dados.nome,
      dados.data_nascimento,
      dados.genero,
      dados.raca_etnia,
      dados.cpf ? dados.cpf.replace(/\D/g, "") : null,
      dados.telefone,
      dados.telefone_alternativo || null,
      dados.email || null,
      dados.tipo,
      dados.possui_deficiencia ? 1 : 0,
      dados.descricao_deficiencia || null,
      dados.renda_familiar || null,
      dados.possui_cadastro_unico ? 1 : 0,
      dados.cep ? dados.cep.replace(/\D/g, "") : null,
      dados.rua || null,
      dados.numero || null,
      dados.complemento || null,
      dados.bairro || null,
      dados.cidade || null,
      dados.estado || null,
      dados.observacoes || null,
      1, // ativo
    ];

    const placeholders = colunas.map(() => "?").join(", ");
    const sql = `INSERT INTO pacientes (${colunas.join(", ")}) VALUES (${placeholders})`;

    const [resultado] = await connection.execute<ResultSetHeader>(sql, valores);
    const paciente_id = resultado.insertId;

    // Responsável legal é armazenado diretamente na tabela pacientes.
    if (dados.tipo === "menor" && dados.responsavel) {
      await connection.execute(
        `UPDATE pacientes
         SET responsavel_nome = ?,
             responsavel_cpf = ?,
             responsavel_telefone = ?,
             responsavel_email = ?,
             responsavel_parentesco = ?,
             responsavel_escolaridade = ?,
             atualizado_em = NOW()
         WHERE id = ? AND clinica_id = ?`,
        [
          dados.responsavel.nome,
          dados.responsavel.cpf
            ? dados.responsavel.cpf.replace(/\D/g, "")
            : null,
          dados.responsavel.telefone,
          dados.responsavel.email || null,
          dados.responsavel.grau_parentesco,
          dados.responsavel.escolaridade || null,
          paciente_id,
          clinica_id,
        ],
      );
    }

    // Se houver contato de emergência
    if (dados.contato_emergencia) {
      const cont = dados.contato_emergencia;
      await connection.execute(
        `INSERT INTO contatos_emergencia (paciente_id, nome, telefone, parentesco) VALUES (?, ?, ?, ?)`,
        [paciente_id, cont.nome, cont.telefone, cont.parentesco || null],
      );
    }

    await registrarLog({
      usuario_id,
      tabela: "pacientes",
      registro_id: paciente_id,
      acao: "INSERT",
      dados_novos: dados,
    });

    return Response.json({
      success: true,
      message: "Paciente cadastrado com sucesso",
      paciente_id,
    });
  } catch (error: unknown) {
    console.error("Erro ao criar paciente:", error);
    const erroSql =
      typeof error === "object" && error !== null
        ? (error as { code?: string; message?: string })
        : null;
    if (
      erroSql?.code === "ER_DUP_ENTRY" &&
      String(erroSql.message || "").includes("cpf")
    ) {
      return Response.json(
        { error: "Já existe um paciente cadastrado com este CPF." },
        { status: 400 },
      );
    }
    if (erroSql?.code === "ER_DATA_TOO_LONG") {
      return Response.json(
        {
          error:
            "Um dos campos excedeu o tamanho permitido. Verifique CEP, telefone, etc.",
        },
        { status: 400 },
      );
    }
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  } finally {
    if (connection) await connection.end();
  }
}

// API GET - LISTAR PACIENTES (com ordenação, visibilidade e status de atendimento)

export async function GET(request: Request) {
  let connection = null;
  try {
    const { searchParams } = new URL(request.url);
    const usuario_id = parseInt(searchParams.get("usuario_id") || "0", 10);
    const visibilidade =
      (searchParams.get("visibilidade") as "ativo" | "inativo" | "todos") ||
      "ativo";
    const status_atendimento = searchParams.get("status_atendimento") as
      | "fila_espera"
      | "em_atendimento"
      | "encerrado"
      | null;
    const busca = searchParams.get("busca") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const orderBy = searchParams.get("orderBy") || "nome";
    const orderDirection = (searchParams.get("orderDirection") || "ASC") as
      | "ASC"
      | "DESC";
    const somenteResponsavel =
      searchParams.get("somente_responsavel") === "true";

    if (!usuario_id) {
      return Response.json(
        { error: "Usuário não autenticado" },
        { status: 401 },
      );
    }

    connection = await getConnection();

    const [usuarios] = await connection.execute<RowDataPacket[]>(
      "SELECT clinica_id, perfil_id FROM usuarios WHERE id = ?",
      [usuario_id],
    );
    if (usuarios.length === 0) {
      return Response.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }
    const clinica_id = usuarios[0].clinica_id;
    if (!clinica_id) {
      return Response.json(
        { error: "Usuário não pertence a nenhuma clínica" },
        { status: 400 },
      );
    }
    const perfil_id = usuarios[0].perfil_id;

    // Montagem da cláusula WHERE
    let whereConditions = "p.clinica_id = ? AND p.deleted_at IS NULL";
    const params: Array<string | number> = [clinica_id];

    // Filtro por visibilidade (ativo/inativo/todos) – substitui o antigo `status`
    if (visibilidade !== "todos") {
      whereConditions += " AND p.ativo = ?";
      params.push(visibilidade === "ativo" ? 1 : 0);
    }

    if (somenteResponsavel) {
      if (Number(perfil_id) !== 2) {
        return Response.json(
          { error: "Acesso restrito a psicólogos" },
          { status: 403 },
        );
      }
      whereConditions += " AND p.psicologo_responsavel_id = ?";
      params.push(usuario_id);
    }

    // Filtro por status de atendimento (opcional)
    if (status_atendimento) {
      whereConditions += " AND p.status_atendimento = ?";
      params.push(status_atendimento);
    }

    // Busca textual (nome, CPF ou telefone)
    if (busca) {
      whereConditions +=
        " AND (p.nome LIKE ? OR p.cpf LIKE ? OR p.telefone LIKE ?)";
      params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
    }

    // Ordenação (inclui suporte a 'ultima_sessao')
    const orderDirValidado = orderDirection === "DESC" ? "DESC" : "ASC";
    let orderByClause: string;

    if (orderBy === "ultima_sessao") {
      orderByClause = `(SELECT MAX(c.data_consulta) FROM consultas c WHERE c.paciente_id = p.id AND c.clinica_id = p.clinica_id AND c.deleted_at IS NULL) ${orderDirValidado}`;
    } else {
      const colunasPermitidas = [
        "nome",
        "data_nascimento",
        "criado_em",
        "telefone",
        "tipo",
      ];
      const orderByValidado = colunasPermitidas.includes(orderBy)
        ? orderBy
        : "nome";
      orderByClause = `p.${orderByValidado} ${orderDirValidado}`;
    }

    const offset = (page - 1) * limit;

    // Contagem total (aplicando os mesmos filtros)
    const countSql = `SELECT COUNT(*) as total FROM pacientes p WHERE ${whereConditions}`;
    const [countResult] = await connection.query<RowDataPacket[]>(
      countSql,
      params,
    );
    const total = countResult[0].total;

    // Query principal
    const sql = `
            SELECT 
                p.id, p.nome, p.data_nascimento, p.genero, p.cpf, p.telefone, p.email, p.tipo, p.ativo,
                p.status_atendimento, p.criado_em, p.observacoes,
                p.psicologo_responsavel_id,
                pr.nome AS psicologo_responsavel_nome,
                pr.crp AS psicologo_responsavel_crp,
                TIMESTAMPDIFF(YEAR, p.data_nascimento, CURDATE()) AS idade,
                DATE_FORMAT(p.data_nascimento, '%d/%m/%Y') AS data_nascimento_formatada,
                (SELECT COUNT(*) FROM consultas c WHERE c.paciente_id = p.id AND c.clinica_id = p.clinica_id AND c.deleted_at IS NULL) = 0 AS podeExcluir
            FROM pacientes p
            LEFT JOIN usuarios pr ON pr.id = p.psicologo_responsavel_id
            WHERE ${whereConditions}
            ORDER BY ${orderByClause}
            LIMIT ${limit} OFFSET ${offset}
        `;

    const [pacientes] = await connection.query<RowDataPacket[]>(sql, params);

    return Response.json({
      success: true,
      data: pacientes,
      paginacao: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        itemsPorPagina: pacientes.length,
      },
    });
  } catch (error) {
    console.error("Erro ao listar pacientes:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  } finally {
    if (connection) await connection.end();
  }
}
