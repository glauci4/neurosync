// app/api/clinica/funcionamento/route.ts
import type { RowDataPacket } from "mysql2";
import { validarAcessoClinica } from "@/lib/auth/permissoesClinica";
import { getConnection } from "@/lib/mysql";

type ConexaoMySQL = Awaited<ReturnType<typeof getConnection>>;

// GET: retorna todos os horários da clínica do usuário logado
export async function GET() {
  let connection: ConexaoMySQL | undefined;
  try {
    connection = await getConnection();
    const acesso = await validarAcessoClinica(connection);
    if (!acesso.ok) {
      return Response.json({ error: acesso.error }, { status: acesso.status });
    }

    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT id, dia_semana, data_especifica, hora_inicio, hora_fim,
              intervalo_inicio, intervalo_fim, tipo, ativo
       FROM horarios_funcionamento
       WHERE clinica_id = ?
       ORDER BY dia_semana, data_especifica`,
      [acesso.usuario.clinica_id],
    );

    return Response.json(rows);
  } catch (error) {
    console.error("Erro ao buscar funcionamento:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// PUT: atualiza a configuração semanal (substitui os registros do tipo 'funcionamento')
export async function PUT(request: Request) {
  let connection: ConexaoMySQL | undefined;
  try {
    connection = await getConnection();
    const acesso = await validarAcessoClinica(connection, { admin: true });
    if (!acesso.ok) {
      return Response.json({ error: acesso.error }, { status: acesso.status });
    }

    const body = await request.json();
    const horarios = body.horarios;
    const aplicacoesPontuais = body.aplicacoes_pontuais;

    if (!Array.isArray(horarios) && !Array.isArray(aplicacoesPontuais)) {
      return Response.json({ error: "Formato inválido" }, { status: 400 });
    }

    if (Array.isArray(aplicacoesPontuais)) {
      const datas = Array.from(
        new Set(
          aplicacoesPontuais
            .map((item) => String(item.data_especifica || "").slice(0, 10))
            .filter(Boolean),
        ),
      ).sort();

      if (datas.length === 0) {
        return Response.json({ error: "Formato inválido" }, { status: 400 });
      }

      await connection.execute(
        `DELETE FROM horarios_funcionamento
         WHERE clinica_id = ? AND tipo = 'funcionamento' AND data_especifica IS NOT NULL
           AND data_especifica BETWEEN ? AND ?`,
        [acesso.usuario.clinica_id, datas[0], datas[datas.length - 1]],
      );

      for (const item of aplicacoesPontuais) {
        if (!item.data_especifica) continue;
        const dataLimpa = String(item.data_especifica).slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dataLimpa)) continue;
        const [ano, mes, dia] = dataLimpa.split("-").map(Number);
        const dataLocal = new Date(ano, mes - 1, dia);
        if (Number.isNaN(dataLocal.getTime())) continue;
        const diaSemana = dataLocal.getDay();
        await connection.execute(
          `INSERT INTO horarios_funcionamento
           (clinica_id, dia_semana, data_especifica, hora_inicio, hora_fim, intervalo_inicio, intervalo_fim, tipo, ativo)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'funcionamento', ?)`,
          [
            acesso.usuario.clinica_id,
            diaSemana,
            dataLimpa,
            item.hora_inicio,
            item.hora_fim,
            item.intervalo_inicio || null,
            item.intervalo_fim || null,
            item.ativo ? 1 : 0,
          ],
        );
      }

      return Response.json({
        success: true,
        message: "Funcionamento pontual atualizado",
      });
    }

    // Remove todos os registros semanais da clínica
    await connection.execute(
      `DELETE FROM horarios_funcionamento WHERE clinica_id = ? AND tipo = 'funcionamento'`,
      [acesso.usuario.clinica_id],
    );

    // Insere os novos valores
    for (const h of horarios) {
      if (h.dia_semana === undefined || h.dia_semana === null) continue;
      await connection.execute(
        `INSERT INTO horarios_funcionamento
         (clinica_id, dia_semana, hora_inicio, hora_fim, intervalo_inicio, intervalo_fim, tipo, ativo)
         VALUES (?, ?, ?, ?, ?, ?, 'funcionamento', ?)`,
        [
          acesso.usuario.clinica_id,
          h.dia_semana,
          h.hora_inicio,
          h.hora_fim,
          h.intervalo_inicio || null,
          h.intervalo_fim || null,
          h.ativo ? 1 : 0,
        ],
      );
    }

    return Response.json({
      success: true,
      message: "Funcionamento atualizado",
    });
  } catch (error) {
    console.error("Erro ao atualizar funcionamento:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
