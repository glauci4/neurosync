import { getConnection } from "@/lib/mysql";

type AcaoAuditoria = "INSERT" | "UPDATE" | "DELETE";

interface LogData {
  usuario_id: number;
  tabela: string;
  registro_id: number;
  acao: AcaoAuditoria;
  dados_antigos?: unknown;
  dados_novos?: unknown;
}

export async function registrarLog(data: LogData) {
  try {
    void data;
  } catch {
    // Auditoria externa removida do escopo do TCC.
  }
}

export async function buscarDadosRegistro(tabela: string, id: number) {
  let connection = null;

  try {
    connection = await getConnection();

    const [rows] = await connection.execute(
      `SELECT * FROM ${tabela} WHERE id = ?`,
      [id],
    );

    const linhas = rows as unknown[];
    return linhas[0] || null;
  } catch (error) {
    console.error(
      `[Auditoria] Erro ao buscar dados da tabela ${tabela}:`,
      error,
    );
    return null;
  } finally {
    if (connection) await connection.end();
  }
}
