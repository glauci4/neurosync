// app/recuperar-senha/page.tsx
// Tela para solicitar recuperação de senha

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MdErrorOutline, MdCheckCircle } from 'react-icons/md';

export default function RecuperarSenha() {
    const [email, setEmail] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCarregando(true);
        setErro('');
        setSucesso(false);

        try {
            const response = await fetch('/api/recuperacao-senha/solicitar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const resultado = await response.json();

            if (response.ok) {
                // Sucesso: e-mail existe e mensagem enviada
                setSucesso(true);
                setEmail('');
            } else {
                // Erro: e-mail não encontrado ou outro problema
                // Mostra a mensagem de erro vinda da API
                setErro(resultado.error || 'Erro ao solicitar recuperação');
            }
        } catch (error) {
            setErro('Erro ao conectar com o servidor');
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
                
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-[#9F64AF] mb-2" style={{ fontFamily: 'Pacifico, cursive' }}>
                        NeuroSync
                    </h1>
                    <h2 className="text-xl font-semibold text-gray-800">Recuperar senha</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Digite seu e-mail cadastrado para receber as instruções
                    </p>
                </div>

                {sucesso ? (
                    <div className="text-center">
                        <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4">
                            <MdCheckCircle size={24} className="inline mr-2" />
                            <p>Enviamos um e-mail com as instruções para recuperar sua senha.</p>
                            <p className="text-xs mt-2">Verifique sua caixa de entrada ou spam.</p>
                        </div>
                        <Link href="/">
                            <button className="text-[#9F64AF] hover:underline text-sm">
                                Voltar para o login
                            </button>
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                E-mail cadastrado
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Digite o e-mail da sua conta"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400"
                                disabled={carregando}
                                required
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                Use o mesmo e-mail que você cadastrou no sistema
                            </p>
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
                            {carregando ? 'Verificando...' : 'Enviar instruções'}
                        </button>

                        <div className="text-center mt-4">
                            <Link href="/">
                                <button type="button" className="text-[#9F64AF] text-sm hover:underline">
                                    Voltar para o login
                                </button>
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}