// app/layout.tsx
// Arquivo de layout principal que envolve todas as páginas, importando as fontes e configurações globais

import './globals.css'; // Importa o arquivo global de estilos
import type { Metadata } from 'next'; 

// Importando a fonte Pacifico do Google Fonts via CSS, esta fonte será usada apenas para o título NeuroSync
export const metadata: Metadata = {
  title: 'NeuroSync',
description: 'Plataforma de agendamento integrada para psicólogos',
};

export default function RootLayourt({ 
  children,
}: {
  children: React.ReactNode;  
}) {    
  return (
    <html lang="pt-BR">
      <head>
        {/*Importação da fonte Pacifico do Google Fonts para uso apenas do nome NeuroSync*/}
         <link 
          href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap" 
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
