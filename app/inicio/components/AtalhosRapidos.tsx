// app/inicio/components/AtalhosRapidos.tsx
// Botões de atalho para ações rápidas, conforme perfil do usuário

'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Users,
  FileText,
  Clock,
  CalendarPlus,
  UserPlus,
  BarChart3,
} from 'lucide-react';

interface AtalhosRapidosProps {
  perfilId: number;  // 1 = secretária, 2 = psicólogo
}

// Atalhos para psicólogo (perfilId = 2)
const atalhosPsicologo = [
  { nome: 'Ver Agenda', icone: Calendar, href: '/agenda', cor: 'bg-purple-100 text-purple-600' },
  { nome: 'Visualizar Pacientes', icone: Users, href: '/pacientes', cor: 'bg-blue-100 text-blue-600' },
  { nome: 'Registrar Prontuário', icone: FileText, href: '/prontuario', cor: 'bg-green-100 text-green-600' },
  { nome: 'Gerenciar Disponibilidade', icone: Clock, href: '/agenda/disponibilidade', cor: 'bg-orange-100 text-orange-600' },
];

// Atalhos para secretária (perfilId = 1)
// O atalho "Novo Paciente" leva à página de pacientes com o modal de cadastro aberto via query param
const atalhosSecretaria = [
  { nome: 'Agendar Consulta', icone: CalendarPlus, href: '/agenda/agendar', cor: 'bg-purple-100 text-purple-600' },
  { nome: 'Novo Paciente', icone: UserPlus, href: '/pacientes?cadastrar=1', cor: 'bg-blue-100 text-blue-600' },
  { nome: 'Ver Relatórios', icone: BarChart3, href: '/relatorios', cor: 'bg-green-100 text-green-600' },
];

export default function AtalhosRapidos({ perfilId }: AtalhosRapidosProps) {
  const router = useRouter();
  const isPsicologo = perfilId === 2;
  const atalhos = isPsicologo ? atalhosPsicologo : atalhosSecretaria;

  const handleClick = (href: string) => {
    router.push(href);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-[#E1D4F0]"
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Atalhos Rápidos</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {atalhos.map((atalho, index) => {
          const Icone = atalho.icone;
          
          return (
            <motion.button
              key={atalho.nome}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleClick(atalho.href)}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl transition-all ${atalho.cor} hover:shadow-md`}
            >
              <Icone size={28} />
              <span className="text-sm font-medium text-center">{atalho.nome}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}