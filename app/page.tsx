// app/page.tsx
// Página principal do NeuroSync 

'use client'; // Necessário para usar useState e interatividade

import { useState } from 'react'; 
import Image from 'next/image';
import FormularioLogin from './components/FormularioLogin';
import FormularioCadastro from './components/FormularioCadastro';

export default function Home() {
    const [abaAtiva, setAbaAtiva] = useState<'login' | 'cadastro'>('login'); // Estado para controlar a aba ativa

    return (
        // Container principal com gradiente lilás de fundo
     <div className="min-h-screen bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0] flex flex-col items-center justify-center p-3">
      
      {/* Container para logo, título e subtítulo */}
        <div className="text-center mb-4">
        
        {/* Logo com bordas arredondadas */}
        {/* rounded-2xl da bordas arredondadas, shadow-lg adiciona sombra */}
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
        
        {/* Subtítulo com tom mais suave (mt-1 adiciona espaco acima, mb-0 remove espaco abaixo) */}
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