// app/configuracoes/page.tsx
// Página de configurações com navegação interna controlada pela sidebar.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarCog, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CiHospital1 } from "react-icons/ci";
import { MdOutlineMeetingRoom, MdOutlineRoomPreferences } from "react-icons/md";
import { PiUsersThreeBold } from "react-icons/pi";
import { RiShieldFill } from "react-icons/ri";
import { useSidebar } from "@/app/context/SidebarContext";
import Sidebar from "@/app/inicio/components/Sidebar";
import { useAutenticacao } from "@/hooks/useAutenticacao";
import { useClinica } from "./clinica/hooks/useClinica";
import Clinica from "./components/Clinica";
import Funcionamento from "./components/Funcionamento";
import PerfilProfissional from "./components/PerfilProfissional";
import Seguranca from "./components/Seguranca";
import Salas from "./salas/components/Salas";
import AcessoNegadoUsuarios from "./usuarios/components/AcessoNegadoUsuarios";
import UsuariosSistemaPage from "./usuarios/page";

// ---- Constantes com descrições que começam por "Gerencie" ----
const categoriasLabel: Record<string, string> = {
  perfil: "Perfil Profissional",
  clinica: "Clínica",
  funcionamento: "Funcionamento",
  salas: "Salas",
  usuarios: "Usuários do Sistema",
  seguranca: "Segurança",
};

const categoriasDesc: Record<string, string> = {
  perfil:
    "Atualize seus dados de acesso e personalize sua identificação no sistema.",
  clinica: "Gerencie os dados cadastrais da clínica, endereço e contato",
  funcionamento:
    "Configure horários, exceções, férias, bloqueios e acompanhe o calendário de disponibilidade da clínica.",
  salas: "Gerencie as salas de atendimento da clínica",
  usuarios: "Gerencie os acessos dos profissionais vinculados à clínica.",
  seguranca: "Gerencie a alteração de senha e segurança da conta",
};

const categories = [
  {
    key: "perfil",
    label: categoriasLabel.perfil,
    icon: User,
    desc: categoriasDesc.perfil,
  },
  {
    key: "clinica",
    label: categoriasLabel.clinica,
    icon: CiHospital1,
    desc: categoriasDesc.clinica,
  },
  {
    key: "funcionamento",
    label: categoriasLabel.funcionamento,
    icon: CalendarCog,
    desc: categoriasDesc.funcionamento,
  },
  {
    key: "salas",
    label: categoriasLabel.salas,
    icon: MdOutlineRoomPreferences,
    desc: categoriasDesc.salas,
  },
  {
    key: "usuarios",
    label: categoriasLabel.usuarios,
    icon: PiUsersThreeBold,
    desc: categoriasDesc.usuarios,
  },
  {
    key: "seguranca",
    label: categoriasLabel.seguranca,
    icon: RiShieldFill,
    desc: categoriasDesc.seguranca,
  },
];

export default function ConfiguracoesPage() {
  const {
    usuario,
    estaAutenticado,
    carregando: authLoading,
    fazerLogout,
  } = useAutenticacao();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isCollapsed } = useSidebar();

  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("perfil");
  const [cabecalhoSalas, setCabecalhoSalas] = useState({
    titulo: categoriasLabel.salas,
    descricao: categoriasDesc.salas,
  });

  // ---- Autenticação ----
  useEffect(() => {
    if (!authLoading && !estaAutenticado) router.push("/");
  }, [authLoading, estaAutenticado, router]);

  const isPsicologo = usuario?.perfil_id === 2;
  const isResponsavelClinica = Boolean(
    usuario?.isResponsavelClinica ?? usuario?.isAdminClinica,
  );
  const isAdminClinica = isResponsavelClinica;
  const { data: clinicaQuery, isLoading: clinicaLoading } = useClinica(
    Boolean(usuario?.clinica_id),
  );
  const clinica = clinicaQuery?.data;
  const podeGerenciarUsuarios = isResponsavelClinica;
  const categoriasVisiveis = categories.filter((categoria) => {
    if (categoria.key === "usuarios") {
      return isResponsavelClinica;
    }
    return true;
  });

  useEffect(() => {
    const categoriaVisivel = categoriasVisiveis.some(
      (categoria) => categoria.key === categoriaAtiva,
    );

    if (!categoriaVisivel) {
      setCategoriaAtiva("perfil");
    }
  }, [categoriaAtiva, categoriasVisiveis]);

  useEffect(() => {
    const secaoUrl = searchParams.get("secao");
    if (!secaoUrl) return;

    const categoriaVisivel = categoriasVisiveis.some(
      (categoria) => categoria.key === secaoUrl,
    );

    if (categoriaVisivel && secaoUrl !== categoriaAtiva) {
      setCategoriaAtiva(secaoUrl);
    }
  }, [categoriaAtiva, categoriasVisiveis, searchParams]);

  useEffect(() => {
    document.body.classList.add("configuracoes-theme-active");
    return () => {
      document.body.classList.remove("configuracoes-theme-active");
    };
  }, []);

  // ---- Loading e erros ----
  if (authLoading || clinicaLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0]">
        <div className="w-10 h-10 border-4 border-[#9F64AF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!usuario) return null;

  // ---- Conteúdo da categoria (renderização condicional) ----
  const renderConteudo = () => {
    switch (categoriaAtiva) {
      case "perfil":
        return <PerfilProfissional isPsicologo={isPsicologo} />;
      case "clinica":
        return <Clinica podeEditar={podeGerenciarUsuarios} />;
      case "funcionamento":
        return (
          <Funcionamento
            podeEditar={isAdminClinica}
            cnpjClinica={clinica?.cnpj || ""}
            cidadeClinica={clinica?.cidade || ""}
            ufClinica={clinica?.estado || ""}
          />
        );
      case "salas":
        return (
          <Salas
            podeEditar={isAdminClinica}
            onCabecalhoChange={setCabecalhoSalas}
          />
        );
      case "usuarios":
        return podeGerenciarUsuarios ? (
          <UsuariosSistemaPage podeGerenciar={podeGerenciarUsuarios} />
        ) : (
          <AcessoNegadoUsuarios />
        );
      case "seguranca":
        return <Seguranca />;
      default:
        return null;
    }
  };

  const activeCat =
    categoriasVisiveis.find((c) => c.key === categoriaAtiva) ||
    categoriasVisiveis[0];
  const tituloPagina =
    categoriaAtiva === "salas" ? cabecalhoSalas.titulo : activeCat.label;
  const descricaoPagina =
    categoriaAtiva === "salas"
      ? cabecalhoSalas.descricao
      : categoriasDesc[categoriaAtiva];
  // Ícone do título contextual: Salas usa o ícone operacional do módulo,
  // enquanto o seletor superior mantém o ícone de preferências.
  const IconeTitulo =
    categoriaAtiva === "salas" ? MdOutlineMeetingRoom : activeCat.icon;

  // ---- Layout principal com margem dinâmica da Sidebar ----
  const contentMargin = isCollapsed ? "ml-20" : "ml-64";

  return (
    <div className="configuracoes-theme min-h-screen">
      <Sidebar
        perfilId={usuario.perfil_id || 1}
        onLogout={fazerLogout}
        usuario={usuario}
      />

      <div className={`${contentMargin} configuracoes-content`}>
        {/* Cabeçalho com o título da seção selecionada na sidebar. */}
        <div className="pt-8 px-8 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <IconeTitulo className="h-6 w-6 text-[#9F64AF]" />
              <h1 className="text-2xl font-bold text-gray-800">
                {tituloPagina}
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">{descricaoPagina}</p>
          </div>
        </div>

        {/* Conteúdo principal – envolto em um main com paddings laterais e centralização */}
        <main className="px-8 pb-8">
          <div
            className={
              categoriaAtiva === "salas" || categoriaAtiva === "usuarios"
                ? "max-w-none"
                : "max-w-4xl mx-auto"
            }
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={categoriaAtiva}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderConteudo()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
