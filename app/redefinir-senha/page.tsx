// app/redefinir-senha/page.tsx
// Tela para redefinir a senha com o token

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { MdErrorOutline, MdCheckCircle } from 'react-icons/md';

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCarregando(true);
        setErro('');

        if (novaSenha !== confirmarSenha) {
            setErro('As senhas não coincidem');
            setCarregando(false);
            return;
        }

        try {
            const response = await fetch('/api/recuperacao-senha/redefinir', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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

    if (tokenInvalido) {
        return (
            <div className="text-center">
                <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
                    <MdErrorOutline size={24} className="inline mr-2" />
                    <p>Link inválido ou não fornecido.</p>
                </div>
                <Link href="/recuperar-senha">
                    <button className="text-[#9F64AF] hover:underline text-sm">
                        Solicitar nova recuperação
                    </button>
                </Link>
            </div>
        );
    }

    if (sucesso) {
        return (
            <div className="text-center">
                <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4">
                    <MdCheckCircle size={24} className="inline mr-2" />
                    <p>Senha redefinida com sucesso!</p>
                    <p className="text-sm mt-2">Redirecionando para o login...</p>
                </div>
            </div>
        );
    }

    return (
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] focus:border-transparent transition-all duration-200 pr-10 text-gray-800"
                        disabled={carregando}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setMostrarSenha(!mostrarSenha)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#9F64AF]"
                    >
                        {mostrarSenha ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                    Use 8+ caracteres com letras, números e símbolos
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] focus:border-transparent transition-all duration-200 pr-10 text-gray-800"
                        disabled={carregando}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#9F64AF]"
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
                className="w-full bg-[#9F64AF] text-white py-2 rounded-lg font-medium hover:bg-[#8B509B] transition-all duration-300 disabled:opacity-50"
            >
                {carregando ? 'Redefinindo...' : 'Redefinir senha'}
            </button>
        </form>
    );
}

export default function RedefinirSenha() {
    return (
        <Suspense fallback={<div className="text-center p-8">Carregando...</div>}>
            <RedefinirSenhaContent />
        </Suspense>
    );
}