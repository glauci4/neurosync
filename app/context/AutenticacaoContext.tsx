// app/context/AutenticacaoContext.tsx
// Contexto de autenticação para gerenciar o estado do usuário logado, com persistência via localStorage e cookie
// Inclui a propriedade clinica_id na interface Usuario para uso em verificações como CPF duplicado

'use client';

import { createContext, useState, useEffect, ReactNode } from 'react';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: string;
  perfil_id: number;
  clinica_id: number; // ← adicionado para uso em verificações de duplicidade
}

interface AutenticacaoContextType {
  usuario: Usuario | null;
  carregando: boolean;
  fazerLogin: (dados: Usuario) => void;
  fazerLogout: () => void;
  estaAutenticado: boolean;
}

// Função para criar um cookie com expiração de 30 dias
function setCookie(nome: string, valor: string, dias: number = 30) {
  const data = new Date();
  data.setTime(data.getTime() + (dias * 24 * 60 * 60 * 1000));
  const expira = `expires=${data.toUTCString()}`;
  document.cookie = `${nome}=${valor}; ${expira}; path=/; SameSite=Lax`;
}

// Função para remover um cookie
function deleteCookie(nome: string) {
  document.cookie = `${nome}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// Função para ler um cookie
function getCookie(nome: string): string | null {
  const nameEQ = nome + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

export const AutenticacaoContext = createContext({} as AutenticacaoContextType);

export function AutenticacaoProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Tenta carregar do localStorage primeiro
    const dadosSalvos = localStorage.getItem('usuario_neurosync');
    
    if (dadosSalvos) {
      try {
        const usuarioSalvo = JSON.parse(dadosSalvos);
        setUsuario(usuarioSalvo);
        // Garante que o cookie também esteja presente
        const cookieData = { id: usuarioSalvo.id, email: usuarioSalvo.email, clinica_id: usuarioSalvo.clinica_id };
        setCookie('usuario_neurosync', JSON.stringify(cookieData), 30);
        console.log('Usuario carregado do localStorage');
      } catch (erro) {
        console.error('Erro ao carregar dados salvos:', erro);
        localStorage.removeItem('usuario_neurosync');
        deleteCookie('usuario_neurosync');
      }
    } else {
      // Tenta carregar do cookie como fallback
      const cookieData = getCookie('usuario_neurosync');
      if (cookieData) {
        console.log('Cookie encontrado, mas localStorage vazio');
        // Cookie existe, mas localStorage não, pode ser uma sessão inconsistente. Neste caso, removemos o cookie para forçar novo login
        deleteCookie('usuario_neurosync');
      }
    }
    
    setCarregando(false);
  }, []);

  const fazerLogin = (dados: Usuario) => {
    console.log('Salvando usuario no contexto:', dados);
    setUsuario(dados);
    
    // Salva no localStorage (persiste entre abas)
    localStorage.setItem('usuario_neurosync', JSON.stringify(dados));
    
    // Salva no cookie para o proxy (válido por 30 dias)
    const cookieData = { id: dados.id, email: dados.email, clinica_id: dados.clinica_id };
    setCookie('usuario_neurosync', JSON.stringify(cookieData), 30);
    
    console.log('Cookie criado com validade de 30 dias');
    console.log('LocalStorage salvo');
  };

  const fazerLogout = () => {
    console.log('Fazendo logout - removendo dados');
    setUsuario(null);
    localStorage.removeItem('usuario_neurosync');
    deleteCookie('usuario_neurosync');
    console.log('Cookie e localStorage removidos');
  };

  return (
    <AutenticacaoContext.Provider
      value={{
        usuario,
        carregando,
        fazerLogin,
        fazerLogout,
        estaAutenticado: !!usuario,
      }}
    >
      {children}
    </AutenticacaoContext.Provider>
  );
}