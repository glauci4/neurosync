// app/api/pacientes/[id]/route.ts
// API para gerenciar um paciente específico (GET, PUT, DELETE)

import type { RowDataPacket } from "mysql2";
import { reconciliarNotificacaoPacienteSemConsultaAgendada } from "@/app/api/notificacoes/eventos/utils";
import { buscarDadosRegistro, registrarLog } from "@/lib/auditoria";
import { getConnection } from "@/lib/mysql";

// INTERFACE PARA ATUALIZAÇÃO
interface PacienteUpdateData {
  nome?: string;
  data_nascimento?: string;
  genero?: string;
  raca_etnia?: string;
  cpf?: string;
  telefone?: string;
  telefone_alternativo?: string;
  email?: string;
  tipo?: "adulto" | "menor";
  possui_deficiencia?: boolean;
  descricao_deficiencia?: string;
  renda_familiar?: number;
  possui_cadastro_unico?: boolean;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  observacoes?: string;
  ativo?: boolean;
  sem_numero?: boolean;
  status_atendimento?: "fila_espera" | "em_atendimento" | "encerrado";
  responsavel_nome?: string | null;
  responsavel_cpf?: string | null;
  responsavel_telefone?: string | null;
  responsavel_email?: string | null;
  responsavel_parentesco?: string | null;
  responsavel_escolaridade?: string | null;
  responsavel?: {
    nome?: string;
    cpf?: string;
    telefone?: string;
    email?: string;
    parentesco?: string;
    grau_parentesco?: string;
    escolaridade?: string;
  };
  contato_emergencia?: {
    nome?: string;
    telefone?: string;
    parentesco?: string;
  };
}

interface ContatoEmergenciaInput {
  nome?: string;
  telefone?: string;
  parentesco?: string;
}

// FUNÇÃO AUXILIAR: VALIDAÇÃO DE CPF
function validarCPF(cpf: string): boolean {
  const numeros = cpf.replace(/\D/g, "");
  if (numeros.length !== 11) return false;
  if (/^(\d)\1+$/.test(numeros)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(numeros.charAt(i)) * (10 - i);
  let resto = 11 - (soma % 11);
  const digito1 = resto >= 10 ? 0 : resto;
  if (digito1 !== Number(numeros.charAt(9))) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(numeros.charAt(i)) * (11 - i);
  resto = 11 - (soma % 11);
  const digito2 = resto >= 10 ? 0 : resto;
  return digito2 === Number(numeros.charAt(10));
}

// GET
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let connection = null;
  try {
    const { id } = await context.params;
    const pacienteId = Number(id);
    const url = new URL(request.url);
    const usuarioId = Number(url.searchParams.get("usuario_id") || "0");

    if (!usuarioId) {
      return Response.json(
        { error: "Usuário não autenticado" },
        { status: 401 },
      );
    }
    if (Number.isNaN(pacienteId)) {
      return Response.json(
        { error: "ID do paciente inválido" },
        { status: 400 },
      );
    }

    connection = await getConnection();

    // Obtém a clínica do usuário
    const [usuarios] = await connection.execute<RowDataPacket[]>(
      "SELECT clinica_id FROM usuarios WHERE id = ?",
      [usuarioId],
    );
    if (usuarios.length === 0) {
      return Response.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }
    const clinicaId = usuarios[0].clinica_id;

    // Busca os dados do paciente, incluindo contato de emergência e o psicólogo responsável do acompanhamento.
    const [pacientes] = await connection.execute<RowDataPacket[]>(
      `SELECT p.*,
                pr.nome AS psicologo_responsavel_nome,
                pr.crp AS psicologo_responsavel_crp,
                DATE_FORMAT(p.psicologo_responsavel_atribuido_em, '%d/%m/%Y %H:%i') AS psicologo_responsavel_atribuido_em_formatada,
                atribuido_por.nome AS psicologo_responsavel_atribuido_por_nome,
                TIMESTAMPDIFF(YEAR, p.data_nascimento, CURDATE()) AS idade,
                DATE_FORMAT(p.data_nascimento, '%d/%m/%Y') AS data_nascimento_formatada,
                (SELECT COUNT(*) FROM consultas
                  WHERE paciente_id = p.id
                    AND clinica_id = p.clinica_id
                    AND deleted_at IS NULL) = 0
                AND (SELECT COUNT(*) FROM paciente_acompanhamento_historico
                  WHERE paciente_id = p.id
                    AND clinica_id = p.clinica_id
                    AND deleted_at IS NULL) = 0
                AND p.status_atendimento = 'fila_espera'
                AND p.psicologo_responsavel_id IS NULL AS podeExcluir,
                c.id AS contato_id,
                c.nome AS contato_nome,
                c.telefone AS contato_telefone,
                c.parentesco AS contato_parentesco
             FROM pacientes p
             LEFT JOIN usuarios pr ON pr.id = p.psicologo_responsavel_id
             LEFT JOIN usuarios atribuido_por ON atribuido_por.id = p.psicologo_responsavel_atribuido_por_id
             LEFT JOIN contatos_emergencia c ON p.id = c.paciente_id
             WHERE p.id = ? AND p.clinica_id = ? AND p.deleted_at IS NULL`,
      [pacienteId, clinicaId],
    );

    if (pacientes.length === 0) {
      return Response.json(
        { error: "Paciente não encontrado" },
        { status: 404 },
      );
    }

    // Formata o contato de emergência como objeto (se existir) e remove campos auxiliares
    const pacienteData = pacientes[0];
    if (pacienteData.contato_id) {
      pacienteData.contato_emergencia = {
        nome: pacienteData.contato_nome,
        telefone: pacienteData.contato_telefone,
        parentesco: pacienteData.contato_parentesco,
      };
    } else {
      pacienteData.contato_emergencia = null;
    }
    if (pacienteData.tipo === "menor") {
      pacienteData.responsavel = pacienteData.responsavel_nome
        ? {
            nome: pacienteData.responsavel_nome,
            cpf: pacienteData.responsavel_cpf,
            telefone: pacienteData.responsavel_telefone,
            email: pacienteData.responsavel_email,
            parentesco: pacienteData.responsavel_parentesco,
            escolaridade: pacienteData.responsavel_escolaridade,
          }
        : null;
    }
    delete pacienteData.contato_id;
    delete pacienteData.contato_nome;
    delete pacienteData.contato_telefone;
    delete pacienteData.contato_parentesco;

    const [resumoHistorico] = await connection.execute<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS total,
         SUM(status IN ('concluido', 'concluida', 'realizado', 'realizada')) AS concluidas,
         SUM(status = 'falta') AS faltas,
         SUM(status IN ('cancelado', 'cancelada')) AS canceladas,
         SUM(status IN ('agendado', 'agendada', 'remarcado', 'remarcada', 'pendente')) AS proximas
       FROM consultas
       WHERE paciente_id = ? AND clinica_id = ? AND deleted_at IS NULL`,
      [pacienteId, clinicaId],
    );

    const [ultimasConsultas] = await connection.execute<RowDataPacket[]>(
      `SELECT
         c.id,
         c.data_consulta,
         c.horario_inicio,
         c.horario_fim,
         c.status,
         c.tipo_atendimento,
         c.tipo_outro,
         s.nome AS sala_nome,
         u.nome AS psicologo_nome
       FROM consultas c
       LEFT JOIN salas s ON s.id = c.sala_id
       LEFT JOIN usuarios u ON u.id = c.psicologo_id
       WHERE c.paciente_id = ? AND c.clinica_id = ? AND c.deleted_at IS NULL
       ORDER BY c.data_consulta DESC, c.horario_inicio DESC`,
      [pacienteId, clinicaId],
    );

    pacienteData.historico_consultas = ultimasConsultas.map((consulta) => ({
      id: Number(consulta.id),
      data_consulta: String(consulta.data_consulta || ""),
      horario_inicio: String(consulta.horario_inicio || ""),
      horario_fim: String(consulta.horario_fim || ""),
      status: String(consulta.status || ""),
      tipo_atendimento: String(consulta.tipo_atendimento || ""),
      tipo_outro: consulta.tipo_outro ? String(consulta.tipo_outro) : null,
      sala_nome: consulta.sala_nome ? String(consulta.sala_nome) : null,
      psicologo_nome: consulta.psicologo_nome ? String(consulta.psicologo_nome) : null,
    }));
    pacienteData.historico_consultas_resumo = {
      total: Number(resumoHistorico[0]?.total || 0),
      concluidas: Number(resumoHistorico[0]?.concluidas || 0),
      faltas: Number(resumoHistorico[0]?.faltas || 0),
      canceladas: Number(resumoHistorico[0]?.canceladas || 0),
      proximas: Number(resumoHistorico[0]?.proximas || 0),
    };

    return Response.json({ success: true, data: pacienteData });
  } catch (error) {
    console.error("GET erro:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  } finally {
    if (connection) await connection.end();
  }
}

// PUT
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let connection = null;
  try {
    const { id } = await context.params;
    const pacienteId = Number(id);
    const body = await request.json();
    const { usuario_id, ...dados } = body as {
      usuario_id: number;
    } & PacienteUpdateData;

    if (!usuario_id) {
      return Response.json(
        { error: "Usuário não autenticado" },
        { status: 401 },
      );
    }
    if (Number.isNaN(pacienteId)) {
      return Response.json(
        { error: "ID do paciente inválido" },
        { status: 400 },
      );
    }

    connection = await getConnection();

    // Verifica a clínica do usuário
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
    const clinicaId = usuarios[0].clinica_id;

    // Verifica se o paciente existe e pertence à clínica (não excluído)
    const [existe] = await connection.execute<RowDataPacket[]>(
      "SELECT id FROM pacientes WHERE id = ? AND clinica_id = ? AND deleted_at IS NULL",
      [pacienteId, clinicaId],
    );
    if (existe.length === 0) {
      return Response.json(
        { error: "Paciente não encontrado" },
        { status: 404 },
      );
    }

    // Busca os dados atuais (ativo e status_atendimento)
    const [pacienteAtual] = await connection.execute<RowDataPacket[]>(
      "SELECT nome, ativo, status_atendimento, psicologo_responsavel_id FROM pacientes WHERE id = ?",
      [pacienteId],
    );
    const atual = pacienteAtual[0];

    // REGRAS DE NEGÓCIO – STATUS DE ATENDIMENTO E ATIVAÇÃO
    // Bloquear alteração de status se o paciente estiver inativo
    if (dados.status_atendimento !== undefined && atual.ativo === 0) {
      return Response.json(
        {
          error: "Paciente inativo não pode ter status de atendimento alterado",
        },
        { status: 400 },
      );
    }
    // Ao inativar (ativo = false), força status = 'encerrado'
    if (dados.ativo === false && atual.ativo === 1) {
      dados.status_atendimento = "encerrado";
    }
    // Ao reativar (ativo = true), força status = 'fila_espera'
    if (dados.ativo === true && atual.ativo === 0) {
      dados.status_atendimento = "fila_espera";
    }

    // Valida CPF, se fornecido
    if (dados.cpf && !validarCPF(dados.cpf)) {
      return Response.json({ error: "CPF inválido" }, { status: 400 });
    }
    if (dados.cpf) {
      const cpfNumeros = String(dados.cpf).replace(/\D/g, "");
      const [duplicados] = await connection.execute<RowDataPacket[]>(
        `SELECT id FROM pacientes
                 WHERE cpf = ? AND id != ?`,
        [cpfNumeros, pacienteId],
      );
      if (duplicados.length > 0) {
        return Response.json(
          { error: "Já existe um paciente cadastrado com este CPF." },
          { status: 400 },
        );
      }
    }

    if (dados.responsavel) {
      dados.responsavel_nome = dados.responsavel.nome?.trim() || null;
      dados.responsavel_cpf = dados.responsavel.cpf
        ? String(dados.responsavel.cpf).replace(/\D/g, "")
        : null;
      dados.responsavel_telefone = dados.responsavel.telefone?.trim() || null;
      dados.responsavel_email = dados.responsavel.email?.trim() || null;
      dados.responsavel_parentesco =
        dados.responsavel.parentesco?.trim() ||
        dados.responsavel.grau_parentesco?.trim() ||
        null;
      dados.responsavel_escolaridade =
        dados.responsavel.escolaridade?.trim() || null;
    }

    // SEPARAÇÃO DE CAMPOS: PACIENTE vs CONTATO DE EMERGÊNCIA
    const colunasPaciente = [
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
      "responsavel_nome",
      "responsavel_cpf",
      "responsavel_telefone",
      "responsavel_email",
      "responsavel_parentesco",
      "responsavel_escolaridade",
      "observacoes",
      "ativo",
      "sem_numero",
      "status_atendimento", // incluído pois é coluna da tabela pacientes
    ];

    const campos: string[] = [];
    const valores: Array<string | number | boolean | null> = [];

    // Separar contato de emergência para processamento individual
    let contatoEmergencia: ContatoEmergenciaInput | null = null;

    for (const [key, value] of Object.entries(dados)) {
      if (value === undefined) continue;

      // Se for o contato de emergência, guardamos em separado
      if (key === "contato_emergencia") {
        contatoEmergencia = value as ContatoEmergenciaInput;
        continue;
      }

      if (typeof value === "object" && value !== null) {
        continue;
      }

      // Ignora campos que não são colunas reais da tabela pacientes
      if (!colunasPaciente.includes(key)) continue;

      // Converte o valor para o tipo correto antes de persistir
      let valorFinal: string | number | boolean | null = value as unknown as
        | string
        | number
        | boolean
        | null;
      if (key === "cpf") {
        valorFinal = value ? String(value).replace(/\D/g, "") : null;
      } else if (key === "cep") {
        valorFinal = value ? String(value).replace(/\D/g, "") : null;
      } else if (key === "ativo") {
        valorFinal = value ? 1 : 0;
      } else if (key === "responsavel_cpf") {
        valorFinal = value ? String(value).replace(/\D/g, "") : null;
      } else if (
        ["possui_deficiencia", "possui_cadastro_unico", "sem_numero"].includes(
          key,
        )
      ) {
        valorFinal = value ? 1 : 0;
      } else if (key === "status_atendimento") {
        valorFinal = value; // string, já validada pelas regras de negócio
      } else {
        valorFinal = value === null ? null : String(value);
      }

      campos.push(`${key} = ?`);
      valores.push(valorFinal);
    }

    // Só executa UPDATE se houver campos a modificar na tabela pacientes
    if (campos.length > 0) {
      campos.push("atualizado_em = NOW()");
      valores.push(pacienteId);
      await connection.execute(
        `UPDATE pacientes SET ${campos.join(", ")} WHERE id = ?`,
        valores,
      );
    }

    await reconciliarNotificacaoPacienteSemConsultaAgendada(connection, {
      clinicaId,
      pacienteId,
    }).catch((error) => {
      console.error(
        "Erro ao reconciliar notificação de paciente sem consulta agendada:",
        error,
      );
    });

    // CONTATO DE EMERGÊNCIA (tabela contatos_emergencia)

    // Verificação robusta: o valor deve ser um objeto plano, não array e não nulo
    if (
      contatoEmergencia &&
      typeof contatoEmergencia === "object" &&
      !Array.isArray(contatoEmergencia)
    ) {
      // Remove todos os contatos de emergência anteriores do paciente
      // (assume-se que cada paciente tenha no máximo um contato de emergência principal)
      await connection.execute(
        "DELETE FROM contatos_emergencia WHERE paciente_id = ?",
        [pacienteId],
      );

      // Extrai as propriedades com type safety (uso de 'as any' para acesso dinâmico)
      const nome = contatoEmergencia.nome;
      const telefone = contatoEmergencia.telefone;
      const parentesco = contatoEmergencia.parentesco;

      // Insere um novo registro apenas se nome e telefone estiverem preenchidos
      if (nome && telefone) {
        await connection.execute(
          `INSERT INTO contatos_emergencia (paciente_id, nome, telefone, parentesco) 
                     VALUES (?, ?, ?, ?)`,
          [pacienteId, nome, telefone, parentesco || null],
        );
      }
    }

    // Log de auditoria (usando snapshot após alterações)
    const dadosAntigos = await buscarDadosRegistro("pacientes", pacienteId);
    const dadosNovos = await buscarDadosRegistro("pacientes", pacienteId);
    await registrarLog({
      usuario_id,
      tabela: "pacientes",
      registro_id: pacienteId,
      acao: "UPDATE",
      dados_antigos: dadosAntigos,
      dados_novos: dadosNovos,
    });

    return Response.json({
      success: true,
      message: "Paciente atualizado com sucesso",
    });
  } catch (error) {
    console.error("PUT erro:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  } finally {
    if (connection) await connection.end();
  }
}

// DELETE
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let connection = null;
  try {
    const { id } = await context.params;
    const pacienteId = Number(id);
    const url = new URL(request.url);
    const usuarioId = Number(url.searchParams.get("usuario_id") || "0");

    if (!usuarioId) {
      return Response.json(
        { error: "Usuário não autenticado" },
        { status: 401 },
      );
    }
    if (Number.isNaN(pacienteId)) {
      return Response.json(
        { error: "ID do paciente inválido" },
        { status: 400 },
      );
    }

    connection = await getConnection();

    const [usuarios] = await connection.execute<RowDataPacket[]>(
      "SELECT clinica_id FROM usuarios WHERE id = ?",
      [usuarioId],
    );
    if (usuarios.length === 0) {
      return Response.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }
    const clinicaId = usuarios[0].clinica_id;

    // Verifica se o paciente existe e pertence à clínica (não excluído)
    const [pacientes] = await connection.execute<RowDataPacket[]>(
      "SELECT id, status_atendimento, psicologo_responsavel_id FROM pacientes WHERE id = ? AND clinica_id = ? AND deleted_at IS NULL",
      [pacienteId, clinicaId],
    );
    if (pacientes.length === 0) {
      return Response.json(
        { error: "Paciente não encontrado ou já excluído" },
        { status: 404 },
      );
    }

    const [consultas] = await connection.execute<RowDataPacket[]>(
      "SELECT id FROM consultas WHERE paciente_id = ? AND clinica_id = ? AND deleted_at IS NULL LIMIT 1",
      [pacienteId, clinicaId],
    );
    const temConsultas = consultas.length > 0;

    const [historico] = await connection.execute<RowDataPacket[]>(
      "SELECT id FROM paciente_acompanhamento_historico WHERE paciente_id = ? AND clinica_id = ? AND deleted_at IS NULL LIMIT 1",
      [pacienteId, clinicaId],
    );
    const temHistorico = historico.length > 0;

    const podeExcluir =
      !temConsultas &&
      !temHistorico &&
      pacientes[0].status_atendimento === "fila_espera" &&
      !pacientes[0].psicologo_responsavel_id;

    if (!podeExcluir) {
      return Response.json(
        {
          error:
            "Não é possível excluir este paciente porque ele já possui movimentações vinculadas.",
        },
        { status: 409 },
      );
    }

    await connection.execute(
      "UPDATE pacientes SET deleted_at = NOW(), ativo = 0, atualizado_em = NOW() WHERE id = ?",
      [pacienteId],
    );

    // Log de auditoria
    const dadosAntigos = await buscarDadosRegistro("pacientes", pacienteId);
    await registrarLog({
      usuario_id: usuarioId,
      tabela: "pacientes",
      registro_id: pacienteId,
      acao: "DELETE",
      dados_antigos: dadosAntigos,
      dados_novos: { deleted_at: new Date().toISOString(), ativo: 0 },
    });

    return Response.json({
      success: true,
      message: "Paciente excluído com sucesso",
      tipo_operacao: "excluido",
    });
  } catch (error) {
    console.error("DELETE erro:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  } finally {
    if (connection) await connection.end();
  }
}
