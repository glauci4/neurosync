// app/hooks/useConsultaCnpj.ts
// Hook personalizado para consultar CNPJ usando TanStack Query, centraliza a lógica de busca e cache de dados do CNPJ

import { useQuery } from '@tanstack/react-query';

// Interface que define a estrutura dos dados retornados pela API
interface DadosCnpj {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  situacao: string;
  data_abertura: string;
}

// Função que busca os dados do CNPJ na API, essa função é separada para ser reutilizada pelo hook
async function buscarCnpj(cnpj: string): Promise<DadosCnpj> {
  // Remove caracteres não numéricos
  const cnpjNumeros = cnpj.replace(/\D/g, '');
  
  if (cnpjNumeros.length !== 14) {
    throw new Error('CNPJ deve ter 14 dígitos');
  }
  
  const response = await fetch(`/api/consulta-cnpj?cnpj=${cnpjNumeros}`);
  
  if (!response.ok) {
    const erro = await response.json();
    throw new Error(erro.error || 'Erro ao consultar CNPJ');
  }
  
  return response.json();
}

// Hook principal que será usado nos componentes
export function useConsultaCnpj(cnpj: string) {
  // useQuery gerencia automaticamente:
  // - data: os dados retornados
  // - isLoading: se está carregando
  // - error: se ocorreu erro
  // - refetch: função para buscar novamente
  return useQuery({
    // queryKey é o identificador único para esta query
    // O TanStack Query usa isso para fazer cache
    // Quando o CNPJ muda, uma nova query é criada
    queryKey: ['cnpj', cnpj],
    
    // queryFn é a função que busca os dados
    queryFn: () => buscarCnpj(cnpj),
    
    // enabled controla quando a query é executada, só executa se o CNPJ tiver 14 dígitos
    enabled: cnpj.length === 18 || cnpj.replace(/\D/g, '').length === 14,
    
    // staleTime: dados ficam frescos por 5 minutos, se o mesmo CNPJ for consultado novamente, usa o cache
    staleTime: 5 * 60 * 1000,
  });
}