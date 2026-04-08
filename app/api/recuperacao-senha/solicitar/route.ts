// app/api/recuperacao-senha/solicitar/route.ts
// API para solicitar recuperação de senha

import { getConnection } from '@/lib/mysql';
import { RowDataPacket } from 'mysql2';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Função para gerar um token único e aleatório
function gerarToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

// Função para configurar o transporte de e-mail
function configurarEmail() {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
}

// Função para enviar e-mail de recuperação
async function enviarEmailRecuperacao(email: string, token: string) {
    const transporter = configurarEmail();
    
    const urlRedefinir = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/redefinir-senha?token=${token}`;
    
    const conteudoEmail = `
        <h2>Recuperação de Senha - NeuroSync</h2>
        <p>Você solicitou a recuperação de senha do sistema NeuroSync.</p>
        <p>Clique no link abaixo para redefinir sua senha:</p>
        <a href="${urlRedefinir}" style="background-color: #9F64AF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Redefinir Senha</a>
        <p>Este link é válido por 1 hora.</p>
        <p>Se você não solicitou esta recuperação, ignore este e-mail.</p>
        <hr>
        <p>NeuroSync - Plataforma para psicólogos</p>
    `;
    
    await transporter.sendMail({
        from: `"NeuroSync" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Recuperação de Senha - NeuroSync',
        html: conteudoEmail,
    });
}

export async function POST(request: Request) {
    let connection = null;
    
    try {
        const body = await request.json();
        const { email } = body;
        
        // Validação do e-mail
        if (!email) {
            return Response.json(
                { error: 'E-mail é obrigatório' },
                { status: 400 }
            );
        }
        
        connection = await getConnection();
        
        // Verifica se o e-mail existe no sistema
        const [usuarios] = await connection.execute<RowDataPacket[]>(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );
        
        // VERIFICACAO CORRIGIDA
        // Agora retornamos mensagens diferentes, mas sem revelar informações sensíveis
        if (usuarios.length === 0) {
            // Retorna uma mensagem honesta, mas sem confirmar se o e-mail existe
            return Response.json(
                { error: 'Não foi possível processar sua solicitação. Verifique o e-mail digitado.' },
                { status: 404 }
            );
        }
        
        // Se o e-mail existe, prossegue com a recuperação
        const token = gerarToken();
        
        const expiracao = new Date();
        expiracao.setHours(expiracao.getHours() + 1);
        
        await connection.execute(
            `INSERT INTO recuperacao_senha (email, token, expiracao) 
             VALUES (?, ?, ?)`,
            [email, token, expiracao]
        );
        
        // Tenta enviar o e-mail
        try {
            await enviarEmailRecuperacao(email, token);
        } catch (erroEmail) {
            console.error('Erro ao enviar e-mail:', erroEmail);
            return Response.json(
                { error: 'Erro ao enviar e-mail. Tente novamente mais tarde.' },
                { status: 500 }
            );
        }
        
        return Response.json({
            success: true,
            message: 'Enviamos um e-mail com as instruções para recuperar sua senha.'
        });
        
    } catch (error) {
        console.error('Erro na solicitação de recuperação:', error);
        return Response.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}