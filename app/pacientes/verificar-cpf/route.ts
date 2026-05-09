// app/api/pacientes/verificar-cpf/route.ts
import { getConnection } from '@/lib/mysql';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
    let connection = null;
    try {
        const { searchParams } = new URL(request.url);
        const cpf = searchParams.get('cpf')?.replace(/\D/g, '');
        const clinica_id = searchParams.get('clinica_id');
        const paciente_id = searchParams.get('paciente_id'); // opcional: para edição, ignorar o próprio ID

        if (!cpf || !clinica_id) {
            return Response.json({ error: 'CPF e clínica são obrigatórios' }, { status: 400 });
        }
        if (cpf.length !== 11) {
            return Response.json({ exists: false }); // CPF incompleto, não verifica
        }

        connection = await getConnection();

        let sql = 'SELECT id FROM pacientes WHERE cpf = ? AND clinica_id = ? AND deleted_at IS NULL';
        const params: any[] = [cpf, clinica_id];

        if (paciente_id) {
            sql += ' AND id != ?';
            params.push(paciente_id);
        }

        const [rows] = await connection.execute<RowDataPacket[]>(sql, params);
        const exists = rows.length > 0;

        return Response.json({ exists });
    } catch (error) {
        console.error('Erro ao verificar CPF:', error);
        return Response.json({ error: 'Erro interno' }, { status: 500 });
    } finally {
        if (connection) await connection.end();
    }
}