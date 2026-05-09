// hooks/useListarPacientes.ts
// Hook para listar pacientes usando TanStack Query.
// Suporta filtros por visibilidade (ativo/inativo/todos), status de atendimento, busca textual, paginação e ordenação.
// Gerencia cache, loading e erro automaticamente.

import { useQuery } from '@tanstack/react-query';
import { useAutenticacao } from './useAutenticacao';

// PARÂMETROS PARA A LISTAGEM DE PACIENTES

interface ListarPacientesParams {
    visibilidade?: 'ativo' | 'inativo' | 'todos';          // Filtro por ativo/inativo (padrão: 'ativo')
    status_atendimento?: 'fila_espera' | 'em_atendimento' | 'encerrado'; // Filtro por status de atendimento
    busca?: string;                                         // Busca textual (nome, CPF, telefone)
    page?: number;                                          // Número da página (começa em 1)
    limit?: number;                                         // Itens por página (padrão: 10)
    orderBy?: string;                                       // Campo para ordenação (opcional)
    orderDirection?: 'ASC' | 'DESC';                        // Direção da ordenação (padrão: 'ASC')
}

// ESTRUTURA DE UM PACIENTE RETORNADO PELA API

interface Paciente {
    id: number;
    nome: string;
    data_nascimento: string;
    data_nascimento_formatada: string;
    idade: number;
    genero: string;
    cpf: string | null;
    telefone: string;
    email: string | null;
    tipo: 'adulto' | 'menor';
    ativo: boolean;
    status_atendimento: 'fila_espera' | 'em_atendimento' | 'encerrado'; 
    criado_em: string;
    observacoes: string | null;
    podeExcluir?: boolean;
}

// ESTRUTURA DA RESPOSTA DA API COM PAGINAÇÃO

interface ListarPacientesResponse {
    success: boolean;
    data: Paciente[];
    paginacao: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        itemsPorPagina: number;
    };
}

// FUNÇÃO QUE FAZ A REQUISIÇÃO PARA BUSCAR PACIENTES

async function buscarPacientes(
    params: ListarPacientesParams,
    usuarioId: number
): Promise<ListarPacientesResponse> {
    const urlParams = new URLSearchParams();
    urlParams.set('usuario_id', usuarioId.toString());

    // Filtro por visibilidade (todos, ativo, inativo)
    if (params.visibilidade && params.visibilidade !== 'todos') {
        urlParams.set('visibilidade', params.visibilidade);
    } else if (params.visibilidade === 'todos') {
        urlParams.set('visibilidade', 'todos');
    }

    // Filtro por status de atendimento (opcional)
    if (params.status_atendimento) {
        urlParams.set('status_atendimento', params.status_atendimento);
    }

    // Busca textual
    if (params.busca) {
        urlParams.set('busca', params.busca);
    }

    // Paginação
    if (params.page) {
        urlParams.set('page', params.page.toString());
    }
    if (params.limit) {
        urlParams.set('limit', params.limit.toString());
    }

    // Ordenação (opcional, ainda suportada pela API)
    if (params.orderBy) {
        urlParams.set('orderBy', params.orderBy);
    }
    if (params.orderDirection) {
        urlParams.set('orderDirection', params.orderDirection);
    }

    const response = await fetch(`/api/pacientes?${urlParams.toString()}`);
    const resultado = await response.json();

    if (!response.ok) {
        throw new Error(resultado.error || 'Erro ao buscar pacientes');
    }

    return resultado;
}

// HOOK PARA LISTAR PACIENTES
// @param params - Parâmetros de filtro e paginação (visibilidade, status_atendimento, busca, page, limit, orderBy, orderDirection)
export function useListarPacientes(params: ListarPacientesParams = {}) {
    const { usuario } = useAutenticacao();

    return useQuery({
        // queryKey inclui todos os parâmetros para cache adequado
        queryKey: ['pacientes', params],

        queryFn: () => {
            if (!usuario?.id) {
                throw new Error('Usuário não autenticado');
            }
            return buscarPacientes(params, usuario.id);
        },

        // Só executa a query se o usuário estiver autenticado
        enabled: !!usuario?.id,

        // Manter dados em cache por 5 minutos
        staleTime: 5 * 60 * 1000,

        // Manter dados no cache por 10 minutos
        gcTime: 10 * 60 * 1000,

        // Refetch quando a janela ganhar foco (opcional, útil para dados atualizados)
        refetchOnWindowFocus: false,
    });
}