// app/pacientes/novo/formulario/components/ContatoEmergencia.tsx
// Componente de contato de emergência do formulário de cadastro/edição de paciente adulto. Valida o formato do telefone localmente e exibe erros tanto do formato quanto do formulário pai (ex: telefone obrigatório ou igual ao do paciente) abaixo do campo Telefone, com ícone de erro para melhor visualização.

'use client';

import { useState } from 'react';
import { MdErrorOutline } from 'react-icons/md';

interface ContatoEmergenciaProps {
    contato: { nome: string; telefone: string; parentesco: string };
    setContato: (data: any) => void;
    erroTelefoneExterno?: string; // erro vindo do formulário pai (ex: obrigatório ou igual ao do paciente)
}

export default function ContatoEmergencia({ contato, setContato, erroTelefoneExterno }: ContatoEmergenciaProps) {
    const [erroLocal, setErroLocal] = useState('');

    // Valida o formato do telefone (apenas dígitos, 10 ou 11)
    const validarTelefone = (telefone: string): string => {
        const numeros = telefone.replace(/\D/g, '');
        if (numeros && (numeros.length < 10 || numeros.length > 11)) {
            return 'Telefone deve ter 10 ou 11 dígitos';
        }
        return '';
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setContato((prev: any) => ({ ...prev, [name]: value }));

        // Se o campo alterado for o telefone, reavalia o erro local
        if (name === 'telefone') {
            const erro = validarTelefone(value);
            setErroLocal(erro);
        }
    };

    const handleTelefoneBlur = () => {
        const erro = validarTelefone(contato.telefone);
        setErroLocal(erro);
    };

    // O erro final exibido é o erro externo (prioritário) ou o erro local de formato
    const erroFinal = erroTelefoneExterno || erroLocal;

    return (
        <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="text-md font-semibold text-gray-800 mb-3">
                Contato de Emergência <span className="text-xs font-normal text-gray-500">(opcional)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Campo Nome */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                        type="text"
                        name="nome"
                        value={contato.nome || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800"
                    />
                </div>

                {/* Campo Telefone com validação de formato e exibição de erro */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input
                        type="tel"
                        name="telefone"
                        value={contato.telefone || ''}
                        onChange={handleChange}
                        onBlur={handleTelefoneBlur}
                        placeholder="(00) 00000-0000"
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800 ${
                            erroFinal ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {erroFinal && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <MdErrorOutline size={14} /> {erroFinal}
                        </p>
                    )}
                </div>

                {/* Campo Parentesco */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parentesco</label>
                    <input
                        type="text"
                        name="parentesco"
                        value={contato.parentesco || ''}
                        onChange={handleChange}
                        placeholder="Ex: Irmão, Cônjuge, Amigo"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800"
                    />
                </div>
            </div>
        </div>
    );
}