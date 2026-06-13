// app/inicio/components/PainelAlertas.tsx
// Painel lateral com alertas e avisos importantes

"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Bell, Calendar, Users, X } from "lucide-react";
import { useState } from "react";

type Alerta = {
  id: number;
  tipo: "falta" | "consulta_amanha" | "novo_paciente" | "aviso" | string;
  mensagem: string;
  data?: string;
};

interface PainelAlertasProps {
  alertas: Alerta[];
}

// Icone para cada tipo de alerta
const iconePorTipo: Record<
  string,
  { icone: typeof AlertTriangle; cor: string }
> = {
  falta: { icone: AlertTriangle, cor: "text-orange-500" },
  consulta_amanha: { icone: Calendar, cor: "text-blue-500" },
  novo_paciente: { icone: Users, cor: "text-green-500" },
  aviso: { icone: Bell, cor: "text-purple-500" },
};

export default function PainelAlertas({ alertas }: PainelAlertasProps) {
  const [alertasVisiveis, setAlertasVisiveis] = useState(alertas);

  const removerAlerta = (id: number) => {
    setAlertasVisiveis(alertasVisiveis.filter((a) => a.id !== id));
  };

  if (alertasVisiveis.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Alertas</h2>
        <div className="text-center py-8">
          <Bell size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Nenhum alerta no momento</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Alertas</h2>

      <div className="space-y-3">
        {alertasVisiveis.map((alerta, index) => {
          const config = iconePorTipo[alerta.tipo] || iconePorTipo.aviso;
          const Icone = config.icone;

          return (
            <motion.div
              key={alerta.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex items-start justify-between p-3 rounded-xl bg-gray-50"
            >
              <div className="flex items-start gap-3">
                <Icone size={18} className={`${config.cor} mt-0.5`} />
                <div>
                  <p className="text-sm text-gray-700">{alerta.mensagem}</p>
                  {alerta.data && (
                    <p className="text-xs text-gray-400 mt-1">{alerta.data}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => removerAlerta(alerta.id)}
                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={14} className="text-gray-400" />
              </button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

