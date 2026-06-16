// app/recuperar-senha/page.tsx
// Tela para solicitar recuperação de senha utilizando TanStack Query, permite que o usuário informe seu e-mail para receber um link de redefinição.

'use client';

// Importa o hook useState para gerenciamento de estado local
import { useState } from 'react';

// Importa o componente de navegação do Next.js
import Link from 'next/link';

// Importa o componente Image para otimização de imagens
import Image from 'next/image';

// Importa ícones da biblioteca React Icons
import { MdErrorOutline, MdCheckCircle } from 'react-icons/md';

// Importa o hook personalizado responsável pela solicitação de recuperação de senha
import { useSolicitarRecuperacao } from '@/hooks/useSolicitarRecuperacao';

// Componente principal da página de recuperação de senha
export default function RecuperarSenha() {
  // Estado que armazena o e-mail digitado pelo usuário
  const [email, setEmail] = useState('');

  // Hook do TanStack Query para solicitar a recuperação de senha
  // mutate: executa a requisição
  // isPending: indica carregamento
  // error: armazena erros da requisição
  // isSuccess: indica sucesso na operação
  const { mutate: solicitar, isPending, error, isSuccess } =
    useSolicitarRecuperacao();

  // Função chamada ao enviar o formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Evita o recarregamento da página

    // Validação simples do campo de e-mail
    if (!email) {
      alert('Digite seu e-mail');
      return;
    }

    // Executa a mutação para solicitar a recuperação de senha
    solicitar(email);
  };

  // TELA DE SUCESSO
  // Exibida após o envio bem-sucedido do e-mail de recuperação
 
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0] flex flex-col items-center justify-center p-4">
        
        {/* Logo e nome do sistema */}
        <div className="text-center mb-6">
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
          <h1
            className="text-3xl font-bold text-[#9F64AF]"
            style={{ fontFamily: 'Pacifico, cursive' }}
          >
            NeuroSync
          </h1>
        </div>

        {/* Mensagem de confirmação */}
        <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
          <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4">
            <MdCheckCircle size={24} className="inline mr-2" />
            <p>
              Enviamos um e-mail com as instruções para recuperar sua senha.
            </p>
            <p className="text-xs mt-2">
              Verifique sua caixa de entrada ou spam.
            </p>
          </div>

          {/* Link para retornar ao login */}
          <Link href="/">
            <button className="text-[#9F64AF] hover:underline text-sm">
              Voltar para o login
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // TELA PRINCIPAL – FORMULÁRIO DE RECUPERAÇÃO DE SENHA
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0] flex flex-col items-center justify-center p-4">
      
      {/* Logo e nome do sistema */}
      <div className="text-center mb-6">
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
        <h1
          className="text-3xl font-bold text-[#9F64AF]"
          style={{ fontFamily: 'Pacifico, cursive' }}
        >
          NeuroSync
        </h1>
      </div>

      {/* Card do formulário */}
      <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
        
        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Recuperar senha
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Digite seu e-mail cadastrado para receber as instruções
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Campo de E-mail */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              E-mail cadastrado
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite o e-mail da sua conta"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400"
              disabled={isPending} // Desativa o campo durante o envio
              required
            />

            <p className="text-xs text-gray-400 mt-1">
              Use o mesmo e-mail que você cadastrou no sistema
            </p>
          </div>

          {/* Exibição de erro */}
          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg flex items-center justify-center gap-1">
              <MdErrorOutline size={16} />
              {error.message}
            </div>
          )}

          {/* Botão de envio */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#9F64AF] text-white py-2 rounded-lg font-medium hover:bg-[#8B509B] transition-all duration-300 disabled:opacity-50"
          >
            {/* Indica o estado de carregamento */}
            {isPending ? 'Enviando...' : 'Enviar instruções'}
          </button>

          {/* Link para retornar ao login */}
          <div className="text-center mt-4">
            <Link href="/">
              <button
                type="button"
                className="text-[#9F64AF] text-sm hover:underline"
              >
                Voltar para o login
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}