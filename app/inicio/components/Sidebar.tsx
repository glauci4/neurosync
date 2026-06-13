// app/inicio/components/Sidebar.tsx
// Barra lateral de navegação com suporte a recolhimento (collapsible), quando recolhida mostra apenas os ícones e quando expandida mostra ícones + texto

"use client";

// Biblioteca para animações suaves
import { motion } from "framer-motion";
// Ícones utilizados na sidebar
import {
  BarChart3, // Ícone para Relatórios
  Bell, // Ícone para Notificações
  Calendar, // Ícone para Agenda
  CalendarCog, // Ícone para Funcionamento
  ChevronDown, // Ícone para expandir/recolher submenus
  ChevronLeft, // Ícone para recolher a sidebar (seta para esquerda)
  ChevronRight, // Ícone para expandir a sidebar (seta para direita)
  DoorOpen, // Ícone para Salas (submenu)
  FileText, // Ícone para Prontuário (apenas psicólogo)
  Home, // Ícone para Início (casinha)
  LogOut, // Ícone para Sair
  Settings, // Ícone para Configurações
  User, // Ícone para Perfil Profissional
  Users, // Ícone para Pacientes
} from "lucide-react";
// Componente otimizado de imagem do Next.js
import Image from "next/image";
// Hooks do Next para navegação e leitura da rota atual
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CiHospital1 } from "react-icons/ci";
import { MdOutlineMeetingRoom } from "react-icons/md";
import { PiUsersThreeBold } from "react-icons/pi";
import { RiShieldFill } from "react-icons/ri";
// Hook personalizado para acessar o estado da sidebar
import { useSidebar } from "@/app/context/SidebarContext";
import { useContadorNotificacoes } from "@/app/notificacoes/hooks/useNotificacoes";

// Tipagem do usuário autenticado
interface UsuarioType {
  id: number;
  nome: string;
  email: string;
  perfil: string;
  perfil_id: number;
  avatar_url?: string | null;
  isAdminClinica?: boolean;
  isResponsavelClinica?: boolean;
}

// Props esperadas pelo componente Sidebar
interface SidebarProps {
  perfilId: number;
  onLogout: () => void;
  usuario: UsuarioType | null;
}

// Submenu da aba Relatórios (mantém as categorias já existentes no módulo)
const subItensRelatorios = [
  {
    nome: "Relatório Geral",
    href: "/relatorios?categoria=visao_geral",
    icone: BarChart3,
  },
  {
    nome: "Relatório da Agenda",
    href: "/relatorios?categoria=agenda",
    icone: Calendar,
  },
  {
    nome: "Relatório de Pacientes",
    href: "/relatorios?categoria=pacientes",
    icone: Users,
  },
  {
    nome: "Relatório de Salas",
    href: "/relatorios?categoria=salas",
    icone: DoorOpen,
  },
];

function montarSubItensConfiguracoes(permitirUsuariosSistema: boolean) {
  return [
    {
      nome: "Clínica",
      href: "/configuracoes?secao=clinica",
      icone: CiHospital1,
    },
    ...(permitirUsuariosSistema
      ? [
          {
            nome: "Usuários do Sistema",
            href: "/configuracoes?secao=usuarios",
            icone: PiUsersThreeBold,
          },
        ]
      : []),
    {
      nome: "Funcionamento",
      href: "/configuracoes?secao=funcionamento",
      icone: CalendarCog,
    },
    {
      nome: "Salas",
      href: "/configuracoes?secao=salas",
      icone: MdOutlineMeetingRoom,
    },
    {
      nome: "Perfil Profissional",
      href: "/configuracoes?secao=perfil",
      icone: User,
    },
    {
      nome: "Segurança",
      href: "/configuracoes?secao=seguranca",
      icone: RiShieldFill,
    },
  ];
}

export default function Sidebar({ perfilId, onLogout, usuario }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Obtém o estado da sidebar do contexto
  const { isCollapsed, toggleSidebar } = useSidebar();

  // Verifica se o usuário é psicólogo (perfilId = 2)
  const isPsicologo = perfilId === 2;

  // Dados do usuário (com fallback para estado de carregamento)
  const nomeUsuario = usuario?.nome || "Carregando...";
  const inicialUsuario = nomeUsuario.charAt(0).toUpperCase();
  const textoPerfil = isPsicologo ? "Psicólogo(a)" : "Secretária";
  const usuarioEhResponsavelClinica = Boolean(
    usuario?.isResponsavelClinica ?? usuario?.isAdminClinica,
  );
  const subItensConfiguracoes = montarSubItensConfiguracoes(
    usuarioEhResponsavelClinica,
  );
  const { data: notificacoesNaoLidas = 0 } = useContadorNotificacoes(
    Boolean(usuario),
  );

  // Verifica se a rota atual está ativa
  const isAtivo = (href: string) => {
    const destino = new URL(href, "http://localhost");
    return pathname === destino.pathname;
  };

  const isSubItemAtivo = (href: string) => {
    const destino = new URL(href, "http://localhost");
    if (pathname !== destino.pathname) return false;

    const entradas = Array.from(destino.searchParams.entries());
    if (entradas.length === 0) return true;

    return entradas.every(
      ([chave, valor]) => searchParams.get(chave) === valor,
    );
  };

  const isSubmenuAtivo = (subItens: { href: string }[]) =>
    subItens.some((sub) => isSubItemAtivo(sub.href));

  // Largura da sidebar baseada no estado (recolhida: w-20 = 5rem, expandida: w-64 = 16rem)
  const sidebarWidth = isCollapsed ? "w-20" : "w-64";

  // Classe para esconder texto quando recolhido
  const textClass = isCollapsed ? "hidden" : "block";

  const [menusAbertos, setMenusAbertos] = useState({
    relatorios: true,
    configuracoes: true,
  });

  useEffect(() => {
    setMenusAbertos((atual) => ({
      ...atual,
      relatorios: pathname.startsWith("/relatorios"),
      configuracoes: pathname.startsWith("/configuracoes"),
    }));
  }, [pathname]);

  // DEFINIÇÃO DOS ITENS DO MENU POR PERFIL

  // Itens do menu para SECRETÁRIA (perfilId = 1)
  // Ordem: Início, Agenda, Pacientes, Relatórios, Notificações, Configurações
  const itensSecretaria = [
    { nome: "Início", href: "/inicio", icone: Home },
    { nome: "Agenda", href: "/agenda", icone: Calendar },
    { nome: "Pacientes", href: "/pacientes", icone: Users },
    { nome: "Relatórios", href: "/relatorios", icone: BarChart3 },
    { nome: "Notificações", href: "/notificacoes", icone: Bell },
    { nome: "Configurações", href: "/configuracoes", icone: Settings },
  ];

  // Itens do menu para PSICÓLOGO (perfilId = 2)
  // Ordem: Início, Agenda, Pacientes, Prontuário, Relatórios, Notificações, Configurações
  const itensPsicologo = [
    { nome: "Início", href: "/inicio", icone: Home },
    { nome: "Agenda", href: "/agenda", icone: Calendar },
    { nome: "Pacientes", href: "/pacientes", icone: Users },
    { nome: "Prontuário", href: "/prontuario", icone: FileText },
    { nome: "Relatórios", href: "/relatorios", icone: BarChart3 },
    { nome: "Notificações", href: "/notificacoes", icone: Bell },
    { nome: "Configurações", href: "/configuracoes", icone: Settings },
  ];

  // Seleciona a lista de itens correta baseada no perfil do usuário
  const itensMenu = isPsicologo ? itensPsicologo : itensSecretaria;

  const alternarMenu = (menu: keyof typeof menusAbertos) => {
    setMenusAbertos((atual) => ({
      ...atual,
      [menu]: !atual[menu],
    }));
  };

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`
        fixed left-0 top-0 h-screen ${sidebarWidth}
        bg-gradient-to-b from-[#D6C4E8] to-[#9F64AF] 
        shadow-xl flex flex-col z-10 transition-all duration-300
      `}
    >
      {/* HEADER DA SIDEBAR (Logo e botão de recolher) */}
      <div className="pt-4 pb-3 px-3">
        <div className="flex items-center justify-between">
          {/* Logo e nome do sistema (escondido quando recolhido) */}
          <div
            className={`flex items-center gap-2 ${isCollapsed ? "justify-center w-full" : ""}`}
          >
            <div className="w-10 h-10 relative flex-shrink-0">
              <Image
                src="/logo.png"
                alt="NeuroSync Logo"
                width={40}
                height={40}
                className="object-contain rounded-md shadow-md"
              />
            </div>

            {/* Nome do sistema (só aparece quando expandido) */}
            <div className={`${textClass} flex flex-col`}>
              <h1
                className="text-lg font-extrabold text-[#9F64AF] leading-tight"
                style={{ fontFamily: "Pacifico, cursive" }}
              >
                NeuroSync
              </h1>
            </div>
          </div>

          {/* Botão de recolher (aparece apenas quando NÃO está recolhido) */}
          {!isCollapsed && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              title="Recolher menu"
            >
              <ChevronLeft size={18} className="text-white" />
            </button>
          )}
        </div>
      </div>

      {/* BOTÃO DE EXPANDIR (aparece APENAS quando está recolhido) */}
      {isCollapsed && (
        <div className="flex justify-center mt-2 mb-2">
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Expandir menu"
          >
            <ChevronRight size={18} className="text-white" />
          </button>
        </div>
      )}

      {/* MENU PRINCIPAL */}
      <nav className="sidebar-scrollbar flex-1 py-4 px-2 overflow-y-auto">
        <ul className="space-y-1">
          {itensMenu.map((item) => {
            const Icone = item.icone;
            const mostrarBadgeNotificacoes =
              item.nome === "Notificações" && notificacoesNaoLidas > 0;
            const temSubmenu =
              item.nome === "Relatórios" || item.nome === "Configurações";
            const submenuRelatoriosAtivo = isSubmenuAtivo(subItensRelatorios);
            const submenuConfiguracoesAtivo = isSubmenuAtivo(
              subItensConfiguracoes,
            );
            const ativo =
              isAtivo(item.href) ||
              (item.nome === "Relatórios" && submenuRelatoriosAtivo) ||
              (item.nome === "Configurações" && submenuConfiguracoesAtivo);
            const submenuAberto =
              (item.nome === "Relatórios" && menusAbertos.relatorios) ||
              (item.nome === "Configurações" && menusAbertos.configuracoes);

            return (
              <li key={item.nome}>
                <div className="flex items-stretch gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      temSubmenu
                        ? alternarMenu(
                            item.nome === "Relatórios"
                              ? "relatorios"
                              : "configuracoes",
                          )
                        : router.push(item.href)
                    }
                    className={`
                      relative flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl transition
                      ${
                        ativo
                          ? "bg-white/20 text-white shadow-md"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      }
                      ${isCollapsed ? "justify-center" : ""}
                    `}
                    title={isCollapsed ? item.nome : ""}
                    aria-expanded={temSubmenu ? submenuAberto : undefined}
                  >
                    <Icone size={isCollapsed ? 20 : 18} />
                    <span className={`text-sm font-medium ${textClass}`}>
                      {item.nome}
                    </span>
                    {mostrarBadgeNotificacoes ? (
                      <span
                        className={`flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-bold text-[#7A3F88] shadow-sm ${
                          isCollapsed ? "absolute right-1 top-1" : "ml-auto"
                        }`}
                      >
                        {notificacoesNaoLidas > 99
                          ? "99+"
                          : notificacoesNaoLidas}
                      </span>
                    ) : null}
                    {temSubmenu && !isCollapsed ? (
                      <ChevronDown
                        size={16}
                        className={`ml-auto shrink-0 pointer-events-none transition-transform ${
                          submenuAberto ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                </div>

                {/* Submenu RELATÓRIOS (só aparece quando expandido) */}
                {!isCollapsed &&
                  item.nome === "Relatórios" &&
                  submenuAberto &&
                  (submenuRelatoriosAtivo || menusAbertos.relatorios) && (
                    <div className="ml-8 mt-1 space-y-1">
                      {subItensRelatorios.map((sub) => {
                        const ativoSub = isSubItemAtivo(sub.href);

                        return (
                          <button
                            type="button"
                            key={sub.nome}
                            onClick={() => router.push(sub.href)}
                            className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition ${
                              ativoSub
                                ? "bg-white/15 text-white shadow-sm"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <sub.icone
                              size={14}
                              className={
                                ativoSub ? "text-white" : "text-white/75"
                              }
                            />
                            {sub.nome}
                          </button>
                        );
                      })}
                    </div>
                  )}

                {/* Submenu CONFIGURAÇÕES (só aparece quando expandido) */}
                {!isCollapsed &&
                  item.nome === "Configurações" &&
                  submenuAberto &&
                  (submenuConfiguracoesAtivo || menusAbertos.configuracoes) && (
                    <div className="ml-8 mt-1 space-y-1">
                      {subItensConfiguracoes.map((sub) => {
                        const ativoSub = isSubItemAtivo(sub.href);

                        return (
                          <button
                            type="button"
                            key={sub.nome}
                            onClick={() => router.push(sub.href)}
                            className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition ${
                              ativoSub
                                ? "bg-white/15 text-white shadow-sm"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <sub.icone
                              size={14}
                              className={
                                ativoSub ? "text-white" : "text-white/75"
                              }
                            />
                            {sub.nome}
                          </button>
                        );
                      })}
                    </div>
                  )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* RODAPÉ (Informações do usuário e logout) */}
      <div className="p-3 border-t border-white/20">
        {/* Dados do usuário (só aparece quando expandido) */}
        {!isCollapsed && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 overflow-hidden rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              {usuario?.avatar_url ? (
                <Image
                  src={usuario.avatar_url}
                  alt={nomeUsuario}
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{inicialUsuario}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-semibold truncate">
                {nomeUsuario}
              </p>
              <p className="text-[10px] text-white/70">{textoPerfil}</p>
            </div>
          </div>
        )}

        {/* Avatar simplificado quando recolhido */}
        {isCollapsed && (
          <div className="flex justify-center mb-3">
            <div className="w-8 h-8 overflow-hidden rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              {usuario?.avatar_url ? (
                <Image
                  src={usuario.avatar_url}
                  alt={nomeUsuario}
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{inicialUsuario}</span>
              )}
            </div>
          </div>
        )}

        {/* Botão Sair */}
        <button
          type="button"
          onClick={onLogout}
          className={`
            w-full flex items-center gap-3 px-3 py-2 rounded-xl 
            text-white/80 hover:bg-white/10 hover:text-white transition
            ${isCollapsed ? "justify-center" : ""}
          `}
          title={isCollapsed ? "Sair" : ""}
        >
          <LogOut size={isCollapsed ? 18 : 16} />
          <span className={`text-sm ${textClass}`}>Sair</span>
        </button>
      </div>
    </motion.aside>
  );
}
