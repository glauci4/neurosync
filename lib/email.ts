// lib/email.ts
// Utilitário para envio de e-mail de recuperação de senha.

import nodemailer from "nodemailer";

function criarTransportador() {
  const usarEmail = String(process.env.USE_EMAIL || "false") === "true";

  if (!usarEmail) {
    return nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = Number(process.env.EMAIL_PORT || "587");
  const secure = String(process.env.EMAIL_SECURE || "false") === "true";
  const user = process.env.EMAIL_USER || "";
  const pass = process.env.EMAIL_PASS || "";

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

export async function enviarEmailRecuperacao(
  email: string,
  token: string,
  nome: string,
) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const linkRecuperacao = `${baseUrl}/redefinir-senha?token=${token}`;
  const transporter = criarTransportador();

  const mailOptions = {
    from: '"NeuroSync" <noreply@neurosync.com>',
    to: email,
    subject: "Recuperação de Senha - NeuroSync",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #9F64AF;">NeuroSync</h1>
        <h2>Olá, ${nome}!</h2>
        <p>Recebemos uma solicitação para redefinir sua senha.</p>
        <p>Clique no link abaixo para criar uma nova senha:</p>
        <a href="${linkRecuperacao}" style="background-color: #9F64AF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Redefinir Senha
        </a>
        <p>Este link é válido por 1 hora.</p>
        <p>Se você não solicitou esta alteração, ignore este e-mail.</p>
        <hr />
        <p style="font-size: 12px; color: #666;">NeuroSync - Plataforma de agendamento para clínicas psicológicas</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}
