// app/api/recuperacao-senha/redefinir/route.ts
// API para redefinir a senha usando o token enviado por e-mail. Essa API é chamada quando o usuário acessa o link de redefinição de senha, ela valida o token, verifica a nova senha e atualiza o banco de dados.

import { getConnection } from "@/lib/mysql";
import { validarSenhaForte, gerarHashSenha } from "@/lib/validacoes";
import { RowDataPacket } from "mysql2";

// Função responsável por processar a redefinição de senha
export async function POST(request: Request) {
  // Variável para armazenar a conexão com o banco de dados
  let connection = null;
  
  try {
    // Obtém os dados enviados no corpo da requisição
    const body = await request.json();
    const { token, novaSenha, confirmarSenha } = body;
    
    // Exibe parte do token no log para fins de auditoria e depuração
    console.log(`Tentativa de redefinição com token: ${token?.substring(0, 20)}...`);
    
    // Validação: verifica se todos os campos foram preenchidos
    if (!token || !novaSenha || !confirmarSenha) {
      return Response.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }
    
    // Validação: verifica se as senhas informadas coincidem
    if (novaSenha !== confirmarSenha) {
      return Response.json(
        { error: "As senhas não coincidem" },
        { status: 400 }
      );
    }
    
    // Validação: verifica se a senha atende aos critérios de segurança
    const validacaoSenha = validarSenhaForte(novaSenha);
    if (!validacaoSenha.valida) {
      return Response.json(
        { error: validacaoSenha.mensagem },
        { status: 400 }
      );
    }
    
    // Estabelece a conexão com o banco de dados
    connection = await getConnection();
    
    // Tenta buscar o token com diferentes nomes de coluna, isso garante compatibilidade com bancos que utilizam "usuario_id" ou "usuarios_id"
    let tokens: RowDataPacket[] = [];
    let colunaUsuarioId = "";
    
    try {
      // Primeira tentativa utilizando a coluna "usuario_id"
      [tokens] = await connection.execute<RowDataPacket[]>(
        `SELECT usuario_id, expira_em FROM recuperacao_senha WHERE token = ?`,
        [token]
      );
      colunaUsuarioId = "usuario_id";
    } catch (error: any) {
      // Caso a coluna não exista, tenta utilizar "usuarios_id"
      if (error.message?.includes("Unknown column")) {
        [tokens] = await connection.execute<RowDataPacket[]>(
          `SELECT usuarios_id, expira_em FROM recuperacao_senha WHERE token = ?`,
          [token]
        );
        colunaUsuarioId = "usuarios_id";
      } else {
        // Lança o erro caso não seja relacionado ao nome da coluna
        throw error;
      }
    }
    
    // Exibe a quantidade de tokens encontrados no log
    console.log(`Tokens encontrados: ${tokens.length}`);
    
    // Verifica se o token é válido
    if (tokens.length === 0) {
      return Response.json(
        { error: "Token inválido" },
        { status: 400 }
      );
    }
    
    // Obtém os dados do token
    const tokenData = tokens[0];
    
    // Identifica dinamicamente o ID do usuário
    const usuarioId = tokenData[colunaUsuarioId];
    
    // Obtém a data atual e a data de expiração do token
    const agora = new Date();
    const expiraEm = new Date(tokenData.expira_em);
    
    console.log(`Token expira em: ${expiraEm}, Agora: ${agora}`);
    
    // Verifica se o token expirou
    if (agora > expiraEm) {
      return Response.json(
        { error: "Este link expirou. Solicite uma nova recuperação" },
        { status: 400 }
      );
    }
    
    // Gera o hash seguro da nova senha
    const hashSenha = await gerarHashSenha(novaSenha);
    
    // Atualiza a senha do usuário no banco de dados
    await connection.execute(
      "UPDATE usuarios SET senha_hash = ? WHERE id = ?",
      [hashSenha, usuarioId]
    );
    
    console.log(`Senha atualizada para o usuário ID: ${usuarioId}`);
    
    // Remove o token após o uso para evitar reutilização
    await connection.execute(
      "DELETE FROM recuperacao_senha WHERE token = ?",
      [token]
    );
    
    console.log("Token removido após uso");
    
    // Retorna resposta de sucesso
    return Response.json({
      success: true,
      message: "Senha redefinida com sucesso!",
    });
    
  } catch (error) {
    // Exibe o erro no console para depuração
    console.error("Erro na redefinição de senha:", error);
    
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