-- NeuroSync – Banco de Dados (versão consolidada)

CREATE DATABASE IF NOT EXISTS neurosync;
USE neurosync;

-- TABELA: clinicas

CREATE TABLE IF NOT EXISTS clinicas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cnpj VARCHAR(14) NOT NULL UNIQUE COMMENT 'CNPJ sem formatação',
    nome_fantasia VARCHAR(100) NOT NULL,
    razao_social VARCHAR(100) NOT NULL,
    nome_sidebar VARCHAR(120) NULL,
    telefone VARCHAR(15),
    whatsapp VARCHAR(15) NULL,
    email VARCHAR(100),
    site VARCHAR(150) NULL,
    descricao_institucional TEXT NULL,
    crp_clinica VARCHAR(8) NULL,
    endereco VARCHAR(200),
    numero VARCHAR(10),
    complemento VARCHAR(100) NULL,
    bairro VARCHAR(100),
    cidade VARCHAR(80),
    estado VARCHAR(2),
    cep VARCHAR(8),
    logo_url VARCHAR(255) NULL,
    favicon_url VARCHAR(255) NULL,
    responsavel_tecnico_nome VARCHAR(100) NULL,
    responsavel_tecnico_crp VARCHAR(8) NULL,
    responsavel_tecnico_assinatura_url VARCHAR(500) NULL,
    responsavel_tecnico_cargo VARCHAR(100) NULL,
    permitir_multiplos_psicologos TINYINT(1) NOT NULL DEFAULT 1,
    permitir_compartilhamento_prontuario TINYINT(1) NOT NULL DEFAULT 1,
    exigir_assinatura_evolucoes TINYINT(1) NOT NULL DEFAULT 1,
    bloquear_edicao_apos_assinatura TINYINT(1) NOT NULL DEFAULT 1,
    tempo_maximo_edicao_evolucao INT NULL,
    habilitar_auditoria_clinica TINYINT(1) NOT NULL DEFAULT 1,
    responsavel_clinica_id INT NULL COMMENT 'Psicólogo responsável institucional pela clínica',
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_clinicas_cnpj (cnpj),
    INDEX idx_clinicas_nome_fantasia (nome_fantasia),
    INDEX idx_clinicas_responsavel (responsavel_clinica_id)
);

-- TABELA: perfis

CREATE TABLE IF NOT EXISTS perfis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao VARCHAR(200),
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO perfis (id, nome, descricao)
VALUES (1, 'secretaria', 'Secretária – pode gerenciar agenda e pacientes, mas NÃO acessa prontuários'),
       (2, 'psicologo', 'Psicólogo(a) – acesso total, incluindo prontuários eletrônicos')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- TABELA: usuarios

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    perfil_id INT NOT NULL,
    crp VARCHAR(8) NULL COMMENT 'Registro profissional (apenas psicólogo)',
    cpf VARCHAR(11) UNIQUE NULL COMMENT 'CPF sem formatação (apenas secretária)',
    telefone VARCHAR(15) NULL,
    especialidade VARCHAR(100) NULL COMMENT 'Campo legado de exibição profissional; não é editado no Perfil Profissional',
    avatar_url VARCHAR(255) NULL,
    assinatura_profissional_url VARCHAR(500) NULL COMMENT 'Caminho da assinatura profissional usada em prontuários e documentos clínicos',
    clinica_id INT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    ultimo_acesso DATETIME NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (perfil_id) REFERENCES perfis(id),
    FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE SET NULL,
    
    INDEX idx_usuarios_clinica (clinica_id),
    INDEX idx_usuarios_perfil_id (perfil_id),
    INDEX idx_usuarios_cpf (cpf),
    INDEX idx_usuarios_email (email),
    INDEX idx_usuarios_nome (nome),
    INDEX idx_usuarios_clinica_ativo (clinica_id, ativo)
);

ALTER TABLE clinicas
    ADD CONSTRAINT fk_clinicas_responsavel_clinica
    FOREIGN KEY (responsavel_clinica_id) REFERENCES usuarios(id) ON DELETE SET NULL;

-- TABELA: recuperacao_senha

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

-- TABELA: horarios_funcionamento (ATUALIZADA)

CREATE TABLE IF NOT EXISTS horarios_funcionamento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clinica_id INT NOT NULL,
    dia_semana TINYINT NULL COMMENT '0=Domingo..6=Sábado, NULL para datas específicas',
    data_especifica DATE NULL,
    data_fim DATE NULL COMMENT 'Data final para intervalos (férias, bloqueios)',
    hora_inicio TIME NULL,
    hora_fim TIME NULL,
    intervalo_inicio TIME NULL,
    intervalo_fim TIME NULL,
    tipo ENUM('funcionamento','feriado','ferias','bloqueio','excecao') NOT NULL DEFAULT 'funcionamento',
    descricao VARCHAR(255) NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_excecao (clinica_id, data_especifica, tipo),
    INDEX idx_clinica_dia (clinica_id, dia_semana),
    INDEX idx_clinica_data (clinica_id, data_especifica)
);

-- TABELA: salas
-- Atualização do script.sql para o módulo Salas:
-- a listagem comum ignora deleted_at, enquanto a futura Agenda usa apenas ativo = 1.

CREATE TABLE IF NOT EXISTS salas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clinica_id INT NOT NULL,
    nome VARCHAR(120) NOT NULL,
    tipo ENUM('geral', 'infantil') NOT NULL DEFAULT 'geral',
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL COMMENT 'Exclusão lógica',
    
    FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
    
    CONSTRAINT chk_salas_tipo CHECK (tipo IN ('geral', 'infantil')),
    INDEX idx_salas_clinica (clinica_id),
    INDEX idx_salas_clinica_ativo (clinica_id, ativo),
    INDEX idx_salas_tipo (tipo),
    INDEX idx_salas_deleted_at (deleted_at),
    INDEX idx_salas_agenda_futura (clinica_id, ativo, deleted_at),
    INDEX idx_salas_duplicidade_nome (clinica_id, nome, deleted_at)
);

-- TABELA: pacientes (principal)

CREATE TABLE IF NOT EXISTS pacientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clinica_id INT NOT NULL,
    
    nome VARCHAR(100) NOT NULL,
    data_nascimento DATE NOT NULL,
    genero VARCHAR(30) DEFAULT 'Prefiro não informar',
    raca_etnia VARCHAR(30) DEFAULT 'Prefiro não informar',
    cpf VARCHAR(11) NULL COMMENT 'Apenas números',
    
    telefone VARCHAR(15) NOT NULL,
    telefone_alternativo VARCHAR(15) NULL,
    email VARCHAR(100) NULL,
    
    tipo ENUM('adulto', 'menor') NOT NULL DEFAULT 'adulto',
    
    possui_deficiencia BOOLEAN DEFAULT FALSE,
    descricao_deficiencia TEXT NULL,
    
    renda_familiar DECIMAL(10,2) NULL,
    possui_cadastro_unico BOOLEAN DEFAULT FALSE,
    
    cep VARCHAR(8) NULL,
    rua VARCHAR(150) NULL,
    numero VARCHAR(10) NULL,
    complemento VARCHAR(100) NULL,
    bairro VARCHAR(100) NULL,
    cidade VARCHAR(100) NULL,
    estado VARCHAR(2) NULL,
    sem_numero BOOLEAN DEFAULT FALSE COMMENT 'Indica que o endereço não possui número',
    
    status_atendimento ENUM('fila_espera', 'em_atendimento', 'encerrado') NOT NULL DEFAULT 'fila_espera',
    psicologo_responsavel_id INT NULL COMMENT 'Psicólogo responsável pelo acompanhamento',
    psicologo_responsavel_atribuido_em DATETIME NULL,
    psicologo_responsavel_atribuido_por_id INT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    deleted_at DATETIME NULL COMMENT 'Soft delete',
    
    observacoes TEXT NULL,
    responsavel_nome VARCHAR(100) NULL,
    responsavel_cpf VARCHAR(11) NULL,
    responsavel_telefone VARCHAR(15) NULL,
    responsavel_email VARCHAR(100) NULL,
    responsavel_parentesco VARCHAR(50) NULL,
    responsavel_escolaridade VARCHAR(100) NULL,
    
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
    FOREIGN KEY (psicologo_responsavel_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (psicologo_responsavel_atribuido_por_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    INDEX idx_pacientes_clinica_id (clinica_id),
    INDEX idx_pacientes_nome (nome),
    INDEX idx_pacientes_cpf (cpf),
    INDEX idx_pacientes_tipo (tipo),
    INDEX idx_pacientes_ativo_clinica (ativo, clinica_id),
    INDEX idx_pacientes_telefone (telefone),
    INDEX idx_pacientes_data_nascimento (data_nascimento),
    INDEX idx_pacientes_status_atendimento (status_atendimento),
    INDEX idx_pacientes_psicologo_responsavel (clinica_id, psicologo_responsavel_id, ativo, deleted_at),
    INDEX idx_pacientes_deleted_at (deleted_at)
);

-- TABELA: paciente_acompanhamento_historico

CREATE TABLE IF NOT EXISTS paciente_acompanhamento_historico (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clinica_id INT NOT NULL,
    paciente_id INT NOT NULL,
    psicologo_origem_id INT NULL,
    psicologo_destino_id INT NOT NULL,
    consulta_id_origem INT NULL,
    transferido_por_id INT NOT NULL,
    tipo_evento ENUM(
        'primeira_atribuicao',
        'redefinicao_manual',
        'transferencia_manual',
        'transferencia_por_inativacao'
    ) NOT NULL,
    motivo VARCHAR(255) NULL,
    observacoes TEXT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (psicologo_origem_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (psicologo_destino_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (transferido_por_id) REFERENCES usuarios(id) ON DELETE RESTRICT,

    INDEX idx_paciente_acompanhamento_paciente (clinica_id, paciente_id, deleted_at),
    INDEX idx_paciente_acompanhamento_destino (clinica_id, psicologo_destino_id, deleted_at),
    INDEX idx_paciente_acompanhamento_tipo (tipo_evento)
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

-- TABELA: consultas (agendamentos)
-- Base da Agenda: status abaixo são da CONSULTA, não do paciente.
-- Paciente usa status_atendimento em outro contexto clínico.

CREATE TABLE IF NOT EXISTS consultas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clinica_id INT NOT NULL,
    paciente_id INT NOT NULL,
    psicologo_id INT NOT NULL,
    sala_id INT NOT NULL,
    data_consulta DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    tipo_atendimento ENUM('triagem', 'psicoterapia', 'devolutiva', 'avaliacao', 'orientacao', 'retorno', 'alta', 'outro') NOT NULL,
    tipo_outro VARCHAR(120) NULL COMMENT 'Obrigatório quando tipo_atendimento = outro',
    status ENUM('agendado', 'remarcado', 'cancelado', 'falta', 'concluido') NOT NULL DEFAULT 'agendado',
    observacoes TEXT NULL,
    fechado_dia BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Prepara histórico diário: quando verdadeiro, a data fica apenas para visualização',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL COMMENT 'Soft delete da consulta',
    
    FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE RESTRICT,
    FOREIGN KEY (psicologo_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (sala_id) REFERENCES salas(id) ON DELETE RESTRICT,
    
    CONSTRAINT chk_consultas_horario CHECK (horario_inicio < horario_fim),
    CONSTRAINT chk_consultas_tipo_outro CHECK (
        (tipo_atendimento <> 'outro' AND tipo_outro IS NULL)
        OR (tipo_atendimento = 'outro' AND tipo_outro IS NOT NULL AND TRIM(tipo_outro) <> '')
    ),
    
    INDEX idx_consultas_clinica_data (clinica_id, data_consulta),
    INDEX idx_consulta_paciente (paciente_id),
    INDEX idx_consulta_psicologo (psicologo_id),
    INDEX idx_consulta_sala (sala_id),
    INDEX idx_consulta_status (status),
    INDEX idx_consulta_fechado_dia (clinica_id, data_consulta, fechado_dia),
    INDEX idx_consulta_deleted_at (deleted_at),
    INDEX idx_consulta_conflito_sala (clinica_id, sala_id, data_consulta, horario_inicio, horario_fim, deleted_at),
    INDEX idx_consulta_conflito_psicologo (clinica_id, psicologo_id, data_consulta, horario_inicio, horario_fim, deleted_at)
);

ALTER TABLE paciente_acompanhamento_historico
    ADD CONSTRAINT fk_paciente_acompanhamento_consulta
    FOREIGN KEY (consulta_id_origem) REFERENCES consultas(id) ON DELETE SET NULL;

-- TABELA: registros_clinicos
-- Registros clínicos vinculados à clínica, paciente, psicólogo e, quando existir,
-- à consulta de origem na Agenda. A assinatura é copiada no momento da assinatura
-- para preservar o histórico mesmo que o profissional altere a assinatura depois.
CREATE TABLE IF NOT EXISTS registros_clinicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clinica_id INT NOT NULL,
    paciente_id INT NOT NULL,
    psicologo_id INT NOT NULL,
    consulta_id INT NULL,
    data_registro DATE NOT NULL,
    tipo_atendimento ENUM('triagem','psicoterapia','devolutiva','avaliacao','orientacao','retorno','alta','outro') NOT NULL DEFAULT 'psicoterapia',
    conteudo TEXT NOT NULL,
    status ENUM('rascunho','finalizado','assinado') NOT NULL DEFAULT 'rascunho',
    assinatura_url VARCHAR(500) NULL,
    assinado_em DATETIME NULL,
    finalizado_em DATETIME NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    FOREIGN KEY (clinica_id) REFERENCES clinicas(id),
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
    FOREIGN KEY (psicologo_id) REFERENCES usuarios(id),
    FOREIGN KEY (consulta_id) REFERENCES consultas(id),

    INDEX idx_registros_clinicos_clinica (clinica_id),
    INDEX idx_registros_clinicos_paciente (paciente_id),
    INDEX idx_registros_clinicos_psicologo (psicologo_id),
    INDEX idx_registros_clinicos_consulta (consulta_id),
    INDEX idx_registros_clinicos_status (status),
    INDEX idx_registros_clinicos_data (data_registro),
    INDEX idx_registros_clinicos_deleted_at (deleted_at)
);

-- TABELA: registro_clinico_historico_edicoes
-- Trilha clínica de auditoria: cada edição preserva autor, CRP, assinatura
-- profissional vigente e o conteúdo antes/depois da alteração.
CREATE TABLE IF NOT EXISTS registro_clinico_historico_edicoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    registro_clinico_id INT NOT NULL,
    psicologo_id INT NOT NULL,
    nome_psicologo VARCHAR(150) NOT NULL,
    crp_psicologo VARCHAR(20) NULL,
    assinatura_url VARCHAR(500) NULL,
    editado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    conteudo_anterior TEXT NOT NULL,
    conteudo_novo TEXT NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (registro_clinico_id) REFERENCES registros_clinicos(id),
    FOREIGN KEY (psicologo_id) REFERENCES usuarios(id),

    INDEX idx_registro_clinico_historico_registro (registro_clinico_id, editado_em),
    INDEX idx_registro_clinico_historico_psicologo (psicologo_id)
);

-- TABELA: notificacoes
-- Base estrutural das notificações do usuário logado, isoladas por clínica.
CREATE TABLE IF NOT EXISTS notificacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clinica_id INT NOT NULL,
    usuario_id INT NOT NULL,
    tipo ENUM(
        'consulta_5_dias',
        'consulta_24h',
        'consulta_pendente',
        'feriado_30_dias',
        'feriado_7_dias',
        'transferencia_paciente',
        'consulta_remarcada',
        'consulta_cancelada',
        'paciente_sem_responsavel'
    ) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    entidade_tipo VARCHAR(80) NULL,
    entidade_id INT NULL,
    lida TINYINT(1) NOT NULL DEFAULT 0,
    lida_em DATETIME NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,

    INDEX idx_notificacoes_usuario_lida (clinica_id, usuario_id, lida, criado_em),
    INDEX idx_notificacoes_tipo (tipo),
    INDEX idx_notificacoes_entidade (entidade_tipo, entidade_id)
);

-- SHOW TABLES;
-- DESCRIBE clinicas;
-- DESCRIBE perfis;
-- DESCRIBE usuarios;
-- DESCRIBE horarios_funcionamento;
-- DESCRIBE salas;
-- DESCRIBE pacientes;
-- DESCRIBE contatos_emergencia;
-- DESCRIBE consultas;
-- DESCRIBE registros_clinicos;
-- DESCRIBE registro_clinico_historico_edicoes;

-- SELECT * FROM perfis;
-- SHOW INDEX FROM pacientes;
-- SHOW INDEX FROM salas;
