-- NeuroSync 

-- Criar o banco de dados (se não existir)
CREATE DATABASE neurosync;

USE neurosync;


-- TABELA: clinicas
-- Armazena os dados cadastrais de cada clínica 

CREATE TABLE IF NOT EXISTS clinicas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cnpj VARCHAR(14) NOT NULL UNIQUE COMMENT 'CNPJ sem formatação',
    nome_fantasia VARCHAR(100) NOT NULL,
    razao_social VARCHAR(100) NOT NULL,
    telefone VARCHAR(15),
    email VARCHAR(100),
    endereco VARCHAR(200),
    numero VARCHAR(10),
    bairro VARCHAR(100),
    cidade VARCHAR(80),
    estado VARCHAR(2),
    cep VARCHAR(8),
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_clinicas_cnpj (cnpj),
    INDEX idx_clinicas_nome_fantasia (nome_fantasia)
);

-- TABELA: perfis
-- Define os perfis de acesso: secretária e psicólogo

CREATE TABLE IF NOT EXISTS perfis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao VARCHAR(200),
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inserir os perfis padrão (caso não existam)
INSERT INTO perfis (id, nome, descricao)
VALUES (1, 'secretaria', 'Secretária – pode gerenciar agenda e pacientes, mas NÃO acessa prontuários'),
       (2, 'psicologo', 'Psicólogo(a) – acesso total, incluindo prontuários eletrônicos')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- TABELA: usuarios
-- Credenciais e vínculo com a clínica

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    perfil_id INT NOT NULL,
    crp VARCHAR(8) NULL COMMENT 'Registro profissional (apenas psicólogo)',
    clinica_id INT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (perfil_id) REFERENCES perfis(id),
    FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE SET NULL,
    
    INDEX idx_usuarios_clinica (clinica_id),
    INDEX idx_usuarios_perfil_id (perfil_id),
    INDEX idx_usuarios_email (email),
    INDEX idx_usuarios_nome (nome)
);

-- TABELA: recuperacao_senha
-- Tokens para redefinição de senha (expiram em 1 hora)

CREATE TABLE IF NOT EXISTS recuperacao_senha (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    expira_em DATETIME NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    INDEX idx_token_recuperacao (token),
    INDEX idx_usuario_recuperacao (usuario_id),
    INDEX idx_expira_recuperacao (expira_em)
);

-- TABELA: pacientes (principal)

CREATE TABLE IF NOT EXISTS pacientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clinica_id INT NOT NULL,
    
    -- Dados básicos
    nome VARCHAR(100) NOT NULL,
    data_nascimento DATE NOT NULL,
    genero VARCHAR(30) DEFAULT 'Prefiro não informar',
    raca_etnia VARCHAR(30) DEFAULT 'Prefiro não informar',
    cpf VARCHAR(11) UNIQUE NULL COMMENT 'Apenas números',
    
    -- Contato
    telefone VARCHAR(15) NOT NULL,
    telefone_alternativo VARCHAR(15) NULL,
    email VARCHAR(100) NULL,
    
    -- Classificação (adulto/menor)
    tipo ENUM('adulto', 'menor') NOT NULL DEFAULT 'adulto',
    
    -- Deficiência
    possui_deficiencia BOOLEAN DEFAULT FALSE,
    descricao_deficiencia TEXT NULL,
    
    -- Socioeconômico
    renda_familiar DECIMAL(10,2) NULL,
    possui_cadastro_unico BOOLEAN DEFAULT FALSE,
    
    -- Endereço (campo rua em vez de logradouro)
    cep VARCHAR(8) NULL,
    rua VARCHAR(150) NULL,
    numero VARCHAR(10) NULL,
    complemento VARCHAR(100) NULL,
    bairro VARCHAR(100) NULL,
    cidade VARCHAR(100) NULL,
    estado VARCHAR(2) NULL,
    sem_numero BOOLEAN DEFAULT FALSE COMMENT 'Indica que o endereço não possui número',
    
    -- Status clínico e cadastral
    status_atendimento ENUM('fila_espera', 'em_atendimento', 'encerrado') NOT NULL DEFAULT 'fila_espera',
    ativo BOOLEAN DEFAULT TRUE,
    deleted_at DATETIME NULL COMMENT 'Soft delete – data de exclusão lógica',
    
    observacoes TEXT NULL,
    
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
    
    INDEX idx_pacientes_clinica_id (clinica_id),
    INDEX idx_pacientes_nome (nome),
    INDEX idx_pacientes_cpf (cpf),
    INDEX idx_pacientes_tipo (tipo),
    INDEX idx_pacientes_ativo_clinica (ativo, clinica_id),
    INDEX idx_pacientes_telefone (telefone),
    INDEX idx_pacientes_data_nascimento (data_nascimento),
    INDEX idx_pacientes_status_atendimento (status_atendimento),
    INDEX idx_pacientes_deleted_at (deleted_at)
);

-- TABELA: responsaveis
-- Dados do responsável legal (para pacientes menores)

CREATE TABLE IF NOT EXISTS responsaveis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clinica_id INT NOT NULL,
    
    nome VARCHAR(100) NOT NULL,
    data_nascimento DATE NULL,
    cpf VARCHAR(11) UNIQUE NULL,
    rg VARCHAR(20) NULL,
    telefone VARCHAR(15) NOT NULL,
    telefone_alternativo VARCHAR(15) NULL,
    email VARCHAR(100) NULL,
    profissao VARCHAR(100) NULL,
    escolaridade VARCHAR(100) NULL,
    grau_parentesco VARCHAR(50) NOT NULL COMMENT 'Ex: Pai, Mãe, Avô',
    
    mesmo_endereco_paciente BOOLEAN DEFAULT TRUE,
    sem_numero BOOLEAN DEFAULT FALSE,
    cep VARCHAR(8) NULL,
    rua VARCHAR(150) NULL,
    numero VARCHAR(10) NULL,
    complemento VARCHAR(100) NULL,
    bairro VARCHAR(100) NULL,
    cidade VARCHAR(100) NULL,
    estado VARCHAR(2) NULL,
    
    ativo BOOLEAN DEFAULT TRUE,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
    
    INDEX idx_responsaveis_clinica (clinica_id),
    INDEX idx_responsaveis_nome (nome),
    INDEX idx_responsaveis_cpf (cpf),
    INDEX idx_responsaveis_telefone (telefone)
);

-- TABELA: paciente_responsavel (relacionamento N:N)

CREATE TABLE IF NOT EXISTS paciente_responsavel (
    paciente_id INT NOT NULL,
    responsavel_id INT NOT NULL,
    principal BOOLEAN DEFAULT FALSE COMMENT 'Indica o responsável principal',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (paciente_id, responsavel_id),
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (responsavel_id) REFERENCES responsaveis(id) ON DELETE CASCADE,
    
    INDEX idx_paciente_responsavel_paciente (paciente_id),
    INDEX idx_paciente_responsavel_responsavel (responsavel_id),
    INDEX idx_paciente_responsavel_principal (principal)
);

-- TABELA: contatos_emergencia

CREATE TABLE IF NOT EXISTS contatos_emergencia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(15) NOT NULL,
    telefone_alternativo VARCHAR(15) NULL,
    parentesco VARCHAR(50) NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    
    INDEX idx_contatos_emergencia_paciente (paciente_id),
    INDEX idx_contatos_emergencia_nome (nome),
    INDEX idx_contatos_emergencia_telefone (telefone)
);

-- TABELA: documentos_pacientes
-- Para futura integração com upload de arquivos

CREATE TABLE IF NOT EXISTS documentos_pacientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    tipo ENUM('RG', 'CPF', 'ComprovanteResidencia', 'LaudoMedico', 'Outro') NOT NULL,
    numero VARCHAR(50) NULL,
    arquivo_url VARCHAR(500) NULL,
    observacao TEXT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    
    INDEX idx_documentos_pacientes_paciente (paciente_id),
    INDEX idx_documentos_pacientes_tipo (tipo)
);

-- TABELA: logs_auditoria
-- Registra todas as ações de criação, atualização e exclusão

CREATE TABLE IF NOT EXISTS logs_auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tabela VARCHAR(50) NOT NULL,
    registro_id INT NOT NULL,
    acao ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    dados_antigos JSON NULL,
    dados_novos JSON NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    
    INDEX idx_logs_tabela_registro (tabela, registro_id),
    INDEX idx_logs_usuario (usuario_id)
);

-- TABELA: consultas (agendamentos)

CREATE TABLE IF NOT EXISTS consultas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    psicologo_id INT NOT NULL,
    clinica_id INT NOT NULL,
    data DATE NOT NULL,
    horario TIME NOT NULL,
    sala INT NOT NULL,
    status ENUM('agendado', 'confirmado', 'concluido', 'cancelado', 'falta', 'remarcado') DEFAULT 'agendado',
    observacoes TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (psicologo_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
    
    INDEX idx_consulta_paciente (paciente_id),
    INDEX idx_consulta_psicologo (psicologo_id),
    INDEX idx_consulta_data (data),
    INDEX idx_consulta_status (status)
);

-- CONSULTAS DE VERIFICAÇÃO (opcionais)

-- SHOW TABLES;
-- DESCRIBE clinicas;
-- DESCRIBE perfis;
-- DESCRIBE usuarios;
-- DESCRIBE recuperacao_senha;
-- DESCRIBE pacientes;
-- DESCRIBE responsaveis;
-- DESCRIBE paciente_responsavel;
-- DESCRIBE contatos_emergencia;
-- DESCRIBE documentos_pacientes;
-- DESCRIBE logs_auditoria;
-- DESCRIBE consultas;

-- SELECT * FROM perfis;
-- SHOW INDEX FROM pacientes;