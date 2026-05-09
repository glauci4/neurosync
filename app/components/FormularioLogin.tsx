// app/components/FormularioLogin.tsx
// Componente de formulário de login utilizando TanStack Query, responsável pela autenticação do usuário no sistema NeuroSync

'use client';

// Importa o hook useState para gerenciamento de estados locais
import { useState } from 'react';

// Importa ícones para alternar a visibilidade da senha
import { FaEye, FaEyeSlash } from 'react-icons/fa';

// Importa ícone de erro da coleção Material Design
import { MdErrorOutline } from 'react-icons/md';

// Importa o componente Link do Next.js para navegação entre páginas
import Link from 'next/link';

// Importa o hook personalizado de login que utiliza TanStack Query
import { useLogin } from '@/hooks/useLogin';

// Componente principal do formulário de login
export default function FormularioLogin() {
  
  // ESTADOS DO COMPONENTE

  // Armazena o e-mail digitado pelo usuário
  const [email, setEmail] = useState('');

  // Armazena a senha digitada pelo usuário
  const [senha, setSenha] = useState('');

  // Controla a visibilidade da senha (true = visível, false = oculta)
  const [mostrarSenha, setMostrarSenha] = useState(false);
  
  // Utiliza o hook de login baseado no TanStack Query
  // mutate: executa a requisição de login
  // isPending: indica se a requisição está em andamento
  // error: armazena erros retornados pela API
  const { mutate: fazerLogin, isPending, error } = useLogin();

  // Função executada ao enviar o formulário
  const handleSubmit = (e: React.FormEvent) => {
    // Impede o recarregamento da página
    e.preventDefault();
    
    // Valida se todos os campos foram preenchidos
    if (!email || !senha) {
      alert('Preencha todos os campos');
      return;
    }
    
    // Executa a mutação de login enviando os dados para a API
    fazerLogin({ email, senha });
  };

  // RENDERIZAÇÃO DO COMPONENTE
  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      
      {/* noValidate desativa as validações padrão do HTML5, permitindo controle total das mensagens via React. */}

      {/* Campo de E-mail */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          E-mail
        </label>

        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Digite seu e-mail"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400"
          disabled={isPending} // Desativa o campo durante o envio
        />
      </div>
      
      {/* Campo de Senha */}
      <div>
        <label
          htmlFor="senha"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Senha
        </label>

        {/* Container relativo para posicionar o ícone dentro do input */}
        <div className="relative">
          <input
            id="senha"
            type={mostrarSenha ? 'text' : 'password'}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Digite sua senha"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] focus:border-transparent transition-all duration-200 pr-10 text-gray-800 placeholder-gray-400"
            disabled={isPending} // Desativa o campo durante o envio
          />

          {/* Botão para alternar a visibilidade da senha */}
          <button
            type="button"
            onClick={() => setMostrarSenha(!mostrarSenha)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#9F64AF] transition-colors duration-200"
            aria-label="Alternar visibilidade da senha"
          >
            {mostrarSenha ? (
              <FaEyeSlash size={18} />
            ) : (
              <FaEye size={18} />
            )}
          </button>
        </div>
      </div>
      
      {/* Exibição de erro retornado pela API */}
      {error && (
        <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg flex items-center justify-center gap-1">
          <MdErrorOutline size={16} />
          {/* Exibe a mensagem de erro retornada pela requisição */}
          {error.message}
        </div>
      )}
      
      {/* Botão de Envio */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#9F64AF] text-white py-2 rounded-lg font-medium hover:bg-[#8B509B] transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {/* isPending indica se a requisição está em andamento */}
        {isPending ? 'Entrando...' : 'Entrar'}
      </button>
      
      {/* Link para recuperação de senha */}
      <div className="text-center mt-3">
        <Link href="/recuperar-senha">
          <button
            type="button"
            className="text-[#9F64AF] text-xs hover:underline transition-all duration-200"
          >
            Esqueceu a senha?
          </button>
        </Link>
      </div>
    </form>
  );
}