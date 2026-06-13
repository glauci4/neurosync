// app/page.tsx
// Página principal do NeuroSync (Login e Cadastro), verifica se o usuário já está logado antes de mostrar o formulário

'use client'; // Necessário para usar useState, useEffect e interatividade

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAutenticacao } from '@/hooks/useAutenticacao';
import FormularioLogin from './components/FormularioLogin';
import FormularioCadastro from './components/FormularioCadastro';

export default function Home() {
  // Estado para controlar qual aba está ativa (login ou cadastro)
  const [abaAtiva, setAbaAtiva] = useState<'login' | 'cadastro'>('login');
  
  // Dados de autenticação do contexto
  const { usuario, carregando, estaAutenticado } = useAutenticacao();
  const router = useRouter();

  // Verifica se o usuário já está logado ao carregar a página
  useEffect(() => {
    console.log("Página inicial - carregando:", carregando);
    console.log("Página inicial - estaAutenticado:", estaAutenticado);
    console.log("Página inicial - usuario:", usuario);

    // Se não estiver mais carregando e o usuário estiver autenticado (ou seja, já logado), redireciona para a página de início
    if (!carregando && estaAutenticado) {
      console.timeStamp("login-page:redirect-inicio");
      console.log("Usuário já está logado, redirecionando para dashboard");
      router.push("/inicio");
    }
  }, [carregando, estaAutenticado, router, usuario]);

  // Enquanto verifica autenticação, mostra tela de carregamento
  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#9F64AF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se já está autenticado, não renderiza o formulário (aguarda o redirecionamento)
  if (estaAutenticado) {
    return null;
  }

  // Se não está autenticado, mostra a tela de login/cadastro
  return (
    // Container principal com gradiente lilás de fundo
    <div className="min-h-screen bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0] flex flex-col items-center justify-center p-3">
      
      {/* Container para logo, título e subtítulo */}
      <div className="text-center mb-4">
        
        {/* Logo com bordas arredondadas */}
        {/* rounded-2xl dá bordas arredondadas, shadow-lg adiciona sombra */}
        <div className="flex justify-center mb-2">
          <div className="w-20 h-20 relative">
            <Image
              src="/logo.png"
              alt="NeuroSync Logo"
              width={80}
              height={80}
              className="object-contain rounded-2xl shadow-lg"
            />
          </div>
        </div>
        
        {/* Título com fonte Pacifico importada do Google Fonts */}
        <h1 
          className="text-4xl font-bold text-[#9F64AF] mb-1"
          style={{ fontFamily: 'Pacifico, cursive' }}
        >
          NeuroSync
        </h1>
        
        {/* Subtítulo com tom mais suave */}
        {/* mt-3 adiciona espaçamento acima */}
        <p className="text-[#7B4FA3] text-sm font-medium mt-3">
          Plataforma de agendamento integrada para psicólogos
        </p>
      </div>

      {/* Card branco com efeito de vidro fosco */}
      <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-5">
        
        {/* Bem-vindo dentro do card */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Seja bem-vindo!</h2>
          <p className="text-gray-500 text-xs">
            Entre ou crie sua conta para começar
          </p>
        </div>

        {/* Abas de navegação */}
        <div className="flex gap-3 mb-5">
          <button
            onClick={() => setAbaAtiva('login')}
            className={`flex-1 py-2 rounded-lg font-medium transition-all duration-300 ${
              abaAtiva === 'login'
                ? 'bg-[#9F64AF] text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setAbaAtiva('cadastro')}
            className={`flex-1 py-2 rounded-lg font-medium transition-all duration-300 ${
              abaAtiva === 'cadastro'
                ? 'bg-[#9F64AF] text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Cadastrar
          </button>
        </div>

        {/* Conteúdo do formulário, alternando entre login e cadastro com animação suave */}
        <div className="transition-all duration-300">
          {abaAtiva === 'login' ? (
            <FormularioLogin />
          ) : (
            <FormularioCadastro />
          )}
        </div>
      </div>
    </div>
  );
}
