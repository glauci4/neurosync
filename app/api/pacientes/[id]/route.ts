// app/api/pacientes/[id]/route.ts
// API para gerenciar um paciente específico (GET, PUT, DELETE)

import { getConnection } from '@/lib/mysql';
import { registrarLog, buscarDadosRegistro } from '@/lib/auditoria';
import { RowDataPacket } from 'mysql2';

// INTERFACE PARA ATUALIZAÇÃO
interface PacienteUpdateData {
    nome?: string;
    data_nascimento?: string;
    genero?: string;
    raca_etnia?: string;
    cpf?: string;
    telefone?: string;
    telefone_alternativo?: string;
    email?: string;
    tipo?: 'adulto' | 'menor';
    possui_deficiencia?: boolean;
    descricao_deficiencia?: string;
    renda_familiar?: number;
    possui_cadastro_unico?: boolean;
    cep?: string;
    rua?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    observacoes?: string;
    ativo?: boolean;
    sem_numero?: boolean;
    status_atendimento?: 'fila_espera' | 'em_atendimento' | 'encerrado';
    contato_emergencia?: {
        nome?: string;
        telefone?: string;
        parentesco?: string;
    };
}

// FUNÇÃO AUXILIAR: VALIDAÇÃO DE CPF
function validarCPF(cpf: string): boolean {
    const numeros = cpf.replace(/\D/g, '');
    if (numeros.length !== 11) return false;
    if (/^(\d)\1+$/.test(numeros)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(numeros.charAt(i)) * (10 - i);
    let resto = 11 - (soma % 11);
    let digito1 = resto >= 10 ? 0 : resto;
    if (digito1 !== parseInt(numeros.charAt(9))) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(numeros.charAt(i)) * (11 - i);
    resto = 11 - (soma % 11);
    let digito2 = resto >= 10 ? 0 : resto;
    return digito2 === parseInt(numeros.charAt(10));
}

// GET 
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    let connection = null;
    try {
        const { id } = await context.params;
        const pacienteId = parseInt(id);
        const url = new URL(request.url);
        const usuarioId = parseInt(url.searchParams.get('usuario_id') || '0');

        if (!usuarioId) {
            return Response.json({ error: 'Usuário não autenticado' }, { status: 401 });
        }
        if (isNaN(pacienteId)) {
            return Response.json({ error: 'ID do paciente inválido' }, { status: 400 });
        }

        connection = await getConnection();

        // Obtém a clínica do usuário
        const [usuarios] = await connection.execute<RowDataPacket[]>(
            'SELECT clinica_id FROM usuarios WHERE id = ?',
            [usuarioId]
        );
        if (usuarios.length === 0) {
            return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }
        const clinicaId = usuarios[0].clinica_id;

        // Busca os dados do paciente, incluindo contato de emergência (LEFT JOIN) e a subconsulta podeExcluir (sem consultas E status = fila_espera)
        const [pacientes] = await connection.execute<RowDataPacket[]>(
            `SELECT p.*,
                TIMESTAMPDIFF(YEAR, p.data_nascimento, CURDATE()) AS idade,
                DATE_FORMAT(p.data_nascimento, '%d/%m/%Y') AS data_nascimento_formatada,
                (SELECT COUNT(*) FROM consultas WHERE paciente_id = p.id) = 0 
                AND p.status_atendimento = 'fila_espera' AS podeExcluir,
                c.id AS contato_id,
                c.nome AS contato_nome,
                c.telefone AS contato_telefone,
                c.parentesco AS contato_parentesco
             FROM pacientes p
             LEFT JOIN contatos_emergencia c ON p.id = c.paciente_id
             WHERE p.id = ? AND p.clinica_id = ? AND p.deleted_at IS NULL`,
            [pacienteId, clinicaId]
        );

        if (pacientes.length === 0) {
            return Response.json({ error: 'Paciente não encontrado' }, { status: 404 });
        }

        // Formata o contato de emergência como objeto (se existir) e remove campos auxiliares
        const pacienteData = pacientes[0];
        if (pacienteData.contato_id) {
            pacienteData.contato_emergencia = {
                nome: pacienteData.contato_nome,
                telefone: pacienteData.contato_telefone,
                parentesco: pacienteData.contato_parentesco,
            };
        } else {
            pacienteData.contato_emergencia = null;
        }
        delete pacienteData.contato_id;
        delete pacienteData.contato_nome;
        delete pacienteData.contato_telefone;
        delete pacienteData.contato_parentesco;

        return Response.json({ success: true, data: pacienteData });
    } catch (error) {
        console.error('GET erro:', error);
        return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
    } finally {
        if (connection) await connection.end();
    }
}

// PUT 
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    let connection = null;
    try {
        const { id } = await context.params;
        const pacienteId = parseInt(id);
        const body = await request.json();
        let { usuario_id, ...dados } = body as { usuario_id: number } & PacienteUpdateData;

        if (!usuario_id) {
            return Response.json({ error: 'Usuário não autenticado' }, { status: 401 });
        }
        if (isNaN(pacienteId)) {
            return Response.json({ error: 'ID do paciente inválido' }, { status: 400 });
        }

        connection = await getConnection();

        // Verifica a clínica do usuário
        const [usuarios] = await connection.execute<RowDataPacket[]>(
            'SELECT clinica_id FROM usuarios WHERE id = ?',
            [usuario_id]
        );
        if (usuarios.length === 0) {
            return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }
        const clinicaId = usuarios[0].clinica_id;

        // Verifica se o paciente existe e pertence à clínica (não excluído)
        const [existe] = await connection.execute<RowDataPacket[]>(
            'SELECT id FROM pacientes WHERE id = ? AND clinica_id = ? AND deleted_at IS NULL',
            [pacienteId, clinicaId]
        );
        if (existe.length === 0) {
            return Response.json({ error: 'Paciente não encontrado' }, { status: 404 });
        }

        // Busca os dados atuais (ativo e status_atendimento)
        const [pacienteAtual] = await connection.execute<RowDataPacket[]>(
            'SELECT ativo, status_atendimento FROM pacientes WHERE id = ?',
            [pacienteId]
        );
        const atual = pacienteAtual[0];

        // REGRAS DE NEGÓCIO – STATUS DE ATENDIMENTO E ATIVAÇÃO
        // Bloquear alteração de status se o paciente estiver inativo
        if (dados.status_atendimento !== undefined && atual.ativo === 0) {
            return Response.json({
                error: 'Paciente inativo não pode ter status de atendimento alterado'
            }, { status: 400 });
        }
        // Ao inativar (ativo = false), força status = 'encerrado'
        if (dados.ativo === false && atual.ativo === 1) {
            dados.status_atendimento = 'encerrado';
        }
        // Ao reativar (ativo = true), força status = 'fila_espera'
        if (dados.ativo === true && atual.ativo === 0) {
            dados.status_atendimento = 'fila_espera';
        }

        // Valida CPF, se fornecido
        if (dados.cpf && !validarCPF(dados.cpf)) {
            return Response.json({ error: 'CPF inválido' }, { status: 400 });
        }
        if (dados.cpf) {
            const cpfNumeros = String(dados.cpf).replace(/\D/g, '');
            const [duplicados] = await connection.execute<RowDataPacket[]>(
                `SELECT id FROM pacientes
                 WHERE cpf = ? AND clinica_id = ? AND id != ? AND deleted_at IS NULL`,
                [cpfNumeros, clinicaId, pacienteId]
            );
            if (duplicados.length > 0) {
                return Response.json({ error: 'CPF já cadastrado para outro paciente' }, { status: 400 });
            }
        }

        // SEPARAÇÃO DE CAMPOS: PACIENTE vs CONTATO DE EMERGÊNCIA
        const colunasPaciente = [
            'nome', 'data_nascimento', 'genero', 'raca_etnia', 'cpf',
            'telefone', 'telefone_alternativo', 'email', 'tipo',
            'possui_deficiencia', 'descricao_deficiencia', 'renda_familiar',
            'possui_cadastro_unico', 'cep', 'rua', 'numero', 'complemento',
            'bairro', 'cidade', 'estado', 'observacoes', 'ativo', 'sem_numero',
            'status_atendimento' // incluído pois é coluna da tabela pacientes
        ];

        const campos: string[] = [];
        const valores: any[] = [];

        // Separar contato de emergência para processamento individual
        let contatoEmergencia = null;

        for (const [key, value] of Object.entries(dados)) {
            if (value === undefined) continue;

            // Se for o contato de emergência, guardamos em separado
            if (key === 'contato_emergencia') {
                contatoEmergencia = value;
                continue;
            }

            // Ignora campos que não são colunas reais da tabela pacientes
            if (!colunasPaciente.includes(key)) continue;

            // Converte o valor para o tipo correto antes de persistir
            let valorFinal: any = value;
            if (key === 'cpf') {
                valorFinal = value ? String(value).replace(/\D/g, '') : null;
            } else if (key === 'cep') {
                valorFinal = value ? String(value).replace(/\D/g, '') : null;
            } else if (key === 'ativo') {
                valorFinal = value ? 1 : 0;
            } else if (['possui_deficiencia', 'possui_cadastro_unico', 'sem_numero'].includes(key)) {
                valorFinal = value ? 1 : 0;
            } else if (key === 'status_atendimento') {
                valorFinal = value; // string, já validada pelas regras de negócio
            } else {
                valorFinal = value === null ? null : String(value);
            }

            campos.push(`${key} = ?`);
            valores.push(valorFinal);
        }

        // Só executa UPDATE se houver campos a modificar na tabela pacientes
        if (campos.length > 0) {
            campos.push('atualizado_em = NOW()');
            valores.push(pacienteId);
            await connection.execute(`UPDATE pacientes SET ${campos.join(', ')} WHERE id = ?`, valores);
        }

        // CONTATO DE EMERGÊNCIA (tabela contatos_emergencia)
    
        // Verificação robusta: o valor deve ser um objeto plano, não array e não nulo
        if (contatoEmergencia && typeof contatoEmergencia === 'object' && !Array.isArray(contatoEmergencia)) {
            // Remove todos os contatos de emergência anteriores do paciente
            // (assume-se que cada paciente tenha no máximo um contato de emergência principal)
            await connection.execute('DELETE FROM contatos_emergencia WHERE paciente_id = ?', [pacienteId]);

            // Extrai as propriedades com type safety (uso de 'as any' para acesso dinâmico)
            const nome = (contatoEmergencia as any).nome;
            const telefone = (contatoEmergencia as any).telefone;
            const parentesco = (contatoEmergencia as any).parentesco;

            // Insere um novo registro apenas se nome e telefone estiverem preenchidos
            if (nome && telefone) {
                await connection.execute(
                    `INSERT INTO contatos_emergencia (paciente_id, nome, telefone, parentesco) 
                     VALUES (?, ?, ?, ?)`,
                    [pacienteId, nome, telefone, parentesco || null]
                );
            }
        }

        // Log de auditoria (usando snapshot após alterações)
        const dadosAntigos = await buscarDadosRegistro('pacientes', pacienteId);
        const dadosNovos = await buscarDadosRegistro('pacientes', pacienteId);
        await registrarLog({
            usuario_id,
            tabela: 'pacientes',
            registro_id: pacienteId,
            acao: 'UPDATE',
            dados_antigos: dadosAntigos,
            dados_novos: dadosNovos
        });

        return Response.json({ success: true, message: 'Paciente atualizado com sucesso' });
    } catch (error) {
        console.error('PUT erro:', error);
        return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
    } finally {
        if (connection) await connection.end();
    }
}

// DELETE 
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    let connection = null;
    try {
        const { id } = await context.params;
        const pacienteId = parseInt(id);
        const url = new URL(request.url);
        const usuarioId = parseInt(url.searchParams.get('usuario_id') || '0');

        if (!usuarioId) {
            return Response.json({ error: 'Usuário não autenticado' }, { status: 401 });
        }
        if (isNaN(pacienteId)) {
            return Response.json({ error: 'ID do paciente inválido' }, { status: 400 });
        }

        connection = await getConnection();

        const [usuarios] = await connection.execute<RowDataPacket[]>(
            'SELECT clinica_id FROM usuarios WHERE id = ?',
            [usuarioId]
        );
        if (usuarios.length === 0) {
            return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }
        const clinicaId = usuarios[0].clinica_id;

        // Verifica se o paciente existe e pertence à clínica (não excluído)
        const [pacientes] = await connection.execute<RowDataPacket[]>(
            'SELECT id FROM pacientes WHERE id = ? AND clinica_id = ? AND deleted_at IS NULL',
            [pacienteId, clinicaId]
        );
        if (pacientes.length === 0) {
            return Response.json({ error: 'Paciente não encontrado ou já excluído' }, { status: 404 });
        }

        // Verifica se existem consultas associadas
        const [consultas] = await connection.execute<RowDataPacket[]>(
            'SELECT id FROM consultas WHERE paciente_id = ? LIMIT 1',
            [pacienteId]
        );
        const temConsultas = consultas.length > 0;

        let tipoOperacao: 'excluido' | 'inativado';
        let mensagem: string;

        if (temConsultas) {
            // Paciente com consultas: apenas inativa (ativo = 0)
            await connection.execute(
                'UPDATE pacientes SET ativo = 0, atualizado_em = NOW() WHERE id = ?',
                [pacienteId]
            );
            tipoOperacao = 'inativado';
            mensagem = 'Paciente inativado com sucesso (possui consultas no histórico)';
        } else {
            // Paciente sem consultas: exclusão lógica (deleted_at = NOW())
            await connection.execute(
                'UPDATE pacientes SET deleted_at = NOW(), ativo = 0, atualizado_em = NOW() WHERE id = ?',
                [pacienteId]
            );
            tipoOperacao = 'excluido';
            mensagem = 'Paciente excluído com sucesso';
        }

        // Log de auditoria
        const dadosAntigos = await buscarDadosRegistro('pacientes', pacienteId);
        await registrarLog({
            usuario_id: usuarioId,
            tabela: 'pacientes',
            registro_id: pacienteId,
            acao: temConsultas ? 'UPDATE' : 'DELETE',
            dados_antigos: dadosAntigos,
            dados_novos: temConsultas ? { ativo: 0 } : { deleted_at: new Date().toISOString(), ativo: 0 }
        });

        return Response.json({
            success: true,
            message: mensagem,
            tipo_operacao: tipoOperacao
        });
    } catch (error) {
        console.error('DELETE erro:', error);
        return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
    } finally {
        if (connection) await connection.end();
    }
}