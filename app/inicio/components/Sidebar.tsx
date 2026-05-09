// app/inicio/components/Sidebar.tsx
// Barra lateral de navegação com suporte a recolhimento (collapsible), quando recolhida mostra apenas os ícones e quando expandida mostra ícones + texto

'use client';

// Hooks do Next para navegação e leitura da rota atual
import { usePathname, useRouter } from 'next/navigation';

// Biblioteca para animações suaves
import { motion } from 'framer-motion';

// Componente otimizado de imagem do Next.js
import Image from 'next/image';

// Ícones utilizados na sidebar
import { 
  Home,              // Ícone para Início (casinha)
  Calendar,          // Ícone para Agenda
  Users,             // Ícone para Pacientes
  FileText,          // Ícone para Prontuário (apenas psicólogo)
  BarChart3,         // Ícone para Relatórios
  Bell,              // Ícone para Notificações
  Settings,          // Ícone para Configurações
  UserPlus,          // Ícone para Novo Paciente (submenu)
  Upload,            // Ícone para Importar Dados (submenu)
  DoorOpen,          // Ícone para Salas (submenu)
  LogOut,            // Ícone para Sair
  ChevronLeft,       // Ícone para recolher a sidebar (seta para esquerda)
  ChevronRight       // Ícone para expandir a sidebar (seta para direita)
} from 'lucide-react';

// Hook personalizado para acessar o estado da sidebar
import { useSidebar } from '@/app/context/SidebarContext';

// Tipagem do usuário autenticado
interface UsuarioType {
  id: number;
  nome: string;
  email: string;
  perfil: string;
  perfil_id: number;
}

// Props esperadas pelo componente Sidebar
interface SidebarProps {
  perfilId: number;
  onLogout: () => void;
  usuario: UsuarioType | null;
}

// Submenu da aba Pacientes (comum para ambos os perfis)
// O caminho para novo paciente agora utiliza parâmetro de consulta para abrir o modal na página de listagem
const subItensPacientes = [
  { nome: 'Importar Dados', href: '/pacientes/importar', icone: Upload },
  { nome: 'Novo Paciente', href: '/pacientes?cadastrar=1', icone: UserPlus },
];

// Submenu da aba Agenda (comum para ambos os perfis)
const subItensAgenda = [
  { nome: 'Salas', href: '/agenda/salas', icone: DoorOpen },
];

// Item exclusivo para psicólogo (aparece apenas no menu do psicólogo)
const itemPsicologo = { nome: 'Prontuário', href: '/prontuario', icone: FileText };

export default function Sidebar({ perfilId, onLogout, usuario }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Obtém o estado da sidebar do contexto
  const { isCollapsed, toggleSidebar } = useSidebar();

  // Verifica se o usuário é psicólogo (perfilId = 2)
  const isPsicologo = perfilId === 2;

  // Dados do usuário (com fallback para estado de carregamento)
  const nomeUsuario = usuario?.nome || 'Carregando...';
  const inicialUsuario = nomeUsuario.charAt(0).toUpperCase();
  const textoPerfil = isPsicologo ? 'Psicólogo(a)' : 'Secretária';

  // Verifica se a rota atual está ativa
  const isAtivo = (href: string) => pathname === href;
  const isSubmenuAtivo = (subItens: { href: string }[]) => 
    subItens.some(sub => pathname === sub.href);

  // Largura da sidebar baseada no estado (recolhida: w-20 = 5rem, expandida: w-64 = 16rem)
  const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';
  
  // Classe para esconder texto quando recolhido
  const textClass = isCollapsed ? 'hidden' : 'block';

  // DEFINIÇÃO DOS ITENS DO MENU POR PERFIL
  
  // Itens do menu para SECRETÁRIA (perfilId = 1)
  // Ordem: Início, Agenda, Pacientes, Relatórios, Notificações, Configurações
  const itensSecretaria = [
    { nome: 'Início', href: '/inicio', icone: Home },
    { nome: 'Agenda', href: '/agenda', icone: Calendar },
    { nome: 'Pacientes', href: '/pacientes', icone: Users },
    { nome: 'Relatórios', href: '/relatorios', icone: BarChart3 },
    { nome: 'Notificações', href: '/notificacoes', icone: Bell },
    { nome: 'Configurações', href: '/configuracoes', icone: Settings },
  ];

  // Itens do menu para PSICÓLOGO (perfilId = 2)
  // Ordem: Início, Agenda, Pacientes, Prontuário, Relatórios, Notificações, Configurações
  const itensPsicologo = [
    { nome: 'Início', href: '/inicio', icone: Home },
    { nome: 'Agenda', href: '/agenda', icone: Calendar },
    { nome: 'Pacientes', href: '/pacientes', icone: Users },
    { nome: 'Prontuário', href: '/prontuario', icone: FileText },
    { nome: 'Relatórios', href: '/relatorios', icone: BarChart3 },
    { nome: 'Notificações', href: '/notificacoes', icone: Bell },
    { nome: 'Configurações', href: '/configuracoes', icone: Settings },
  ];

  // Seleciona a lista de itens correta baseada no perfil do usuário
  const itensMenu = isPsicologo ? itensPsicologo : itensSecretaria;

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
          <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center w-full' : ''}`}>
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
                style={{ fontFamily: 'Pacifico, cursive' }}
              >
                NeuroSync
              </h1>
            </div>
          </div>

          {/* Botão de recolher (aparece apenas quando NÃO está recolhido) */}
          {!isCollapsed && (
            <button
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
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Expandir menu"
          >
            <ChevronRight size={18} className="text-white" />
          </button>
        </div>
      )}

      {/* MENU PRINCIPAL */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        <ul className="space-y-1">
          {itensMenu.map((item) => {
            const Icone = item.icone;
            const ativo = isAtivo(item.href);
            
            return (
              <li key={item.nome}>
                <button
                  onClick={() => router.push(item.href)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition
                    ${ativo
                      ? 'bg-white/20 text-white shadow-md'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'}
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                  title={isCollapsed ? item.nome : ''}
                >
                  <Icone size={isCollapsed ? 20 : 18} />
                  <span className={`text-sm font-medium ${textClass}`}>
                    {item.nome}
                  </span>
                </button>

                {/* Submenu PACIENTES (só aparece quando expandido) */}
                {!isCollapsed && item.nome === 'Pacientes' && isSubmenuAtivo(subItensPacientes) && (
                  <div className="ml-8 mt-1 space-y-1">
                    {subItensPacientes.map((sub) => (
                      <button
                        key={sub.nome}
                        onClick={() => router.push(sub.href)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-white/70 hover:text-white"
                      >
                        <sub.icone size={14} />
                        {sub.nome}
                      </button>
                    ))}
                  </div>
                )}

                {/* Submenu AGENDA (só aparece quando expandido) */}
                {!isCollapsed && item.nome === 'Agenda' && isSubmenuAtivo(subItensAgenda) && (
                  <div className="ml-8 mt-1 space-y-1">
                    {subItensAgenda.map((sub) => (
                      <button
                        key={sub.nome}
                        onClick={() => router.push(sub.href)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-white/70 hover:text-white"
                      >
                        <sub.icone size={14} />
                        {sub.nome}
                      </button>
                    ))}
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
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              {inicialUsuario}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-semibold truncate">{nomeUsuario}</p>
              <p className="text-[10px] text-white/70">{textoPerfil}</p>
            </div>
          </div>
        )}

        {/* Avatar simplificado quando recolhido */}
        {isCollapsed && (
          <div className="flex justify-center mb-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              {inicialUsuario}
            </div>
          </div>
        )}

        {/* Botão Sair */}
        <button
          onClick={onLogout}
          className={`
            w-full flex items-center gap-3 px-3 py-2 rounded-xl 
            text-white/80 hover:bg-white/10 hover:text-white transition
            ${isCollapsed ? 'justify-center' : ''}
          `}
          title={isCollapsed ? 'Sair' : ''}
        >
          <LogOut size={isCollapsed ? 18 : 16} />
          <span className={`text-sm ${textClass}`}>Sair</span>
        </button>
      </div>
    </motion.aside>
  );
}