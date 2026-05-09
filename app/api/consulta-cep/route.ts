// api/consulta-cep/route.ts

// Esta API é responsável por consultar dados de um endereço a partir do seu CEP usando a ViaCEP. Ela recebe um CEP, faz a consulta e retorna os dados do endereço.

import { NextResponse } from 'next/server'; // Importa a função NextResponse para criar respostas HTTP

// Função para validar o formato do CEP antes de fazer a consulta
function validarFormatoCEP(cep: string): boolean {
    // Remove espaços e traços do CEP para validar apenas os números
     const cepLimpo = cep.replace(/\s/g, '').replace('-', '');
    // Verifica se o CEP tem exatamente 8 dígitos
    return /^\d{8}$/.test(cepLimpo);
}

// Função para limpar o CEP (apenas números) antes de enviar para a API
function limparCEP(cep: string): string {
    return cep.replace(/\s/g, '').replace('-', '');
}

// Método GET para consultar os dados do endereço a partir do CEP
export async function GET(request: Request) {
    try {
        // Obtém o CEP a partir dos parâmetros da URL
        const { searchParams } = new URL(request.url);
        let cep = searchParams.get('cep');
        // Verifica se o CEP foi fornecido
        if (!cep) {
            return NextResponse.json(
                { error: 'CEP é obrigatório.' },
                { status: 400 }
            );
        }
        // Valida o formato do CEP
        if (!validarFormatoCEP(cep)) {
            return NextResponse.json(
                { error: 'CEP inválido. O CEP deve conter 8 dígitos.' },
                { status: 400 }
            );
        }
        // Limpa o CEP para enviar apenas os números para a API
        const cepLimpo = limparCEP(cep);    

 // Consulta ViaCEP usando o CEP limpo 
 // Documentacao: https://viacep.com.br/
 const urlViaCEP = `https://viacep.com.br/ws/${cepLimpo}/json/`;
    const resposta = await fetch(urlViaCEP);
 // Verifica se a resposta da API foi bem sucedida
    if (!resposta.ok) {
        return NextResponse.json(
            { error: 'Erro ao consultar o CEP.' },
            { status: 500 }
        );
    }

    const dadosEndereco = await resposta.json();

// Verifica se o CEP foi encontrado (ViaCEP retorna um campo "erro" se o CEP não for encontrado)
    if (dadosEndereco.erro) {
        return NextResponse.json(
            { error: 'CEP não encontrado.' },
            { status: 404 }
        );
    }

// Mapeia os campos retornados pela ViaCEP 
const dadosFormatados = {
    cep: dadosEndereco.cep,
    logradouro: dadosEndereco.logradouro || '',
    bairro: dadosEndereco.bairro || '',
    cidade: dadosEndereco.localidade || '',
    estado: dadosEndereco.uf || ''
};

    // Retorna os dados do endereço em formato JSON
    return NextResponse.json(dadosFormatados);
} catch (error) {
    console.error('Erro ao consultar o CEP:', error);
    return NextResponse.json(
        { error: 'Erro interno do servidor.' },
        { status: 500 }
    );
        }
}

