-- Criar o banco de dados
CREATE DATABASE neurosync;

-- Usar o banco
USE neurosync;

-- Criar tabela de usuários
CREATE TABLE usuarios (
id INT AUTO_INCREMENT PRIMARY KEY,
nome VARCHAR(100) NOT NULL,
email VARCHAR(150) NOT NULL UNIQUE,
senha_hash VARCHAR(255) NOT NULL,
perfil ENUM('psicologo', 'secretaria') NOT NULL,
cnpj VARCHAR(18) NOT NULL,
crp VARCHAR(20) NULL 
);

-- Criar índice para buscar por CNPJ
CREATE INDEX idx_cnpj ON usuarios(cnpj);

-- Criar tabelas de clínicas
CREATE TABLE clinicas (
id INT AUTO_INCREMENT PRIMARY KEY,
cnpj VARCHAR(18) NOT NULL UNIQUE,
nome_fantasia VARCHAR(100) NOT NULL,
razao_social VARCHAR(100) NOT NULL,
telefone VARCHAR(20), 
email VARCHAR(150),
endereco VARCHAR(200),
bairro VARCHAR(100),
cidade VARCHAR(100),
estado VARCHAR(20),
cep VARCHAR(10),
data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Modificar tabela usuários para adicionar clinica_id
ALTER TABLE usuarios ADD COLUMN clinica_id INT;

-- Criar a FOREIGN KEY (chave estrangeira)
ALTER TABLE usuarios 
ADD CONSTRAINT fk_usuarios_clinica 
FOREIGN KEY (clinica_id) 
REFERENCES clinicas(id);

-- Índice para buscar clínica por CNPJ
CREATE INDEX idx_clinicas_cnpj ON clinicas(cnpj);

-- Índice para buscar usuários por clínica
CREATE INDEX idx_usuarios_clinica ON usuarios(clinica_id);

USE neurosync;

CREATE TABLE IF NOT EXISTS recuperacao_senha (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expira_em DATETIME NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_token_recuperacao ON recuperacao_senha(token);
CREATE INDEX idx_usuario_recuperacao ON recuperacao_senha(usuario_id);











-- Seletores
SELECT * FROM usuarios;
SHOW INDEX FROM usuarios;
SELECT * FROM clinicas;
SHOW TABLES;
DESCRIBE usuarios;
DELETE FROM clinicas WHERE id = 2;


-- Comando para ver usuários e suas clínicas
SELECT 
    u.id,
    u.nome,
    u.email,
    u.perfil,
    c.nome_fantasia AS clinica,
    c.cnpj
FROM usuarios u
LEFT JOIN clinicas c ON u.clinica_id = c.id;

SELECT id, nome, email, senha_hash FROM usuarios;


