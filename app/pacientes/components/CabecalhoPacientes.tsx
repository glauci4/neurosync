// app/pacientes/components/CabecalhoPacientes.tsx
// Componente de cabeçalho da página de pacientes.

'use client';

interface CabecalhoPacientesProps {
    status: 'ativo' | 'inativo' | 'todos';
}

export default function CabecalhoPacientes({ status }: CabecalhoPacientesProps) {
    let titulo = '';
    let descricao = '';

    // Define título e descrição conforme o status de visibilidade
    if (status === 'ativo') {
        titulo = 'Pacientes Ativos';
        descricao = 'Gerencie os cadastros de pacientes ativos da sua clínica';
    } else if (status === 'inativo') {
        titulo = 'Pacientes Inativos';
        descricao = 'Gerencie os cadastros de pacientes inativos da sua clínica';
    } else {
        // status === 'todos'
        titulo = 'Todos os Pacientes';
        descricao = 'Visualize todos os pacientes cadastrados na clínica';
    }

    return (
        <div className="mb-3 px-0">
            <h1 className="text-2xl font-semibold text-gray-800">
                {titulo}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
                {descricao}
            </p>
        </div>
    );
}