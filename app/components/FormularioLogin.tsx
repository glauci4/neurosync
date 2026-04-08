// app/components/FormularioLogin.tsx
// Componente de formulário de login, separado para melhor organização do código

'use client';

import { useState } from 'react';
// Importando ícones para alternar visibilidade da senha (UX melhorada)
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { MdErrorOutline } from 'react-icons/md'; //  Importando o ícone de erro da coleção Material Design
import Link from 'next/link'; // Importando Link do Next.js para navegação

export default function FormularioLogin() {

  // ESTADOS DO COMPONENTE

  // Armazena o valor digitado no campo de email
  const [email, setEmail] = useState('');

  // Armazena o valor digitado no campo de senha
  const [senha, setSenha] = useState('');

  // Controla se a senha está visível (true) ou oculta (false)
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Indica se o formulário está em processo de envio (loading)
  const [carregando, setCarregando] = useState(false);

  // Mensagem de erro geral (ex: falha no login)
  const [erro, setErro] = useState('');

  // Mensagem de erro específica do campo de email
  const [erroEmail, setErroEmail] = useState('');

  // FUNÇÕES AUXILIARES

  // Alterna entre mostrar/ocultar senha
  const alternarMostrarSenha = () => {
    // Inverte o estado atual (true -> false | false -> true)
    setMostrarSenha(!mostrarSenha);
  };

  // Função responsável por validar o email em tempo real
  const validarEmail = (emailDigitado: string) => {

    // Expressão regular (Regex) para validar formato de email
    // Estrutura básica: texto@texto.dominio
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Se o campo estiver vazio, não mostramos erro ainda
    if (!emailDigitado) {
      setErroEmail('');
      return false;
    }

    // Se o formato for inválido, exibimos erro
    if (!regexEmail.test(emailDigitado)) {
      setErroEmail('Digite um e-mail válido (exemplo: nome@empresa.com)');
      return false;
    }

    // Caso esteja correto, removemos o erro
    setErroEmail('');
    return true;
  };

  // Função chamada sempre que o usuário digita no campo de email
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novoEmail = e.target.value;

    // Atualiza o estado
    setEmail(novoEmail);

    // Executa validação em tempo real (melhora a experiência do usuário)
    validarEmail(novoEmail);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita reload da página

    // Valida email antes de continuar
    const emailValido = validarEmail(email);

    // Se email inválido, interrompe execução
    if (!emailValido) {
      setErro('Por favor, corrija o e-mail antes de continuar');
      return;
    }

    // Validação básica da senha
    if (!senha) {
      setErro('Digite sua senha');
      return;
    }

    // Ativa loading
    setCarregando(true);

    // Limpa erros anteriores
    setErro('');

    try {
      // Aqui futuramente será feita integração com API (ex: backend do NeuroSync)
      console.log('Email:', email);
      console.log('Senha:', senha);

      // Simulação de requisição (1 segundo)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Feedback temporário
      alert('Login realizado com sucesso! (em desenvolvimento)');

    } catch (error) {
      // Caso ocorra erro na requisição
      setErro('Erro ao fazer login. Tente novamente.');
    } finally {
      // Finaliza loading independente do resultado
      setCarregando(false);
    }
  };

  // RENDERIZAÇÃO (UI)

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* 
        noValidate desativa as validações padrão do HTML5,
        permitindo controle total das mensagens via React
      */}

      {/* Campo de email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          E-mail
        </label>

        <input
          id="email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="Digite seu e-mail"

          // Classe dinâmica:
          // Se houver erro -> borda vermelha + fundo leve vermelho
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400 ${
            erroEmail ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          
          disabled={carregando}
        />

        {/* Exibição do erro de email */}
        {erroEmail && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            {/* Ícone de erro importado do react-icons/md */}
            <MdErrorOutline size={14} />
            {erroEmail}
          </p>
        )}

      </div>

      {/* Campo de senha */}
      <div>
        <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
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
            disabled={carregando}
          />

          {/* Botão de alternar visibilidade da senha */}
          <button
            type="button"
            onClick={alternarMostrarSenha}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#9F64AF] transition-colors duration-200"
            tabIndex={-1} // Remove foco via TAB (melhora navegação)
          >
            {mostrarSenha ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
          </button>
        </div>

        {/* Texto auxiliar */}
        <p className="text-xs text-gray-400 mt-1">
          Clique no ícone do olho para {mostrarSenha ? 'ocultar' : 'mostrar'} a senha
        </p>
      </div>


      {/* Mensagem de erro geral */}
      {erro && (
        <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
          {erro}
        </div>
      )}

      {/* Botão de entrar */}
      <button
        type="submit"
        disabled={carregando}
        className="w-full bg-[#9F64AF] text-white py-2 rounded-lg font-medium hover:bg-[#8B509B] transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
      >
        {carregando ? 'Entrando...' : 'Entrar'}
      </button>

      {/* Link esqueceu a senha */}
      <div className="text-center mt-3">
    <Link href="/recuperar-senha">
        <button type="button" className="text-[#9F64AF] text-xs hover:underline transition-all duration-200">
            Esqueceu a senha?
        </button>
    </Link>
</div>
    </form>
  );
}