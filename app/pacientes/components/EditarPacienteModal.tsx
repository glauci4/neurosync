// app/pacientes/components/EditarPacienteModal.tsx
'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { usePacientePorId } from '@/hooks/usePacientePorId';
import { useAtualizarPaciente } from '@/hooks/useAtualizarPaciente';
import FormularioEdicaoAdulto from './edicao/FormularioEdicaoAdulto';
import FormularioEdicaoMenor from './edicao/FormularioEdicaoMenor';
import { toast } from 'sonner';

interface EditarPacienteModalProps {
    isOpen: boolean;
    onClose: () => void;
    pacienteId: number;
    onSuccess?: () => void;
}

export default function EditarPacienteModal({ isOpen, onClose, pacienteId, onSuccess }: EditarPacienteModalProps) {
    const { data: paciente, isLoading, error } = usePacientePorId(isOpen ? pacienteId : null);
    const { mutate: atualizar, isPending, reset, isSuccess } = useAtualizarPaciente();

    useEffect(() => {
        if (isOpen) reset();
    }, [isOpen, reset]);

    useEffect(() => {
        if (isSuccess) {
            // Fecha o modal e recarrega a lista
            onClose();
            if (onSuccess) onSuccess();
        }
    }, [isSuccess, onClose, onSuccess]);

    if (!isOpen) return null;

    const handleSubmit = (dados: any) => {
        atualizar({ id: pacienteId, dados });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay escuro com blur */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Card do modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
                    <X size={20} />
                </button>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Editar Paciente</h2>

                {isLoading && (
                    <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-4 border-[#9F64AF] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                {error && <div className="text-red-500 text-center py-4">Erro ao carregar os dados do paciente. Tente novamente.</div>}
                {paciente && (
                    <div className="mt-6">
                        {paciente.tipo === 'adulto' ? (
                            <FormularioEdicaoAdulto paciente={paciente} onSubmit={handleSubmit} isPending={isPending} />
                        ) : (
                            <FormularioEdicaoMenor paciente={paciente} onSubmit={handleSubmit} isPending={isPending} />
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
}