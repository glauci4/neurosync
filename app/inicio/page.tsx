// app/inicio/page.tsx
// Página principal (Início), exibe as consultas agendadas para o dia atual 

'use client';

import { useAutenticacao } from '@/hooks/useAutenticacao';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  CalendarCheck2,    // Agendado (consulta marcada, paciente virá)
  CalendarClock,     // Remarcado (consulta foi reagendada)
  CalendarOff,       // Falta (não compareceu sem aviso)
  CalendarX2,        // Cancelado (avisou que não virá)
  Clock, 
  Tag,               // Substitui DoorOpen (representa identificador da sala)
  User,
  CheckCircle,       // Concluído (consulta realizada)
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import { useQuery } from '@tanstack/react-query';
import { useSidebar } from '@/app/context/SidebarContext'; // Importa o hook da sidebar

// Tipo que define a estrutura de uma consulta
interface ConsultaType {
  id: number;
  horario: string;
  paciente: string;
  sala: number;
  status: 'agendado' | 'remarcado' | 'cancelado' | 'falta' | 'concluido';
}

// Configuração completa dos status, cada status tem: cor de fundo, texto, ícone e descrição (para tooltip)
const statusConfig = {
  agendado: {
    cor: 'bg-blue-100 text-blue-700',
    texto: 'Agendado',
    icone: CalendarCheck2,
    descricao: 'Consulta marcada, paciente virá'
  },
  remarcado: {
    cor: 'bg-purple-100 text-purple-700',
    texto: 'Remarcado',
    icone: CalendarClock,
    descricao: 'Consulta reagendada para outra data'
  },
  cancelado: {
    cor: 'bg-orange-100 text-orange-700',
    texto: 'Cancelado',
    icone: CalendarX2,
    descricao: 'Paciente avisou que não virá'
  },
  falta: {
    cor: 'bg-red-100 text-red-700',
    texto: 'Falta',
    icone: CalendarOff,
    descricao: 'Não compareceu e não avisou'
  },
  concluido: {
    cor: 'bg-green-100 text-green-700',
    texto: 'Concluído',
    icone: CheckCircle,
    descricao: 'Consulta realizada com sucesso'
  }
};

// DADOS FICTÍCIOS PARA TESTE (comentado para não interferir quando a API estiver pronta)
/*
const consultasFicticias: ConsultaType[] = [
  { id: 1, horario: '08:00', paciente: 'Ana Souza', sala: 1, status: 'concluido' },
  { id: 2, horario: '09:30', paciente: 'Carlos Lima', sala: 2, status: 'agendado' },
  { id: 3, horario: '10:00', paciente: 'Fernanda Rios', sala: 1, status: 'remarcado' },
  { id: 4, horario: '11:30', paciente: 'João Pedro', sala: 3, status: 'falta' },
  { id: 5, horario: '14:00', paciente: 'Mariana Costa', sala: 2, status: 'cancelado' },
  { id: 6, horario: '15:30', paciente: 'Roberto Silva', sala: 1, status: 'agendado' },
  { id: 7, horario: '17:00', paciente: 'Patrícia Oliveira', sala: 3, status: 'agendado' },
];
*/

// Função para buscar consultas da API
// Quando a API estiver pronta, será substituída pela chamada real
async function buscarConsultas(): Promise<ConsultaType[]> {
  // TODO: Substituir pela chamada real à API
  // const response = await fetch('/api/consultas/hoje');
  // return response.json();
  
  // Retorna array vazio enquanto não há API
  return [];
  
  // Para testar com dados fictícios, só descomentar a linha abaixo:
  // return consultasFicticias;
}

export default function Inicio() {
  // Obtém os dados de autenticação do usuário
  const { usuario, carregando, estaAutenticado, fazerLogout } = useAutenticacao();
  
  // Obtém o estado da sidebar (recolhida ou expandida) do contexto global
  const { isCollapsed } = useSidebar();
  
  const router = useRouter();

  // TanStack Query (busca as consultas do dia)
  // Gerencia automaticamente: loading, error, cache e refetch
  const { 
    data: consultasRaw, 
    isLoading: carregandoConsultas,
    error: erroConsultas
  } = useQuery({
    queryKey: ['consultas', 'hoje'],
    queryFn: buscarConsultas,
  });

  const consultas = consultasRaw || [];

  // Redireciona para login se não estiver autenticado
  useEffect(() => {
    if (!carregando && !estaAutenticado) {
      router.push('/');
    }
  }, [carregando, estaAutenticado, router]);

  // Tela de carregamento da autenticação
  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#9F64AF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Carregando autenticação...</p>
        </div>
      </div>
    );
  }

  // Segurança: se não autenticado ou sem usuário, não renderiza
  if (!estaAutenticado || !usuario) {
    return null;
  }

  // Define o ID do perfil (1 = Secretária, 2 = Psicólogo)
  const perfilId = usuario.perfil_id || (usuario.perfil === 'psicologo' ? 2 : 1);

  // CALCULA A MARGEM DINÂMICA BASEADA NO ESTADO DA SIDEBAR
  // Se a sidebar estiver recolhida (isCollapsed = true), usa margem de 5rem (w-20)
  // Se a sidebar estiver expandida (isCollapsed = false), usa margem de 16rem (w-64)
  const contentMargin = isCollapsed ? 'ml-20' : 'ml-64';

  // Formatação da data atual para exibição
  // Exemplo: "segunda-feira, 20 de abril de 2026"
  const hoje = new Date();
  const dataFormatada = hoje.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'      
  });
  const dataCapitalizada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0]">
      
      {/* Componente da Sidebar - recebe perfil, função de logout e dados do usuário */}
      <Sidebar 
        perfilId={perfilId} 
        onLogout={fazerLogout}
        usuario={usuario}
      />

      {/* CONTEÚDO PRINCIPAL - A MARGEM ESQUERDA SE AJUSTA DINAMICAMENTE */}
      {/* Quando a sidebar recolhe, o conteúdo se move para a esquerda */}
      {/* Quando a sidebar expande, o conteúdo volta para a direita */}
      <div className={contentMargin}>
        
        {/* Cabeçalho da página */}
        <div className="pt-8 px-8 pb-2">
          <h1 className="text-2xl font-bold text-gray-800">Início</h1>
          <p className="text-gray-500 text-sm mt-1">Visão geral do sistema</p>
        </div>

        {/* Área principal de conteúdo */}
        <main className="px-8 pb-8">
          <div className="max-w-4xl mx-auto">
            
            {/* Card de Consultas de Hoje */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-[#E1D4F0] overflow-hidden"
            >
              {/* Cabeçalho do card */}
              <div className="flex items-center justify-between p-6 border-b border-[#E1D4F0]">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Consultas de Hoje</h2>
                  <p className="text-sm text-gray-400 mt-1">{dataCapitalizada}</p>
                </div>
                
                {/* Botão "Ver Agenda", redireciona para a página de agenda */}
                <button 
                  onClick={() => router.push('/agenda')}
                  className="bg-[#9F64AF] hover:bg-[#8B509B] text-white text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Ver Agenda
                </button>
              </div>

              {/* Estado: Carregando consultas */}
              {carregandoConsultas && (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="w-10 h-10 border-4 border-[#9F64AF] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-400 text-sm">Carregando consultas...</p>
                  </div>
                </div>
              )}

              {/* Estado: Nenhuma consulta agendada */}
              {!carregandoConsultas && consultas.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-[#F3EAF8] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar size={28} className="text-[#9F64AF]" />
                  </div>
                  <p className="text-gray-400 text-sm">Nenhuma consulta agendada para hoje</p>
                </div>
              )}

              {/* Estado: Lista de consultas */}
              {!carregandoConsultas && consultas.length > 0 && (
                <div className="divide-y divide-[#E1D4F0]">
                  {consultas.map((consulta) => {
                    // Obtém a configuração do status atual
                    const config = statusConfig[consulta.status];
                    const IconeStatus = config.icone;
                    
                    return (
                      <div 
                        key={consulta.id} 
                        className="flex items-center justify-between p-5 hover:bg-[#F3EAF8] transition-colors"
                      >
                        {/* Horário da consulta */}
                        <div className="w-20">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock size={14} />
                            <span className="text-sm font-medium">{consulta.horario}</span>
                          </div>
                        </div>

                        {/* Nome do paciente */}
                        <div className="flex-1 ml-4">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-800">{consulta.paciente}</span>
                          </div>
                        </div>

                        {/* Sala da consulta */}
                        <div className="w-24">
                          <div className="flex items-center gap-1 text-gray-500">
                            <Tag size={12} />
                            <span className="text-xs">Sala {consulta.sala}</span>
                          </div>
                        </div>

                        {/* Status com ícone, cor e tooltip */}
                        <div className="w-28 text-right">
                          <span 
                            className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${config.cor}`}
                            title={config.descricao}
                          >
                            <IconeStatus size={12} />
                            {config.texto}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Estado: Erro ao carregar consultas */}
              {erroConsultas && (
                <div className="text-center py-12">
                  <p className="text-red-500 text-sm">Erro ao carregar consultas. Tente novamente.</p>
                </div>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}