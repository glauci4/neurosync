// lib/auditoria.ts
// Funções para registro de auditoria no sistema (registra todas as ações de criação, atualização e exclusão)

import { getConnection } from '@/lib/mysql';

// Tipos de ação possíveis no sistema
type AcaoAuditoria = 'INSERT' | 'UPDATE' | 'DELETE';

// Interface para os dados do log
interface LogData {
    usuario_id: number;      // ID do usuário que executou a ação
    tabela: string;          // Nome da tabela afetada (ex: 'pacientes')
    registro_id: number;     // ID do registro afetado
    acao: AcaoAuditoria;     // Tipo da ação
    dados_antigos?: any;     // Dados antes da alteração (para UPDATE e DELETE)
    dados_novos?: any;       // Dados depois da alteração (para INSERT e UPDATE)
}

// Registra uma ação no log de auditoria, 
// @param data (dados do log a ser registrado)
 
export async function registrarLog(data: LogData) {
    let connection = null;
    
    try {
        connection = await getConnection();
        
        await connection.execute(
            `INSERT INTO logs_auditoria 
             (usuario_id, tabela, registro_id, acao, dados_antigos, dados_novos) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                data.usuario_id,
                data.tabela,
                data.registro_id,
                data.acao,
                data.dados_antigos ? JSON.stringify(data.dados_antigos) : null,
                data.dados_novos ? JSON.stringify(data.dados_novos) : null
            ]
        );
        
        console.log(`[Auditoria] Log registrado: ${data.acao} na tabela ${data.tabela} - ID: ${data.registro_id}`);
        
    } catch (error) {
        console.error('[Auditoria] Erro ao registrar log:', error);
    } finally {
        if (connection) await connection.end();
    }
}

// Busca os dados atuais de um registro para registrar no log
// @param tabela (Nome da tabela)
// @param id (ID do registro)
 
export async function buscarDadosRegistro(tabela: string, id: number) {
    let connection = null;
    
    try {
        connection = await getConnection();
        
        const [rows] = await connection.execute(
            `SELECT * FROM ${tabela} WHERE id = ?`,
            [id]
        );
        
        return (rows as any[])[0] || null;
        
    } catch (error) {
        console.error(`[Auditoria] Erro ao buscar dados da tabela ${tabela}:`, error);
        return null;
    } finally {
        if (connection) await connection.end();
    }
}