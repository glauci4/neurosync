// app/context/AutenticacaoContext.tsx
// Contexto de autenticação para gerenciar o estado do usuário logado, com persistência via localStorage e cookie
// Inclui a propriedade clinica_id na interface Usuario para uso em verificações como CPF duplicado

"use client";

import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useEffect, useState } from "react";
import {
  type UsuarioSessao,
  useLogoutUsuario,
  useUsuarioLogado,
} from "@/hooks/useSessaoUsuario";

type Usuario = UsuarioSessao;

interface AutenticacaoContextType {
  usuario: Usuario | null;
  carregando: boolean;
  fazerLogin: (dados: Usuario) => void;
  fazerLogout: () => void;
  atualizarUsuario: (dados: Partial<Usuario>) => void;
  estaAutenticado: boolean;
}

export const AutenticacaoContext = createContext({} as AutenticacaoContextType);

export function AutenticacaoProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const router = useRouter();
  const usuarioLogado = useUsuarioLogado(usuario?.id);
  const logoutUsuario = useLogoutUsuario();

  useEffect(() => {
    const dadosSalvos = localStorage.getItem("usuario_neurosync");

    if (dadosSalvos) {
      try {
        const usuarioSalvo = JSON.parse(dadosSalvos);
        setUsuario(usuarioSalvo);
      } catch (erro) {
        console.error("Erro ao carregar dados salvos:", erro);
        localStorage.removeItem("usuario_neurosync");
      }
    }

    setCarregando(false);
  }, []);

  useEffect(() => {
    const perfilAtualizado = usuarioLogado.data;
    if (!perfilAtualizado) return;

    setUsuario((usuarioAtual) => {
      if (!usuarioAtual || usuarioAtual.id !== perfilAtualizado.id) {
        return usuarioAtual;
      }

      const usuarioSincronizado = {
        ...usuarioAtual,
        nome: perfilAtualizado.nome || usuarioAtual.nome,
        email: perfilAtualizado.email || usuarioAtual.email,
        perfil: perfilAtualizado.perfil || usuarioAtual.perfil,
        perfil_id: perfilAtualizado.perfil_id || usuarioAtual.perfil_id,
        avatar_url: perfilAtualizado.avatar_url || null,
        isAdminClinica:
          perfilAtualizado.isAdminClinica ?? usuarioAtual.isAdminClinica,
        isResponsavelClinica:
          perfilAtualizado.isResponsavelClinica ??
          usuarioAtual.isResponsavelClinica,
      };

      localStorage.setItem(
        "usuario_neurosync",
        JSON.stringify(usuarioSincronizado),
      );

      return usuarioSincronizado;
    });
  }, [usuarioLogado.data]);

  useEffect(() => {
    if (usuarioLogado.error) {
      console.error(
        "Erro ao sincronizar usuário autenticado:",
        usuarioLogado.error,
      );
    }
  }, [usuarioLogado.error]);

  const fazerLogin = (dados: Usuario) => {
    console.log("Salvando usuario no contexto:", dados);
    setUsuario(dados);
    localStorage.setItem("usuario_neurosync", JSON.stringify(dados));
  };

  const atualizarUsuario = (dados: Partial<Usuario>) => {
    setUsuario((usuarioAtual) => {
      if (!usuarioAtual) return usuarioAtual;
      const usuarioAtualizado = { ...usuarioAtual, ...dados };
      localStorage.setItem(
        "usuario_neurosync",
        JSON.stringify(usuarioAtualizado),
      );
      return usuarioAtualizado;
    });
  };

  const fazerLogout = async () => {
    console.log("Fazendo logout - removendo dados");
    sessionStorage.setItem("logout_started_at", String(Date.now()));
    console.time("logout:cleanup");
    setUsuario(null);
    localStorage.removeItem("usuario_neurosync");
    console.timeEnd("logout:cleanup");

    console.time("logout:navigate");
    router.replace("/");
    console.timeEnd("logout:navigate");

    console.time("logout:api");
    logoutUsuario.mutate(undefined, {
      onSuccess: () => {
        console.timeEnd("logout:api");
      },
      onError: (erro) => {
        console.timeEnd("logout:api");
        console.error("Erro ao limpar sessão no servidor:", erro);
      },
    });
  };

  return (
    <AutenticacaoContext.Provider
      value={{
        usuario,
        carregando,
        fazerLogin,
        fazerLogout,
        atualizarUsuario,
        estaAutenticado: !!usuario,
      }}
    >
      {children}
    </AutenticacaoContext.Provider>
  );
}
