// app/api/usuarios/route.ts

import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getConnection } from "@/lib/mysql";
import {
  gerarHashSenha,
  validarCNPJ,
  validarCPF,
  validarCRP,
  validarEmail,
  validarSenhaForte,
} from "@/lib/validacoes";

function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

export async function POST(request: Request) {
  let connection = null;

  try {
    const body = await request.json();
    const { nome, email, senha, confirmarSenha, perfil_id, cnpj, crp, cpf } =
      body;

    console.log("Dados recebidos:", { nome, email, perfil_id, cnpj, cpf });

    // Validações de campos obrigatórios (cpf adicionado dinamicamente abaixo)
    if (!nome || !email || !senha || !confirmarSenha || !perfil_id || !cnpj) {
      return Response.json(
        { error: "Todos os campos são obrigatórios." },
        { status: 400 },
      );
    }

    if (perfil_id !== 1 && perfil_id !== 2) {
      return Response.json(
        {
          error: "Perfil inválido. Use 1 para Secretária ou 2 para Psicólogo.",
        },
        { status: 400 },
      );
    }

    if (!validarEmail(email)) {
      return Response.json({ error: "Email inválido." }, { status: 400 });
    }

    if (senha !== confirmarSenha) {
      return Response.json(
        { error: "As senhas não coincidem." },
        { status: 400 },
      );
    }

    const validacaoSenha = validarSenhaForte(senha);
    if (!validacaoSenha.valida) {
      return Response.json(
        { error: `Senha fraca: ${validacaoSenha.mensagem}` },
        { status: 400 },
      );
    }

    const cnpjLimpo = somenteNumeros(cnpj);

    if (!validarCNPJ(cnpjLimpo)) {
      return Response.json({ error: "CNPJ inválido." }, { status: 400 });
    }

    // Validações específicas por perfil
    if (perfil_id === 2) {
      // Psicólogo: CRP obrigatório e válido
      if (!crp) {
        return Response.json(
          { error: "CRP é obrigatório para psicólogos." },
          { status: 400 },
        );
      }
      if (!validarCRP(crp)) {
        return Response.json(
          { error: 'CRP inválido. Formato esperado: "XX/XXXXX".' },
          { status: 400 },
        );
      }
    }

    // Validação do CPF para secretária
    if (perfil_id === 1) {
      if (!cpf) {
        return Response.json(
          { error: "CPF é obrigatório para secretárias." },
          { status: 400 },
        );
      }
      // Remove formatação e valida
      const cpfLimpo = somenteNumeros(cpf);
      if (!validarCPF(cpfLimpo)) {
        return Response.json(
          { error: "CPF inválido. Verifique os dígitos." },
          { status: 400 },
        );
      }
    }

    connection = await getConnection();
    const [colunasResponsavelClinica] = await connection.execute<
      RowDataPacket[]
    >("SHOW COLUMNS FROM clinicas LIKE 'responsavel_clinica_id'");
    const colunaResponsavelExiste = colunasResponsavelClinica.length > 0;

    // Verifica se o email já está cadastrado
    const [emailsExistentes] = await connection.execute<RowDataPacket[]>(
      "SELECT id FROM usuarios WHERE email = ?",
      [email],
    );
    if (emailsExistentes.length > 0) {
      return Response.json(
        { error: "Este email já está cadastrado." },
        { status: 400 },
      );
    }

    // Verifica se o CPF já está cadastrado (apenas se foi informado)
    if (cpf) {
      const cpfLimpo = somenteNumeros(cpf);
      const [cpfsExistentes] = await connection.execute<RowDataPacket[]>(
        "SELECT id FROM usuarios WHERE cpf = ?",
        [cpfLimpo],
      );
      if (cpfsExistentes.length > 0) {
        return Response.json(
          { error: "Este CPF já está cadastrado no sistema." },
          { status: 400 },
        );
      }
    }

    await connection.beginTransaction();

    // Busca clínica pelo CNPJ (mesmo código)
    const [clinicas] = await connection.execute<RowDataPacket[]>(
      "SELECT id FROM clinicas WHERE cnpj = ?",
      [cnpjLimpo],
    );
    let clinicaId: number;
    let clinicaCriadaNesteCadastro = false;
    if (clinicas.length === 0) {
      console.log("Clínica não encontrada, criando nova...");
      const [resultado] = await connection.execute<ResultSetHeader>(
        `INSERT INTO clinicas (cnpj, nome_fantasia, razao_social) 
         VALUES (?, ?, ?)`,
        [cnpjLimpo, "Clínica a definir", "Clínica a definir"],
      );
      clinicaId = resultado.insertId;
      clinicaCriadaNesteCadastro = true;
    } else {
      clinicaId = clinicas[0].id;
    }

    // Gera hash da senha
    const hashSenha = await gerarHashSenha(senha);

    // Prepara o CPF (apenas números) ou NULL para psicólogo
    const cpfFinal = perfil_id === 1 ? somenteNumeros(cpf) : null;

    // Insere novo usuário sem criar perfil administrativo paralelo.
    // A responsabilidade institucional é gravada em clinicas.responsavel_clinica_id.
    const camposInsercao =
      "(nome, email, senha_hash, perfil_id, clinica_id, crp, cpf)";
    const valoresInsercao = [
      nome,
      email,
      hashSenha,
      perfil_id,
      clinicaId,
      crp || null,
      cpfFinal,
    ];

    const [resultado] = await connection.execute<ResultSetHeader>(
      `INSERT INTO usuarios ${camposInsercao} VALUES (${valoresInsercao.map(() => "?").join(", ")})`,
      valoresInsercao,
    );

    if (perfil_id === 2 && colunaResponsavelExiste) {
      const [clinicaAtual] = await connection.execute<RowDataPacket[]>(
        "SELECT responsavel_clinica_id FROM clinicas WHERE id = ? LIMIT 1",
        [clinicaId],
      );
      const responsavelAtual = clinicaAtual[0]?.responsavel_clinica_id || null;

      if (clinicaCriadaNesteCadastro || !responsavelAtual) {
        await connection.execute(
          "UPDATE clinicas SET responsavel_clinica_id = ? WHERE id = ?",
          [resultado.insertId, clinicaId],
        );
      }
    }

    await connection.commit();

    console.log("Usuário cadastrado com sucesso!");

    return Response.json({
      success: true,
      message: "Usuário cadastrado com sucesso!",
      usuarioId: resultado.insertId,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback().catch(() => undefined);
    }
    console.error("Erro detalhado no cadastro:", error);
    return Response.json(
      { error: `Erro interno do servidor: ${(error as Error).message}` },
      { status: 500 },
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

