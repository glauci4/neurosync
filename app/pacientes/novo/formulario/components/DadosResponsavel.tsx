// app/pacientes/novo/formulario/components/DadosResponsavel.tsx
'use client';

import { MdErrorOutline } from 'react-icons/md';

interface DadosResponsavelProps {
    responsavel: {
        nome: string;
        cpf: string;
        telefone: string;
        grau_parentesco: string;
        mesmo_endereco_paciente: boolean;
        sem_numero?: boolean;
        cep: string;
        rua: string;
        numero: string;
        complemento: string;
        bairro: string;
        cidade: string;
        estado: string;
    };
    setResponsavel: (data: any) => void;
    erros: {
        nome: string;
        cpf: string;
        telefone: string;
        grau: string;
        rua: string;
        numero: string;
        bairro: string;
        cidade: string;
        estado: string;
        cep?: string;
    };
    onMesmoEnderecoChange: (checked: boolean) => void;
}

export default function DadosResponsavel({
    responsavel,
    setResponsavel,
    erros,
    onMesmoEnderecoChange,
}: DadosResponsavelProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setResponsavel((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSemNumeroChange = (checked: boolean) => {
        setResponsavel((prev: any) => ({
            ...prev,
            sem_numero: checked,
            numero: checked ? '' : prev.numero,
        }));
    };

    return (
        <div className="border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Dados do Responsável Legal <span className="text-red-500">*</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo <span className="text-red-500">*</span></label>
                    <input type="text" name="nome" value={responsavel.nome} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800" />
                    {erros.nome && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdErrorOutline size={14} />{erros.nome}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CPF <span className="text-red-500">*</span></label>
                    <input type="text" name="cpf" value={responsavel.cpf} onChange={handleChange} placeholder="000.000.000-00" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800" />
                    {erros.cpf && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdErrorOutline size={14} />{erros.cpf}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone <span className="text-red-500">*</span></label>
                    <input type="tel" name="telefone" value={responsavel.telefone} onChange={handleChange} placeholder="(00) 00000-0000" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800" />
                    {erros.telefone && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdErrorOutline size={14} />{erros.telefone}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grau de parentesco <span className="text-red-500">*</span></label>
                    <input type="text" name="grau_parentesco" value={responsavel.grau_parentesco} onChange={handleChange} placeholder="Ex: Pai, Mãe, Avô" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800" />
                    {erros.grau && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdErrorOutline size={14} />{erros.grau}</p>}
                </div>
                <div className="col-span-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={responsavel.mesmo_endereco_paciente} onChange={(e) => onMesmoEnderecoChange(e.target.checked)} className="rounded border-gray-300 text-[#9F64AF] focus:ring-[#9F64AF] accent-[#9F64AF]" />
                        O responsável possui o mesmo endereço que o paciente
                    </label>
                </div>
            </div>

            {!responsavel.mesmo_endereco_paciente && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                    <h4 className="text-md font-semibold text-gray-800 mb-3">Endereço do Responsável</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CEP <span className="text-red-500">*</span></label>
                            <input type="text" name="cep" value={responsavel.cep} onChange={handleChange} placeholder="00000-000" className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800 ${erros.cep ? 'border-red-500' : 'border-gray-300'}`} />
                            {erros.cep && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdErrorOutline size={14} />{erros.cep}</p>}
                            <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener noreferrer" className="text-xs text-[#9F64AF] hover:underline mt-1 inline-block">Responsável não sabe o CEP?</a>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rua <span className="text-red-500">*</span></label>
                            <input type="text" name="rua" value={responsavel.rua} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800" />
                            {erros.rua && <p className="text-red-500 text-xs mt-1"><MdErrorOutline size={14} />{erros.rua}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Número {!responsavel.sem_numero && <span className="text-red-500">*</span>}</label>
                            <input type="text" name="numero" value={responsavel.numero} onChange={handleChange} disabled={responsavel.sem_numero === true} placeholder="Ex: 123" className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800 ${erros.numero ? 'border-red-500' : 'border-gray-300'} disabled:bg-gray-100`} />
                            <label className="flex items-center gap-1 text-sm text-gray-600 mt-1"><input type="checkbox" checked={responsavel.sem_numero || false} onChange={(e) => handleSemNumeroChange(e.target.checked)} className="rounded border-gray-300 text-[#9F64AF] focus:ring-[#9F64AF] accent-[#9F64AF]" />Sem número</label>
                            {erros.numero && <p className="text-red-500 text-xs mt-1"><MdErrorOutline size={14} />{erros.numero}</p>}
                        </div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label><input type="text" name="complemento" value={responsavel.complemento} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800" /></div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bairro <span className="text-red-500">*</span></label>
                            <input type="text" name="bairro" value={responsavel.bairro} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800" />
                            {erros.bairro && <p className="text-red-500 text-xs mt-1"><MdErrorOutline size={14} />{erros.bairro}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade <span className="text-red-500">*</span></label>
                            <input type="text" name="cidade" value={responsavel.cidade} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800" />
                            {erros.cidade && <p className="text-red-500 text-xs mt-1"><MdErrorOutline size={14} />{erros.cidade}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado <span className="text-red-500">*</span></label>
                            <input type="text" name="estado" value={responsavel.estado} onChange={handleChange} maxLength={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800 uppercase" />
                            {erros.estado && <p className="text-red-500 text-xs mt-1"><MdErrorOutline size={14} />{erros.estado}</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}