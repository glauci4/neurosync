// app/api/usuarios/route.ts
// API para cadastro de usuários com validação de campos, verificação de duplicidade de email, associação com clínica via CNPJ e criação de perfil (secretária ou psicólogo).

import { getConnection } from "@/lib/mysql";
import {
  validarCNPJ,
  validarCRP,
  validarEmail,
  validarSenhaForte,
  gerarHashSenha,
} from "@/lib/validacoes";
import { RowDataPacket } from "mysql2";

// Interface para tipar os dados que serão recebidos do front-end
interface UsuarioCadastro {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  perfil_id: number;  // 1 = secretaria, 2 = psicologo
  cnpj: string;
  crp?: string;
}

// Método POST para criar novos usuários
export async function POST(request: Request) {
  let connection = null;

  try {
    // Recebe os dados enviados pelo front-end
    const body = await request.json();
    const { nome, email, senha, confirmarSenha, perfil_id, cnpj, crp } = body;

    console.log('Dados recebidos:', { nome, email, perfil_id, cnpj });

    // Validações de campos obrigatórios
    if (!nome || !email || !senha || !confirmarSenha || !perfil_id || !cnpj) {
      return Response.json(
        { error: "Todos os campos são obrigatórios." },
        { status: 400 },
      );
    }
    
    // Validar se perfil_id é válido (1 ou 2)
    if (perfil_id !== 1 && perfil_id !== 2) {
      return Response.json(
        { error: "Perfil inválido. Use 1 para Secretária ou 2 para Psicólogo." },
        { status: 400 },
      );
    }

    // Valida email
    if (!validarEmail(email)) {
      return Response.json({ error: "Email inválido." }, { status: 400 });
    }

    // Verifica se as senhas coincidem
    if (senha !== confirmarSenha) {
      return Response.json(
        { error: "As senhas não coincidem." },
        { status: 400 },
      );
    }

    // Valida força da senha
    const validacaoSenha = validarSenhaForte(senha);
    if (!validacaoSenha.valida) {
      return Response.json(
        { error: `Senha fraca: ${validacaoSenha.mensagem}` },
        { status: 400 },
      );
    }

    // Valida CNPJ
    if (!validarCNPJ(cnpj)) {
      return Response.json({ error: "CNPJ inválido." }, { status: 400 });
    }

    // Valida CRP apenas para psicólogos (perfil_id = 2)
    if (perfil_id === 2) {
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

    connection = await getConnection();

    // Conecta ao banco de dados
    connection = await getConnection();

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

    // Busca clínica pelo CNPJ
    let [clinicas] = await connection.execute<RowDataPacket[]>(
      "SELECT id FROM clinicas WHERE cnpj = ?",
      [cnpj],
    );

    let clinicaId: number;

    console.log("Resultado da busca da clínica:", clinicas);

    if (clinicas.length === 0) {
      // Se não encontrar, cria uma nova clínica com dados básicos
      console.log("Clínica não encontrada, criando nova...");
      const [resultado] = await connection.execute(
        `INSERT INTO clinicas (cnpj, nome_fantasia, razao_social) 
         VALUES (?, ?, ?)`,
        [cnpj, "Clínica a definir", "Clínica a definir"],
      );
      clinicaId = (resultado as any).insertId;
      console.log("Clínica criada com ID:", clinicaId);
    } else {
      clinicaId = clinicas[0].id;
      console.log("Clínica encontrada com ID:", clinicaId);
    }

    // Gera hash da senha
    const hashSenha = await gerarHashSenha(senha);

     // Insere novo usuário com perfil_id
    const [resultado] = await connection.execute(
      `INSERT INTO usuarios 
       (nome, email, senha_hash, perfil_id, clinica_id, crp) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nome, email, hashSenha, perfil_id, clinicaId, crp || null],
    );

    console.log('Usuário cadastrado com sucesso!');

    return Response.json({
      success: true,
      message: "Usuário cadastrado com sucesso!",
      usuarioId: (resultado as any).insertId,
    });
    
  } catch (error) {
    console.error("Erro detalhado no cadastro:", error);
    return Response.json(
      { error: "Erro interno do servidor: " + (error as Error).message },
      { status: 500 },
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}