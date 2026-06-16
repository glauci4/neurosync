// app/redefinir-senha/page.tsx
// Tela para redefinir a senha com o token recebido por e-mail

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { MdErrorOutline, MdCheckCircle } from 'react-icons/md';

// Componente interno que usa useSearchParams
function RedefinirSenhaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [tokenInvalido, setTokenInvalido] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenInvalido(true);
    }
  }, [token]);

  const validarSenhaForte = (senha: string): { valida: boolean; mensagem: string } => {
    if (senha.length < 8) {
      return { valida: false, mensagem: 'A senha deve ter pelo menos 8 caracteres' };
    }
    if (!/[A-Z]/.test(senha)) {
      return { valida: false, mensagem: 'A senha deve conter pelo menos uma letra maiúscula' };
    }
    if (!/[a-z]/.test(senha)) {
      return { valida: false, mensagem: 'A senha deve conter pelo menos uma letra minúscula' };
    }
    if (!/[0-9]/.test(senha)) {
      return { valida: false, mensagem: 'A senha deve conter pelo menos um número' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(senha)) {
      return { valida: false, mensagem: 'A senha deve conter pelo menos um caractere especial' };
    }
    return { valida: true, mensagem: 'Senha forte!' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem');
      setCarregando(false);
      return;
    }

    const validacao = validarSenhaForte(novaSenha);
    if (!validacao.valida) {
      setErro(validacao.mensagem);
      setCarregando(false);
      return;
    }

    try {
      const response = await fetch('/api/recuperacao-senha/redefinir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, novaSenha, confirmarSenha }),
      });

      const resultado = await response.json();

      if (response.ok) {
        setSucesso(true);
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setErro(resultado.error || 'Erro ao redefinir senha');
      }
    } catch (error) {
      setErro('Erro ao conectar com o servidor');
    } finally {
      setCarregando(false);
    }
  };

  // Tela de token inválido 
  if (tokenInvalido) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0] flex flex-col items-center justify-center p-4">
        
        {/* Logo e título */}
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
          <h1 className="text-3xl font-bold text-[#9F64AF]" style={{ fontFamily: 'Pacifico, cursive' }}>
            NeuroSync
          </h1>
        </div>

        {/* Card com a mensagem de erro */}
        <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
            <MdErrorOutline size={24} className="inline mr-2" />
            <p>Link inválido ou não fornecido.</p>
            <p className="text-xs mt-2">O link de recuperação pode ter expirado ou ser inválido.</p>
          </div>
          <Link href="/recuperar-senha">
            <button className="bg-[#9F64AF] text-white py-2 px-4 rounded-lg hover:bg-[#8B509B] transition-all duration-300">
              Solicitar nova recuperação
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Tela de sucesso 
  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0] flex flex-col items-center justify-center p-4">
        
        {/* Logo e título */}
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
          <h1 className="text-3xl font-bold text-[#9F64AF]" style={{ fontFamily: 'Pacifico, cursive' }}>
            NeuroSync
          </h1>
        </div>

        {/* Card com a mensagem de sucesso */}
        <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
          <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4">
            <MdCheckCircle size={24} className="inline mr-2" />
            <p>Senha redefinida com sucesso!</p>
            <p className="text-sm mt-2">Redirecionando para o login...</p>
          </div>
        </div>
      </div>
    );
  }

  // Tela principal do formulário
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0] flex flex-col items-center justify-center p-4">
      
      {/* Logo e título */}
      <div className="text-center mb-4">
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
        <h1 className="text-4xl font-bold text-[#9F64AF] mb-1" style={{ fontFamily: 'Pacifico, cursive' }}>
          NeuroSync
        </h1>
        <p className="text-[#7B4FA3] text-sm font-medium mt-2">
          Plataforma de agendamento integrada para psicólogos
        </p>
      </div>

      {/* Card branco com efeito de vidro */}
      <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Redefinir senha</h2>
          <p className="text-gray-500 text-sm mt-1">
            Digite sua nova senha
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label htmlFor="nova-senha" className="block text-sm font-medium text-gray-700 mb-1">
              Nova senha
            </label>
            <div className="relative">
              <input
                id="nova-senha"
                type={mostrarSenha ? 'text' : 'password'}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Digite sua nova senha"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] focus:border-transparent transition-all duration-200 pr-10 text-gray-800 placeholder-gray-400"
                disabled={carregando}
                required
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#9F64AF] transition-colors duration-200"
              >
                {mostrarSenha ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              A senha deve ter no mínimo 8 caracteres, conter números, letras maiúsculas e caracteres especiais (! “ # $ % ‘ () *)
            </p>
          </div>

          <div>
            <label htmlFor="confirmar-senha" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar nova senha
            </label>
            <div className="relative">
              <input
                id="confirmar-senha"
                type={mostrarConfirmar ? 'text' : 'password'}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Confirme sua nova senha"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] focus:border-transparent transition-all duration-200 pr-10 text-gray-800 placeholder-gray-400"
                disabled={carregando}
                required
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#9F64AF] transition-colors duration-200"
              >
                {mostrarConfirmar ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>

          {erro && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg flex items-center justify-center gap-1">
              <MdErrorOutline size={16} />
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-[#9F64AF] text-white py-2 rounded-lg font-medium hover:bg-[#8B509B] transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
          >
            {carregando ? 'Redefinindo...' : 'Redefinir senha'}
          </button>

          <div className="text-center mt-3">
            <Link href="/">
              <button type="button" className="text-[#9F64AF] text-sm hover:underline transition-all duration-200">
                Voltar para o login
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componente principal com Suspense para lidar com o uso de useSearchParams no componente interno
export default function RedefinirSenha() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#9F64AF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <RedefinirSenhaContent />
    </Suspense>
  );
}