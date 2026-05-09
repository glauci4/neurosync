// lib/email.ts
// Configuração para envio de e-mails usando Nodemailer

import nodemailer from 'nodemailer';

// Configuração do transporte de e-mail
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
        user: 'seu-usuario@ethereal.email', // Será gerado no primeiro teste
        pass: 'sua-senha' // Será gerado no primeiro teste
    }
});

// Função para enviar e-mail de recuperação de senha
export async function enviarEmailRecuperacao(email: string, token: string, nome: string) {
    const linkRecuperacao = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/redefinir-senha?token=${token}`;
    
    const mailOptions = {
        from: '"NeuroSync" <noreply@neurosync.com>',
        to: email,
        subject: 'Recuperação de Senha - NeuroSync',
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
                <hr>
                <p style="font-size: 12px; color: #666;">NeuroSync - Plataforma de agendamento para clínicas psicológicas</p>
            </div>
        `
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('E-mail enviado:', info.messageId);
        return true;
    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        return false;
    }
}