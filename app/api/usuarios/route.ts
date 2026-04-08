// app/api/usuarios/route.ts
import { getConnection } from '@/lib/mysql';
import { 
    validarCNPJ, 
    validarCRP, 
    validarEmail, 
    validarSenhaForte,
    gerarHashSenha
} from '@/lib/validacoes';
import { RowDataPacket } from 'mysql2';

// Interface para tipar os dados que serão recebidos do front-end
interface UsuarioCadastro {
    nome: string;
    email: string;
    senha: string;
    confirmarSenha: string;
    perfil: 'psicologo' | 'secretaria';
    cnpj: string;
    crp?: string; // O CRP é obrigatório apenas para psicólogos
}

// Método POST para criar novos usuários
export async function POST(request: Request) {
    let connection = null; // Variável para armazenar a conexão com o banco
    
    try {
        // Recebe os dados enviados pelo front-end
        const body = await request.json();
        const { nome, email, senha, confirmarSenha, perfil, cnpj, crp } = body;
        
        // Validações de campos obrigatórios
        if (!nome || !email || !senha || !confirmarSenha || !perfil || !cnpj) {
            return Response.json(
                { error: 'Todos os campos são obrigatórios.' },
                { status: 400 }
            );
        }
        
        // Valida email
        if (!validarEmail(email)) {
            return Response.json(
                { error: 'Email inválido.' },
                { status: 400 }
            );
        }
        
        // Verifica se as senhas coincidem
        if (senha !== confirmarSenha) {
            return Response.json(
                { error: 'As senhas não coincidem.' },
                { status: 400 }
            );
        }
        
        // Valida força da senha
        const validacaoSenha = validarSenhaForte(senha);
        if (!validacaoSenha.valida) {
            return Response.json(
                { error: `Senha fraca: ${validacaoSenha.mensagem}` },
                { status: 400 }
            );
        }
        
        // Valida CNPJ
        if (!validarCNPJ(cnpj)) {
            return Response.json(
                { error: 'CNPJ inválido.' },
                { status: 400 }
            );
        }
        
        // Valida CRP apenas para psicólogos
        if (perfil === 'psicologo') {
            if (!crp) {
                return Response.json(
                    { error: 'CRP é obrigatório para psicólogos.' },
                    { status: 400 }
                );
            }
            if (!validarCRP(crp)) {
                return Response.json(
                    { error: 'CRP inválido. Formato esperado: "XX/XXXXX".' },
                    { status: 400 }
                );
            }
        }
        
        // Conecta ao banco de dados
        connection = await getConnection();
        
        // Verifica se o email já está cadastrado
        const [emailsExistentes] = await connection.execute<RowDataPacket[]>(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );
        
        if (emailsExistentes.length > 0) {
            return Response.json(
                { error: 'Este email já está cadastrado.' },
                { status: 400 }
            );
        }
        
        // Busca clínica pelo CNPJ
        let [clinicas] = await connection.execute<RowDataPacket[]>(
            'SELECT id FROM clinicas WHERE cnpj = ?',
            [cnpj]
        );
        
        let clinicaId: number;
        
        console.log('Resultado da busca da clínica:', clinicas);
        
        if (clinicas.length === 0) {
            // Se não encontrar, cria uma nova clínica com dados básicos
            console.log('Clínica não encontrada, criando nova...');
            const [resultado] = await connection.execute(
                `INSERT INTO clinicas (cnpj, nome_fantasia, razao_social) 
                 VALUES (?, ?, ?)`,
                [cnpj, 'Clínica a definir', 'Clínica a definir']
            );
            clinicaId = (resultado as any).insertId;
            console.log('Clínica criada com ID:', clinicaId);
        } else {
            clinicaId = clinicas[0].id;
            console.log('Clínica encontrada com ID:', clinicaId);
        }
        
        // Gera hash da senha
        const hashSenha = await gerarHashSenha(senha);
        
        // Insere novo usuário
        const [resultado] = await connection.execute(
            `INSERT INTO usuarios 
             (nome, email, senha_hash, perfil, clinica_id, crp) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nome, email, hashSenha, perfil, clinicaId, crp || null]
        );
        
        // Retorna resposta de sucesso
        return Response.json({
            success: true,
            message: 'Usuário cadastrado com sucesso!',
            usuarioId: (resultado as any).insertId
        });
        
    } catch (error) {
        // Log detalhado do erro
        console.error('Erro detalhado no cadastro:', error);
        return Response.json(
            { error: 'Erro interno do servidor: ' + (error as Error).message },
            { status: 500 }
        );
    } finally {
        // Fecha a conexão com o banco, garantindo que não fique aberta
        if (connection) {
            await connection.end();
        }
    }
}