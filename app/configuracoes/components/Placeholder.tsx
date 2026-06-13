// app/configuracoes/components/Placeholder.tsx
// Placeholder genérico para seções ainda não implementadas.
// Agora aceita um ícone opcional que será exibido acima da descrição.

import { motion } from "framer-motion";

interface PlaceholderProps {
  descricao: string;
  icon?: React.ElementType; // ícone opcional, ex.: Tag para Salas
}

export default function Placeholder({
  descricao,
  icon: Icon,
}: PlaceholderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-50 rounded-2xl border border-gray-200 p-12 text-center"
    >
      {/* Renderiza o ícone se a prop for fornecida */}
      {Icon && <Icon size={32} className="text-gray-300 mx-auto mb-4" />}
      <p className="text-gray-500">{descricao}</p>
      <p className="text-sm text-gray-300 mt-2">Em breve...</p>
    </motion.div>
  );
}

