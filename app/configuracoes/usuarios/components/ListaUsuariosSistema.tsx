"use client";

import { motion } from "framer-motion";
import type {
  FiltrosUsuariosSistema,
  UsuarioSistema,
} from "../types/usuariosSistema.types";
import CardUsuarioSistema from "./CardUsuarioSistema";
import EmptyUsuariosSistema from "./EmptyUsuariosSistema";

interface ListaUsuariosSistemaProps {
  usuarios: UsuarioSistema[];
  filtros: FiltrosUsuariosSistema;
  onInativar: (usuario: UsuarioSistema) => void;
  onReativar: (usuario: UsuarioSistema) => void;
  podeGerenciar?: boolean;
  usuarioAtualId?: number | null;
}

export default function ListaUsuariosSistema({
  usuarios,
  filtros,
  onInativar,
  onReativar,
  podeGerenciar = true,
  usuarioAtualId = null,
}: ListaUsuariosSistemaProps) {
  const filtrando =
    filtros.busca.trim() !== "" ||
    filtros.perfil !== "todos" ||
    filtros.status !== "todos";

  if (usuarios.length === 0) {
    return <EmptyUsuariosSistema filtrando={filtrando} />;
  }

  return (
    <div className="space-y-3">
      {usuarios.map((usuario) => (
        <motion.div
          key={usuario.id}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          <CardUsuarioSistema
            usuario={usuario}
            usuarioAtualId={usuarioAtualId}
            onInativar={onInativar}
            onReativar={onReativar}
            podeGerenciar={podeGerenciar}
          />
        </motion.div>
      ))}
    </div>
  );
}
