// app/api/login/route.ts
// API para autenticar usuário 

import { getConnection } from '@/lib/mysql';
import { compararSenha } from '@/lib/validacoes';
import { RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
  let connection = null;
  
  try {
    const { email, senha } = await request.json();
    
    console.log(`Tentativa de login para: ${email}`);
    
    if (!email || !senha) {
      return Response.json(
        { error: 'E-mail e senha são obrigatórios' },
        { status: 400 }
      );
    }
    
    connection = await getConnection();
    
    // Busca o usuário e junta com a tabela perfis para pegar o nome correto
    const [usuarios] = await connection.execute<RowDataPacket[]>(
      `SELECT u.id, u.nome, u.email, u.senha_hash, u.perfil_id, u.crp, u.clinica_id, p.nome as perfil_nome
       FROM usuarios u
       LEFT JOIN perfis p ON u.perfil_id = p.id
       WHERE u.email = ?`,
      [email]
    );
    
    console.log(`Usuários encontrados: ${usuarios.length}`);
    
    if (usuarios.length === 0) {
      return Response.json(
        { error: 'E-mail ou senha inválidos' },
        { status: 401 }
      );
    }
    
    const usuario = usuarios[0];
    
    console.log('Usuário encontrado:', {
      id: usuario.id,
      nome: usuario.nome,
      perfil_id: usuario.perfil_id,
      perfil_nome: usuario.perfil_nome
    });
    
    // Compara a senha digitada com o hash do banco
    const senhaValida = await compararSenha(senha, usuario.senha_hash);
    
    if (!senhaValida) {
      return Response.json(
        { error: 'E-mail ou senha inválidos' },
        { status: 401 }
      );
    }
    
    // Busca o nome da clínica se existir
    let nomeClinica = null;
    if (usuario.clinica_id) {
      const [clinicas] = await connection.execute<RowDataPacket[]>(
        `SELECT nome_fantasia FROM clinicas WHERE id = ?`,
        [usuario.clinica_id]
      );
      if (clinicas.length > 0) {
        nomeClinica = clinicas[0].nome_fantasia;
      }
    }
    
    // Retorna os dados do usuário
    // IMPORTANTE: perfil deve ser o nome vindo da tabela perfis (secretária ou psicólogo)
    return Response.json({
      success: true,
      message: 'Login realizado com sucesso',
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil_nome,  // 'secretária' ou 'psicólogo'
        perfil_id: usuario.perfil_id,  // 1 ou 2
        clinica_id: usuario.clinica_id,
        clinica: nomeClinica
      }
    });
    
  } catch (error) {
    console.error('Erro no login:', error);
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