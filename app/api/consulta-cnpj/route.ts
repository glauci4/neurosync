// app/api/consulta-cnpj/route.ts
// API para consultar dados de CNPJ usando múltiplas fontes (BrasilAPI e ReceitaWS), essa abordagem aumenta a confiabilidade, pois se uma fonte falhar, a outra pode responder.

import { NextResponse } from 'next/server'; // Usado para criar respostas HTTP no Next.js

// Função para validar o formato do CNPJ antes da consulta
function validarFormatoCNPJ(cnpj: string): boolean {
    // Remove caracteres não numéricos
    const cnpjNumeros = cnpj.replace(/[^\d]+/g, '');
    // Verifica se o CNPJ tem exatamente 14 dígitos
    return cnpjNumeros.length === 14;
}

// Função para limpar o CNPJ, deixando apenas os números
function limparCNPJ(cnpj: string): string {
    return cnpj.replace(/[^\d]+/g, '');
}

// Função para consultar CNPJ na BrasilAPI
async function consultarBrasilAPI(cnpjLimpo: string) {
    const url = `https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`;
    const resposta = await fetch(url);

    // Se a resposta não for bem sucedida, lança erro
    if (!resposta.ok) {
        throw new Error(`BrasilAPI falhou com status ${resposta.status}`);
    }

    const dados = await resposta.json();

    // Retorna apenas os campos relevantes, padronizados
    return {
        razao_social: dados.razao_social || '',
        nome_fantasia: dados.nome_fantasia || '',
        logradouro: (dados.descricao_tipo_de_logradouro || '') + ' ' + (dados.logradouro || ''),
        numero: dados.numero || '',
        bairro: dados.bairro || '',
        cidade: dados.municipio || '',
        estado: dados.uf || '',
        cep: dados.cep || '',
        telefone: dados.ddd_telefone_1 || '',
        email: dados.email || ''
    };
}

// Função para consultar CNPJ na ReceitaWS (API alternativa)
async function consultarReceitaWS(cnpjLimpo: string) {
    const url = `https://receitaws.com.br/v1/cnpj/${cnpjLimpo}`;
    const resposta = await fetch(url);

    if (!resposta.ok) {
        throw new Error(`ReceitaWS falhou com status ${resposta.status}`);
    }

    const dados = await resposta.json();

    // Se a API retornar erro explícito
    if (dados.status === 'ERROR') {
        throw new Error(dados.message);
    }

    // Monta o logradouro juntando tipo e nome
    let logradouro = '';
    if (dados.tipo_logradouro) {
        logradouro = dados.tipo_logradouro + ' ';
    }
    if (dados.logradouro) {
        logradouro += dados.logradouro;
    }

    return {
        razao_social: dados.nome || '',
        nome_fantasia: dados.fantasia || '',
        logradouro: logradouro,
        numero: dados.numero || '',
        bairro: dados.bairro || '',
        cidade: dados.municipio || '',
        estado: dados.uf || '',
        cep: dados.cep || '',
        telefone: dados.telefone || '',
        email: dados.email || ''
    };
}

// Método GET para consultar dados de empresa a partir do CNPJ
export async function GET(request: Request) {
    try {
        // Obtém o CNPJ dos parâmetros da URL
        const { searchParams } = new URL(request.url);
        let cnpj = searchParams.get('cnpj');

        // Verifica se o CNPJ foi informado
        if (!cnpj) {
            return NextResponse.json(
                { error: 'CNPJ não informado.' },
                { status: 400 }
            );
        }

        // Valida o formato do CNPJ
        if (!validarFormatoCNPJ(cnpj)) {
            return NextResponse.json(
                { error: 'Formato de CNPJ inválido. Use 00.000.000/0000-00' },
                { status: 400 }
            );
        }

        // Limpa o CNPJ para enviar apenas os números
        const cnpjLimpo = limparCNPJ(cnpj);

        let dadosEmpresa = null;
        let fonteUsada = '';
        let erroDetalhado = '';

        // Tenta consultar primeiro na BrasilAPI
        try {
            dadosEmpresa = await consultarBrasilAPI(cnpjLimpo);
            fonteUsada = 'BrasilAPI';
            console.log(`Consulta realizada com sucesso na ${fonteUsada}`);
        } catch (erroBrasilAPI) {
            console.log('BrasilAPI falhou, tentando ReceitaWS...');
            erroDetalhado = `BrasilAPI: ${(erroBrasilAPI as Error).message}`;

            // Se BrasilAPI falhar, tenta ReceitaWS
            try {
                dadosEmpresa = await consultarReceitaWS(cnpjLimpo);
                fonteUsada = 'ReceitaWS';
                console.log(`Consulta realizada com sucesso na ${fonteUsada}`);
            } catch (erroReceitaWS) {
                console.log('ReceitaWS também falhou');
                erroDetalhado += ` | ReceitaWS: ${(erroReceitaWS as Error).message}`;

                return NextResponse.json(
                    {
                        error: 'Não foi possível consultar o CNPJ.',
                        detalhes: erroDetalhado,
                        sugestao: 'Verifique se o CNPJ está correto ou tente novamente mais tarde.'
                    },
                    { status: 503 }
                );
            }
        }

        // Caso não haja dados relevantes
        if (!dadosEmpresa.razao_social && !dadosEmpresa.nome_fantasia) {
            return NextResponse.json(
                {
                    error: 'CNPJ encontrado mas sem dados cadastrais.',
                    sugestao: 'O CNPJ pode ser novo ou estar pendente de regularização.'
                },
                { status: 404 }
            );
        }

        // Adiciona informações extras sobre a consulta
        const dadosFormatados = {
            ...dadosEmpresa,
            fonte_consulta: fonteUsada,
            cnpj_consultado: cnpjLimpo
        };

        // Retorna os dados formatados
        return NextResponse.json(dadosFormatados);

    } catch (error) {
        console.error('Erro na consulta de CNPJ:', error);
        return NextResponse.json(
            {
                error: 'Erro interno do servidor.',
                detalhes: (error as Error).message
            },
            { status: 500 }
        );
    }
}