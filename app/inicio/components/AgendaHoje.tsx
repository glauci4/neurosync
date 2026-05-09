// app/inicio/components/AgendaHoje.tsx
// Lista de consultas agendadas para o dia atual com status, horário e paciente, além de um link para ver a agenda completa

'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, DoorOpen, User, MoreVertical } from 'lucide-react';
import type { Consulta } from '../types';

interface AgendaHojeProps {
  consultas: Consulta[];
}

const statusConfig: Record<string, { cor: string; texto: string }> = {
  agendado: { cor: 'bg-yellow-100 text-yellow-700', texto: 'Agendado' },
  concluido: { cor: 'bg-green-100 text-green-700', texto: 'Concluído' },
  cancelado: { cor: 'bg-red-100 text-red-700', texto: 'Cancelado' },
  falta: { cor: 'bg-orange-100 text-orange-700', texto: 'Falta' },
};

export default function AgendaHoje({ consultas }: AgendaHojeProps) {
  const router = useRouter();

  const hoje = new Date();
  const dataFormatada = hoje.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-[#E1D4F0]"
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Consultas de Hoje</h2>
          <p className="text-sm text-gray-500 mt-1 capitalize">{dataFormatada}</p>
        </div>
        <button
          onClick={() => router.push('/agenda')}
          className="text-[#9F64AF] text-sm font-medium hover:underline transition-colors"
        >
          Ver Agenda
        </button>
      </div>

      {/* Lista de consultas */}
      {consultas.length === 0 ? (
        <div className="text-center py-12">
          <Calendar size={48} className="mx-auto text-[#E1D4F0] mb-3" />
          <p className="text-gray-500">Nenhuma consulta agendada para hoje.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {consultas.map((consulta, index) => {
            const status = statusConfig[consulta.status] || statusConfig.agendado;
            
            return (
              <motion.div
                key={consulta.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl bg-white shadow-sm border border-[#E1D4F0] hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-6">
                  {/* Horário */}
                  <div className="min-w-[70px]">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock size={14} />
                      <span className="text-sm font-medium">{consulta.horario}</span>
                    </div>
                  </div>

                  {/* Informações do paciente */}
                  <div>
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-gray-400" />
                      <span className="font-medium text-gray-800">{consulta.paciente}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <DoorOpen size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-500">Sala {consulta.sala}</span>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.cor}`}>
                    {status.texto}
                  </span>
                  <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical size={16} className="text-gray-400" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}