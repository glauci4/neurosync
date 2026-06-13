// app/pacientes/components/EditarPacienteModal.tsx
// Modal responsável por exibir o formulário de edição de um paciente.
// Carrega os dados atuais do paciente via usePacientePorId e, ao enviar,
// chama a mutação useAtualizarPaciente para persistir as alterações.

"use client";

import { motion } from "framer-motion"; // Animações suaves (entrada/saída)
import { X } from "lucide-react"; // Ícone de "fechar"
import { useEffect } from "react";
import { toast } from "sonner"; // Notificações elegantes
import { useAtualizarPaciente } from "@/hooks/useAtualizarPaciente";
import { usePacientePorId } from "@/hooks/usePacientePorId";
import FormularioEdicaoAdulto from "./FormularioEdicaoAdulto";
import FormularioEdicaoMenor from "./FormularioEdicaoMenor";

// Propriedades esperadas pelo modal
interface EditarPacienteModalProps {
  isOpen: boolean; // Controla se o modal está visível
  onClose: () => void; // Função para fechar o modal (vinda do componente pai)
  pacienteId: number; // ID do paciente a ser editado
  onSuccess?: () => void; // Callback opcional chamado após a atualização bem‑sucedida
}

export default function EditarPacienteModal({
  isOpen,
  onClose,
  pacienteId,
  onSuccess,
}: EditarPacienteModalProps) {
  // Valida se o ID recebido é um número positivo; caso contrário, usa `null` para desabilitar a query.
  const idValido =
    typeof pacienteId === "number" && !isNaN(pacienteId) && pacienteId > 0
      ? pacienteId
      : null;

  // Busca os dados atuais do paciente (hook do TanStack Query)
  const { data: paciente, isLoading, error } = usePacientePorId(idValido);

  // Mutação para atualizar os dados (envia PUT para a API)
  const {
    mutate: atualizar,
    isPending,
    reset,
    isSuccess,
  } = useAtualizarPaciente();

  // Limpa o estado da mutação sempre que o modal for aberto, evitando que mensagens de sucesso/erro antigas persistam.
  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen, reset]);

  // Quando a mutação for bem‑sucedida, fecha o modal, dispara o callback e exibe notificação.
  useEffect(() => {
    if (isSuccess) {
      toast.success("Paciente atualizado com sucesso!");
      onClose(); // Fecha o modal
      onSuccess?.(); // Recarrega a lista de pacientes (ou outra ação)
    }
  }, [isSuccess, onClose, onSuccess]);

  // Se o modal não estiver aberto, não renderiza nada.
  if (!isOpen) return null;

  // Função chamada pelo formulário de edição (Adulto ou Menor) quando o usuário submete as alterações.
  const handleSubmit = (dados: any) => {
    if (!idValido) {
      toast.error("ID do paciente inválido");
      return;
    }
    // Executa a mutação, passando o ID e os novos dados.
    atualizar({ id: idValido, dados });
  };

  return (
    // Overlay escuro com blur (efeito de fundo)
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose} // Clicar no overlay também fecha o modal
      />

      {/* Card do modal com animação de entrada */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8"
      >
        {/* Botão para fechar o modal (canto superior direito) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Editar Paciente
        </h2>

        {/* Estados de carregamento, erro e dados inválidos */}
        {!idValido && (
          <div className="text-red-500 text-center py-4">
            ID do paciente inválido, tente novamente.
          </div>
        )}
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-[#9F64AF] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {error && (
          <div className="text-red-500 text-center py-4">
            Erro ao carregar os dados do paciente. Tente novamente.
          </div>
        )}

        {/* Quando os dados estiverem disponíveis, renderiza o formulário correto (adulto/menor) */}
        {paciente && idValido && (
          <div className="mt-6">
            {paciente.tipo === "adulto" ? (
              <FormularioEdicaoAdulto
                paciente={paciente}
                onSubmit={handleSubmit}
                isPending={isPending}
              />
            ) : (
              <FormularioEdicaoMenor
                paciente={paciente}
                onSubmit={handleSubmit}
                isPending={isPending}
              />
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

