// app/api/recuperacao-senha/solicitar/route.ts
// API para solicitar recuperação de senha 

import { getConnection } from "@/lib/mysql";
import { RowDataPacket } from "mysql2";
import nodemailer from "nodemailer";
import crypto from "crypto";

// Gera um token único e seguro para a recuperação de senha, utiliza a biblioteca crypto do Node.js para criar um código aleatório.
// O token será enviado por e-mail e armazenado no banco de dados.
function gerarToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Configura o serviço de envio de e-mails utilizando o Nodemailer.
// As credenciais são obtidas a partir das variáveis de ambiente.

function configurarEmail() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false, // Defina como true se utilizar SSL (porta 465)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// Envia o e-mail de recuperação de senha ao usuário, o e-mail contém um link com token para redefinição da senha.
// @param email - Endereço de e-mail do usuário
// @param token - Token único para redefinição da senha
 
async function enviarEmailRecuperacao(email: string, token: string) {
  const urlRedefinir = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/redefinir-senha?token=${token}`;
  
  // Define a URL da logo baseada no ambiente (pública)
  const logoUrl = process.env.NEXTAUTH_URL
    ? `${process.env.NEXTAUTH_URL}/logo.png`
    : "http://localhost:3000/logo.png";
  
  const transporter = configurarEmail();
  
  // IMPORTANTE!!! conteudoEmail deve ser uma string, não uma função
  const conteudoEmail = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Recuperação de Senha - NeuroSync</title>
      <link href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap" rel="stylesheet">
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
      <div style="max-width: 500px; margin: 0 auto; background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center;">
          <img src="${logoUrl}" alt="NeuroSync Logo" style="width: 60px; height: 60px; border-radius: 15px; object-fit: cover;">
          <h1 style="color: #9F64AF; font-family: 'Segoe Script', 'Comic Sans MS', 'Apple Chancery', cursive; margin: 10px 0; font-size: 28px;">NeuroSync</h1>
        </div>
        <h2 style="color: #333; margin-top: 20px;">Recuperação de Senha</h2>
        <p>Você solicitou a recuperação de senha do sistema NeuroSync.</p>
        <p>Clique no botão abaixo para redefinir sua senha:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${urlRedefinir}" style="background-color: #9F64AF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Redefinir Senha</a>
        </div>
        <p>Este link é válido por <strong>1 hora</strong>.</p>
        <p>Se você não solicitou esta recuperação, ignore este e-mail.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px; text-align: center;">NeuroSync - Plataforma de agendamento integrada para psicólogos</p>
      </div>
    </body>
    </html>
  `;
  
  await transporter.sendMail({
    from: `"NeuroSync" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Recuperação de Senha - NeuroSync",
    html: conteudoEmail, // Aqui deve ser uma string, não uma função
  });
  
  console.log(`E-mail de recuperação enviado para: ${email}`);
}

// Método POST responsável por processar a solicitação de recuperação de senha.

export async function POST(request: Request) {
  let connection = null;

  try {
    // Obtém os dados enviados na requisição
    const body = await request.json();
    const { email } = body;

    console.log(`Solicitação de recuperação para: ${email}`);

    // Validação do campo de e-mail
    if (!email) {
      return Response.json(
        { error: "E-mail é obrigatório" },
        { status: 400 }
      );
    }

    // Estabelece conexão com o banco de dados
    connection = await getConnection();

    // Busca o usuário pelo e-mail informado
    const [usuarios] = await connection.execute<RowDataPacket[]>(
      "SELECT id FROM usuarios WHERE email = ?",
      [email]
    );

    console.log(`Usuários encontrados: ${usuarios.length}`);

    // Verifica se o e-mail está cadastrado
    if (usuarios.length === 0) {
      return Response.json(
        {
          error:
            "E-mail não encontrado. Verifique se você digitou corretamente.",
        },
        { status: 404 }
      );
    }

    // Obtém o ID do usuário
    const usuarioId = usuarios[0].id;

    // Gera um token seguro
    const token = gerarToken();

    // Define a data de expiração (1 hora)
    const expiraEm = new Date();
    expiraEm.setHours(expiraEm.getHours() + 1);

    console.log(`Token gerado para usuário ID ${usuarioId}`);

    // Remove tokens antigos para evitar múltiplos tokens válidos, o código tenta identificar automaticamente o nome correto da coluna (usuario_id ou usuarios_id), garantindo compatibilidade com o banco.
     
    try {
      await connection.execute(
        `DELETE FROM recuperacao_senha WHERE usuario_id = ?`,
        [usuarioId]
      );
      console.log("Deletado usando coluna 'usuario_id'");
    } catch (error: any) {
      if (error.message?.includes("Unknown column")) {
        try {
          await connection.execute(
            `DELETE FROM recuperacao_senha WHERE usuarios_id = ?`,
            [usuarioId]
          );
          console.log("Deletado usando coluna 'usuarios_id'");
        } catch {
          console.log(
            "Não foi possível deletar tokens antigos, continuando..."
          );
        }
      }
    }

    // Insere o novo token na tabela de recuperação de senha, também verifica automaticamente o nome correto da coluna.
     
    try {
      await connection.execute(
        `INSERT INTO recuperacao_senha (usuario_id, expira_em, token) VALUES (?, ?, ?)`,
        [usuarioId, expiraEm, token]
      );
      console.log("Token inserido usando coluna 'usuario_id'");
    } catch (error: any) {
      if (error.message?.includes("Unknown column")) {
        await connection.execute(
          `INSERT INTO recuperacao_senha (usuarios_id, expira_em, token) VALUES (?, ?, ?)`,
          [usuarioId, expiraEm, token]
        );
        console.log("Token inserido usando coluna 'usuarios_id'");
      } else {
        throw error;
      }
    }

    // Envia o e-mail de recuperação com o token gerado.
     
    try {
      await enviarEmailRecuperacao(email, token);
      console.log("E-mail enviado com sucesso");
    } catch (erroEmail) {
      console.error("Erro ao enviar e-mail:", erroEmail);
      return Response.json(
        { error: "Erro ao enviar e-mail. Verifique as configurações." },
        { status: 500 }
      );
    }

    // Retorna resposta de sucesso
    return Response.json({
      success: true,
      message:
        "Enviamos um e-mail com as instruções para recuperar sua senha.",
    });
  } catch (error) {
    console.error("Erro na solicitação de recuperação:", error);

    // Retorna erro interno do servidor
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  } finally {
    // Encerra a conexão com o banco de dados
    if (connection) {
      await connection.end();
    }
  }
}