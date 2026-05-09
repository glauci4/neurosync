// app/pacientes/novo/formulario/components/DadosPaciente.tsx
'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
import { MdErrorOutline } from 'react-icons/md';
import { useVerificarCpf } from '@/hooks/useVerificarCpf'; // verificação em tempo real

interface DadosPacienteProps {
    formData: any;
    setFormData: (data: any) => void;
    tipo: 'adulto' | 'menor';
    telefoneObrigatorio?: boolean;
    telefoneAlternativoObrigatorio?: boolean;
    erroIdade?: string;
    erroCpfApi?: string;      // mensagem de CPF duplicado vinda da API (submit)
    erroTelefoneApi?: string;
    onCpfChange?: () => void;
    pacienteId?: number;      // opcional: ID do paciente na edição, para ignorar o próprio CPF
}

export interface DadosPacienteRef {
    validar: () => boolean;
}

// Funções auxiliares (CPF, formatação)
function validarCPF(cpf: string): boolean {
    const cpfNumeros = cpf.replace(/\D/g, '');
    if (cpfNumeros.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpfNumeros)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpfNumeros.charAt(i)) * (10 - i);
    let resto = 11 - (soma % 11);
    let digito1 = resto >= 10 ? 0 : resto;
    if (digito1 !== parseInt(cpfNumeros.charAt(9))) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpfNumeros.charAt(i)) * (11 - i);
    resto = 11 - (soma % 11);
    let digito2 = resto >= 10 ? 0 : resto;
    return digito2 === parseInt(cpfNumeros.charAt(10));
}

function formatarCPF(valor: string): string {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 3) return numeros;
    if (numeros.length <= 6) return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
    if (numeros.length <= 9) return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9, 11)}`;
}

function formatarTelefone(valor: string): string {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 6) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    if (numeros.length <= 10) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
}

const DadosPaciente = forwardRef<DadosPacienteRef, DadosPacienteProps>(
    ({ formData, setFormData, tipo, telefoneObrigatorio = true, telefoneAlternativoObrigatorio = false, erroIdade, erroCpfApi, erroTelefoneApi, onCpfChange, pacienteId }, ref) => {
        const [errors, setErrors] = useState<{
            cpf?: string;
            cep?: string;
            rua?: string;
            numero?: string;
            bairro?: string;
            cidade?: string;
            estado?: string;
            nome?: string;
            data_nascimento?: string;
            telefone?: string;
            telefone_alternativo?: string;
            genero?: string;
            raca_etnia?: string;
            email?: string;
        }>({});
        const [buscandoCep, setBuscandoCep] = useState(false);

        // Verificação de CPF duplicado em tempo real
        const { data: cpfJaExiste, isLoading: verificandoCpf } = useVerificarCpf(formData.cpf, pacienteId);

        // Busca CEP e preenche endereço automaticamente (sem obrigatoriedade, apenas para facilitar o preenchimento)
        const buscarEnderecoPorCep = async () => {
            const cep = formData.cep?.replace(/\D/g, '');
            if (!cep || cep.length !== 8) {
                setErrors(prev => ({ ...prev, cep: 'CEP inválido (8 dígitos)' }));
                return;
            }
            setBuscandoCep(true);
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await res.json();
                if (data.erro) {
                    setErrors(prev => ({ ...prev, cep: 'CEP não encontrado' }));
                    return;
                }
                setFormData({
                    ...formData,
                    rua: data.logradouro || '',
                    bairro: data.bairro || '',
                    cidade: data.localidade || '',
                    estado: data.uf || '',
                });
                setErrors(prev => ({
                    ...prev,
                    cep: undefined,
                    rua: undefined,
                    bairro: undefined,
                    cidade: undefined,
                    estado: undefined,
                }));
            } catch {
                setErrors(prev => ({ ...prev, cep: 'Erro ao buscar CEP' }));
            } finally {
                setBuscandoCep(false);
            }
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            const { name, value, type } = e.target;
            const checked = (e.target as HTMLInputElement).checked;
            setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
            if (errors[name as keyof typeof errors]) {
                setErrors(prev => ({ ...prev, [name]: undefined }));
            }
            if (name === 'cpf' && onCpfChange) {
                onCpfChange();
            }
        };

        // Validações individuais 
        const handleNomeBlur = () => {
            if (!formData.nome?.trim()) {
                setErrors(prev => ({ ...prev, nome: 'Nome completo é obrigatório' }));
            } else {
                setErrors(prev => ({ ...prev, nome: undefined }));
            }
        };

        const handleDataNascimentoBlur = () => {
            if (!formData.data_nascimento) {
                setErrors(prev => ({ ...prev, data_nascimento: 'Data de nascimento é obrigatória' }));
            } else {
                setErrors(prev => ({ ...prev, data_nascimento: undefined }));
            }
        };

        // Validação de telefones (obrigatório e formato) 
        const handleTelefoneBlur = (field: 'telefone' | 'telefone_alternativo') => {
            const obrigatorio = field === 'telefone' ? telefoneObrigatorio : telefoneAlternativoObrigatorio;
            const numeros = formData[field]?.replace(/\D/g, '') || '';
            const estaVazio = numeros === '';

            if (obrigatorio && estaVazio) {
                setErrors(prev => ({ ...prev, [field]: `${field === 'telefone' ? 'Telefone' : 'Telefone alternativo'} é obrigatório (10 ou 11 dígitos)` }));
            } else if (!obrigatorio && estaVazio) {
                setErrors(prev => ({ ...prev, [field]: undefined }));
            } else if (!estaVazio && (numeros.length < 10 || numeros.length > 11)) {
                setErrors(prev => ({ ...prev, [field]: `${field === 'telefone' ? 'Telefone' : 'Telefone alternativo'} deve ter 10 ou 11 dígitos` }));
            } else {
                setErrors(prev => ({ ...prev, [field]: undefined }));
            }

            if (field === 'telefone_alternativo' && numeros) {
                const telefonePrincipal = formData.telefone?.replace(/\D/g, '') || '';
                if (telefonePrincipal && numeros === telefonePrincipal) {
                    setErrors(prev => ({ ...prev, telefone_alternativo: 'Telefone alternativo não pode ser igual ao telefone principal' }));
                }
            }

            const num = formData[field] || '';
            const nums = num.replace(/\D/g, '');
            if (nums.length >= 10) {
                setFormData({ ...formData, [field]: formatarTelefone(nums) });
            }
        };

        const handleCpfBlur = () => {
            const raw = formData.cpf || '';
            const numeros = raw.replace(/\D/g, '');
            if (tipo === 'adulto') {
                if (!numeros) {
                    setErrors(prev => ({ ...prev, cpf: 'CPF é obrigatório para paciente adulto' }));
                } else if (!validarCPF(numeros)) {
                    setErrors(prev => ({ ...prev, cpf: 'CPF inválido' }));
                } else {
                    setErrors(prev => ({ ...prev, cpf: undefined }));
                    setFormData({ ...formData, cpf: formatarCPF(numeros) });
                }
            } else {
                if (raw.trim() === '') {
                    setErrors(prev => ({ ...prev, cpf: undefined }));
                } else if (numeros.length !== 11 || !validarCPF(numeros)) {
                    setErrors(prev => ({ ...prev, cpf: 'CPF inválido' }));
                } else {
                    setErrors(prev => ({ ...prev, cpf: undefined }));
                    setFormData({ ...formData, cpf: formatarCPF(numeros) });
                }
            }
        };

        const handleGeneroBlur = () => {
            if (!formData.genero) {
                setErrors(prev => ({ ...prev, genero: 'Gênero é obrigatório' }));
            } else {
                setErrors(prev => ({ ...prev, genero: undefined }));
            }
        };

        const handleRacaEtniaBlur = () => {
            if (!formData.raca_etnia) {
                setErrors(prev => ({ ...prev, raca_etnia: 'Raça/Etnia é obrigatória' }));
            } else {
                setErrors(prev => ({ ...prev, raca_etnia: undefined }));
            }
        };

        const handleEmailBlur = () => {
            const email = formData.email?.trim() || '';
            if (email === '') {
                setErrors(prev => ({ ...prev, email: undefined }));
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                setErrors(prev => ({ ...prev, email: 'E-mail inválido (exemplo: nome@dominio.com)' }));
            } else {
                setErrors(prev => ({ ...prev, email: undefined }));
            }
        };

        const handleCepBlur = () => {
            const cep = formData.cep?.replace(/\D/g, '');
            if (!cep || cep.length !== 8) {
                setErrors(prev => ({ ...prev, cep: 'CEP é obrigatório (8 dígitos)' }));
            } else {
                setErrors(prev => ({ ...prev, cep: undefined }));
            }
        };

        const handleEnderecoBlur = (campo: string) => {
            const valor = formData[campo] || '';
            if (campo === 'rua' && !valor.trim()) {
                setErrors(prev => ({ ...prev, rua: 'Rua/Avenida é obrigatória' }));
            } else if (campo === 'rua') {
                setErrors(prev => ({ ...prev, rua: undefined }));
            }
            if (campo === 'numero' && !formData.sem_numero && !valor.trim()) {
                setErrors(prev => ({ ...prev, numero: 'Número é obrigatório' }));
            } else if (campo === 'numero') {
                setErrors(prev => ({ ...prev, numero: undefined }));
            }
            if (campo === 'bairro' && !valor.trim()) {
                setErrors(prev => ({ ...prev, bairro: 'Bairro é obrigatório' }));
            } else if (campo === 'bairro') {
                setErrors(prev => ({ ...prev, bairro: undefined }));
            }
            if (campo === 'cidade' && !valor.trim()) {
                setErrors(prev => ({ ...prev, cidade: 'Cidade é obrigatória' }));
            } else if (campo === 'cidade') {
                setErrors(prev => ({ ...prev, cidade: undefined }));
            }
            if (campo === 'estado' && valor.trim().length !== 2) {
                setErrors(prev => ({ ...prev, estado: 'Estado deve ter 2 letras' }));
            } else if (campo === 'estado') {
                setErrors(prev => ({ ...prev, estado: undefined }));
            }
        };

        // Validação global (chamada pelo formulário pai)
        const validar = (): boolean => {
            handleNomeBlur();
            handleDataNascimentoBlur();
            if (telefoneObrigatorio || formData.telefone?.replace(/\D/g, '')) handleTelefoneBlur('telefone');
            if (telefoneAlternativoObrigatorio || formData.telefone_alternativo?.replace(/\D/g, '')) handleTelefoneBlur('telefone_alternativo');
            if (tipo === 'adulto') handleCpfBlur();
            else if (formData.cpf) handleCpfBlur();
            handleGeneroBlur();
            handleRacaEtniaBlur();
            handleEmailBlur();
            handleCepBlur();
            handleEnderecoBlur('rua');
            if (!formData.sem_numero) handleEnderecoBlur('numero');
            handleEnderecoBlur('bairro');
            handleEnderecoBlur('cidade');
            handleEnderecoBlur('estado');

            // CPF duplicado impede envio
            if (cpfJaExiste && !erroCpfApi) {
                setErrors(prev => ({ ...prev, cpf: 'CPF já cadastrado para outro paciente' }));
            } else if (!cpfJaExiste && errors.cpf === 'CPF já cadastrado para outro paciente') {
                setErrors(prev => ({ ...prev, cpf: undefined }));
            }

            const hasError = !!(
                errors.nome ||
                errors.data_nascimento ||
                (telefoneObrigatorio && errors.telefone) ||
                (telefoneAlternativoObrigatorio && errors.telefone_alternativo) ||
                errors.telefone ||
                errors.telefone_alternativo ||
                (tipo === 'adulto' && errors.cpf) ||
                errors.cpf ||
                errors.genero ||
                errors.raca_etnia ||
                errors.email ||
                errors.cep ||
                errors.rua ||
                errors.numero ||
                errors.bairro ||
                errors.cidade ||
                errors.estado
            );
            return !hasError;
        };

        useImperativeHandle(ref, () => ({ validar }));

        return (
            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Dados do Paciente</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Nome */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo <span className="text-red-500">*</span></label>
                        <input type="text" name="nome" value={formData.nome || ''} onChange={handleChange} onBlur={handleNomeBlur} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800" />
                        {errors.nome && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdErrorOutline size={14} />{errors.nome}</p>}
                    </div>

                    {/* Data */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data de nascimento <span className="text-red-500">*</span></label>
                        <input type="date" name="data_nascimento" value={formData.data_nascimento || ''} onChange={handleChange} onBlur={handleDataNascimentoBlur} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800" />
                        {errors.data_nascimento && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdErrorOutline size={14} />{errors.data_nascimento}</p>}
                        {erroIdade && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdErrorOutline size={14} />{erroIdade}</p>}
                    </div>

                    {/* Gênero */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gênero <span className="text-red-500">*</span></label>
                        <select name="genero" value={formData.genero || ''} onChange={handleChange} onBlur={handleGeneroBlur} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800">
                            <option value="">Selecione</option>
                            <option>Feminino</option><option>Masculino</option><option>Não-binário</option><option>Prefere não informar</option><option>Outro</option>
                        </select>
                        {errors.genero && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdErrorOutline size={14} />{errors.genero}</p>}
                    </div>

                    {/* Raça/Etnia */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Raça/Etnia <span className="text-red-500">*</span></label>
                        <select name="raca_etnia" value={formData.raca_etnia || ''} onChange={handleChange} onBlur={handleRacaEtniaBlur} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800">
                            <option value="">Selecione</option>
                            <option>Branca</option><option>Preta</option><option>Parda</option><option>Amarela</option><option>Indígena</option><option>Prefere não informar</option>
                        </select>
                        {errors.raca_etnia && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdErrorOutline size={14} />{errors.raca_etnia}</p>}
                    </div>

                    {/* CPF */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CPF {tipo === 'adulto' && <span className="text-red-500">*</span>}</label>
                        <input type="text" name="cpf" value={formData.cpf || ''} onChange={handleChange} onBlur={handleCpfBlur} placeholder="000.000.000-00" className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800 ${errors.cpf ? 'border-red-500' : 'border-gray-300'}`} />
                        {verificandoCpf && <p className="text-gray-500 text-xs mt-1">Verificando CPF...</p>}
                        {cpfJaExiste && !erroCpfApi && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <MdErrorOutline size={14} /> CPF já cadastrado para outro paciente
                            </p>
                        )}
                        {errors.cpf && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdErrorOutline size={14} />{errors.cpf}</p>}
                        {erroCpfApi && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdErrorOutline size={14} />{erroCpfApi}</p>}
                    </div>

                    {/* Telefone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone {telefoneObrigatorio && <span className="text-red-500">*</span>}</label>
                        <input type="tel" name="telefone" value={formData.telefone || ''} onChange={handleChange} onBlur={() => handleTelefoneBlur('telefone')} placeholder="(00) 00000-0000" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800" />
                        {errors.telefone && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdErrorOutline size={14} />{errors.telefone}</p>}
                        {erroTelefoneApi && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdErrorOutline size={14} />{erroTelefoneApi}</p>}
                    </div>

                    {/* Telefone alternativo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone alternativo {telefoneAlternativoObrigatorio && <span className="text-red-500">*</span>}</label>
                        <input type="tel" name="telefone_alternativo" value={formData.telefone_alternativo || ''} onChange={handleChange} onBlur={() => handleTelefoneBlur('telefone_alternativo')} placeholder="(00) 00000-0000" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800" />
                        {errors.telefone_alternativo && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdErrorOutline size={14} />{errors.telefone_alternativo}</p>}
                    </div>

                    {/* E-mail */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                        <input type="email" name="email" value={formData.email || ''} onChange={handleChange} onBlur={handleEmailBlur} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800" />
                        {errors.email && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdErrorOutline size={14} />{errors.email}</p>}
                    </div>
                </div>

                {/* Deficiência */}
                <div style={{ fontSize: 0, lineHeight: 0 }}>
                    <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: '0.875rem', lineHeight: 'normal' }}>
                        <input type="checkbox" name="possui_deficiencia" checked={formData.possui_deficiencia === true || formData.possui_deficiencia === 1} onChange={handleChange} className="rounded border-gray-300 text-[#9F64AF] focus:ring-[#9F64AF] accent-[#9F64AF]" />
                        <span className="text-sm text-gray-700">Paciente possui deficiência?</span>
                    </label>
                </div>
                {formData.possui_deficiencia && (
                    <textarea name="descricao_deficiencia" value={formData.descricao_deficiencia || ''} onChange={handleChange} rows={2} className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800" placeholder="Descreva a deficiência" />
                )}

                {/* Renda e CadÚnico */}
                <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Renda familiar (R$)</label><input type="number" step="0.01" name="renda_familiar" value={formData.renda_familiar || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800" /></div>
                    <div><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="possui_cadastro_unico" checked={formData.possui_cadastro_unico === true || formData.possui_cadastro_unico === 1} onChange={handleChange} className="rounded border-gray-300 text-[#9F64AF] focus:ring-[#9F64AF] accent-[#9F64AF]" /><span className="text-sm text-gray-700">Possui Cadastro Único (CadÚnico)</span></label></div>
                </div>

                {/* Endereço */}
                <hr className="my-2" />
                <h3 className="text-md font-semibold text-gray-800">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* CEP */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CEP <span className="text-red-500">*</span></label>
                        <input type="text" name="cep" value={formData.cep || ''} onChange={handleChange} onBlur={buscarEnderecoPorCep} placeholder="00000-000" className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800 ${errors.cep ? 'border-red-500' : 'border-gray-300'}`} />
                        {buscandoCep && <p className="text-xs text-gray-500 mt-1">Buscando...</p>}
                        {errors.cep && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdErrorOutline size={14} />{errors.cep}</p>}
                        <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener noreferrer" className="text-xs text-[#9F64AF] hover:underline mt-1 inline-block">Paciente não sabe o CEP?</a>
                    </div>
                    {/* Rua */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rua / Avenida <span className="text-red-500">*</span></label>
                        <input type="text" name="rua" value={formData.rua || ''} onChange={handleChange} onBlur={() => handleEnderecoBlur('rua')} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800 ${errors.rua ? 'border-red-500' : 'border-gray-300'}`} />
                        {errors.rua && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdErrorOutline size={14} />{errors.rua}</p>}
                    </div>
                    {/* Número + Sem número */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Número {!formData.sem_numero && <span className="text-red-500">*</span>}</label>
                        <input type="text" name="numero" value={formData.numero || ''} onChange={handleChange} disabled={formData.sem_numero === true} placeholder="Ex: 123" className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800 ${errors.numero ? 'border-red-500' : 'border-gray-300'} disabled:bg-gray-100`} />
                        <label className="flex items-center gap-1 text-sm text-gray-600 mt-1"><input type="checkbox" name="sem_numero" checked={formData.sem_numero || false} onChange={(e) => { const checked = e.target.checked; setFormData({ ...formData, sem_numero: checked, numero: checked ? '' : formData.numero }); if (checked) setErrors(prev => ({ ...prev, numero: undefined })); }} className="rounded border-gray-300 text-[#9F64AF] focus:ring-[#9F64AF] accent-[#9F64AF]" />Sem número</label>
                        {errors.numero && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdErrorOutline size={14} />{errors.numero}</p>}
                    </div>
                    {/* Complemento */}
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label><input type="text" name="complemento" value={formData.complemento || ''} onChange={handleChange} placeholder="Apto, Bloco, Casa..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800" /></div>
                    {/* Bairro */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bairro <span className="text-red-500">*</span></label>
                        <input type="text" name="bairro" value={formData.bairro || ''} onChange={handleChange} onBlur={() => handleEnderecoBlur('bairro')} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800 ${errors.bairro ? 'border-red-500' : 'border-gray-300'}`} />
                        {errors.bairro && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdErrorOutline size={14} />{errors.bairro}</p>}
                    </div>
                    {/* Cidade */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cidade <span className="text-red-500">*</span></label>
                        <input type="text" name="cidade" value={formData.cidade || ''} onChange={handleChange} onBlur={() => handleEnderecoBlur('cidade')} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800 ${errors.cidade ? 'border-red-500' : 'border-gray-300'}`} />
                        {errors.cidade && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdErrorOutline size={14} />{errors.cidade}</p>}
                    </div>
                    {/* Estado */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado <span className="text-red-500">*</span></label>
                        <input type="text" name="estado" value={formData.estado || ''} onChange={handleChange} onBlur={() => handleEnderecoBlur('estado')} maxLength={2} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800 uppercase ${errors.estado ? 'border-red-500' : 'border-gray-300'}`} />
                        {errors.estado && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdErrorOutline size={14} />{errors.estado}</p>}
                    </div>
                </div>
                {/* Observações */}
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Observações</label><textarea name="observacoes" value={formData.observacoes || ''} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800" /></div>
            </div>
        );
    }
);

DadosPaciente.displayName = 'DadosPaciente';
export default DadosPaciente;