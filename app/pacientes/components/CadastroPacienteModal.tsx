// app/pacientes/components/CadastroPacienteModal.tsx
// Modal de cadastro de paciente (adulto ou menor) gerencia a seleção do tipo de paciente, o estado de carregamento/erro e reseta os estados do hook de cadastro quando necessário.

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useCadastroPaciente } from '@/hooks/useCadastroPaciente';
// Importa os formulários existentes (caminho relativo a partir de app/pacientes/components)
import FormularioAdulto from '../novo/formulario/components/FormularioAdulto';
import FormularioMenor from '../novo/formulario/components/FormularioMenor';

// Interface das propriedades do modal

interface CadastroPacienteModalProps {
    isOpen: boolean;      // Controla se o modal está visível
    onClose: () => void;  // Função para fechar o modal
    onSuccess?: () => void; // Callback opcional executado após cadastro bem-sucedido
}

// Componente de alternância entre "Adulto" e "Menor de Idade"

function TipoPacienteToggle({ tipo, onChange }: { tipo: 'adulto' | 'menor'; onChange: (t: typeof tipo) => void }) {
    return (
        <div className="flex bg-gray-100 rounded-xl p-1 w-fit">
            <button
                type="button"
                onClick={() => onChange('adulto')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    tipo === 'adulto'
                        ? 'bg-white text-[#9F64AF] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                Adulto
            </button>
            <button
                type="button"
                onClick={() => onChange('menor')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    tipo === 'menor'
                        ? 'bg-white text-[#9F64AF] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                Menor de Idade
            </button>
        </div>
    );
}

// Componente principal do Modal de Cadastro

export default function CadastroPacienteModal({ isOpen, onClose, onSuccess }: CadastroPacienteModalProps) {
    // Estado para controlar qual formulário (adulto ou menor) está sendo exibido
    const [tipo, setTipo] = useState<'adulto' | 'menor'>('adulto');

    // Obtém as funções e estados do hook de cadastro personalizado
    // - mutate: função que dispara o cadastro
    // - isPending: indica se a requisição está em andamento
    // - error: objeto de erro da mutação
    // - isSuccess: booleano que se torna true quando o cadastro é bem-sucedido
    // - reset: limpa os estados da mutação (erro, isSuccess, etc.)
    const { mutate: cadastrar, isPending, error, isSuccess, reset } = useCadastroPaciente();

    
    // Resetar erro sempre que o modal for aberto, isso evita que mensagens de erro de tentativas anteriores permaneçam visíveis ao abrir o modal novamente.
 
    useEffect(() => {
        if (isOpen) {
            reset();
        }
    }, [isOpen, reset]);

    // Resetar erro quando o tipo de paciente for alterado (ex: mudar de adulto para menor)

    useEffect(() => {
        reset();
    }, [tipo, reset]);

    // Quando o cadastro for bem-sucedido, fecha o modal e executa o callback onSuccess (se fornecido)
    
    useEffect(() => {
        if (isSuccess) {
            onClose();
            if (onSuccess) onSuccess();
        }
    }, [isSuccess, onClose, onSuccess]);

    // Função para fechar o modal com reset adicional, garante que qualquer estado residual seja limpo ao fechar manualmente
   
    const handleClose = () => {
        reset();      // Limpa erro e estado de sucesso
        onClose();    // Fecha o modal
    };

    // Se o modal não estiver aberto, não renderiza nada
    if (!isOpen) return null;

    // Função passada para os formulários, chama a mutação com os dados do paciente
    const handleSubmit = (dados: any) => {
        cadastrar(dados);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay escuro com blur, fecha ao clicar fora (usando handleClose) */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Card do modal com animação de entrada */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8"
            >
                {/* Botão fechar (X) – também usa handleClose */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Cadastrar Paciente
                </h2>

                {/* Seletor de tipo (Adulto / Menor) */}
                <TipoPacienteToggle tipo={tipo} onChange={setTipo} />

                {/* Renderização condicional do formulário correto */}
                <div className="mt-6">
                    {tipo === 'adulto' ? (
                        <FormularioAdulto
                            onSubmit={handleSubmit}
                            isPending={isPending}
                            error={error}
                            onClose={handleClose}
                        />
                    ) : (
                        <FormularioMenor
                            onSubmit={handleSubmit}
                            isPending={isPending}
                            error={error}
                            onClose={handleClose}
                        />
                    )}
                </div>

            </motion.div>
        </div>
    );
}