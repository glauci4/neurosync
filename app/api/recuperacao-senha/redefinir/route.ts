// app/api/recuperacao-senha/redefinir/route.ts
// API para redefinir a senha usando o token

import { getConnection } from '@/lib/mysql';
import { validarSenhaForte, gerarHashSenha } from '@/lib/validacoes';
import { RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
    let connection = null;
    
    try {
        const body = await request.json();
        const { token, novaSenha, confirmarSenha } = body;
        
        // Validações básicas
        if (!token || !novaSenha || !confirmarSenha) {
            return Response.json(
                { error: 'Todos os campos são obrigatórios' },
                { status: 400 }
            );
        }
        
        // Verifica se as senhas coincidem
        if (novaSenha !== confirmarSenha) {
            return Response.json(
                { error: 'As senhas não coincidem' },
                { status: 400 }
            );
        }
        
        // Valida se a senha é forte
        const validacaoSenha = validarSenhaForte(novaSenha);
        if (!validacaoSenha.valida) {
            return Response.json(
                { error: validacaoSenha.mensagem },
                { status: 400 }
            );
        }
        
        connection = await getConnection();
        
        // Busca o token no banco de dados
        const [tokens] = await connection.execute<RowDataPacket[]>(
            `SELECT email, expiracao, usado 
             FROM recuperacao_senha 
             WHERE token = ?`,
            [token]
        );
        
        if (tokens.length === 0) {
            return Response.json(
                { error: 'Token inválido' },
                { status: 400 }
            );
        }
        
        const tokenData = tokens[0];
        
        // Verifica se o token já foi usado
        if (tokenData.usado) {
            return Response.json(
                { error: 'Este link já foi utilizado' },
                { status: 400 }
            );
        }
        
        // Verifica se o token expirou
        const agora = new Date();
        const expiracao = new Date(tokenData.expiracao);
        
        if (agora > expiracao) {
            return Response.json(
                { error: 'Este link expirou. Solicite uma nova recuperação' },
                { status: 400 }
            );
        }
        
        // Gera o hash da nova senha
        const hashSenha = await gerarHashSenha(novaSenha);
        
        // Atualiza a senha do usuário
        await connection.execute(
            'UPDATE usuarios SET senha_hash = ? WHERE email = ?',
            [hashSenha, tokenData.email]
        );
        
        // Marca o token como usado
        await connection.execute(
            'UPDATE recuperacao_senha SET usado = TRUE WHERE token = ?',
            [token]
        );
        
        return Response.json({
            success: true,
            message: 'Senha redefinida com sucesso!'
        });
        
    } catch (error) {
        console.error('Erro na redefinição de senha:', error);
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