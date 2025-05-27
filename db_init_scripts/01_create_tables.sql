-- Tabela de Usuários (Administradores e Clientes)
-- Remova a tabela existente se precisar recriá-la (CUIDADO: APAGA OS DADOS)
-- DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255), -- Já era NULLABLE, admin pode preencher
    email VARCHAR(255) UNIQUE, -- TORNOU-SE NULLABLE
    password VARCHAR(255), -- TORNOU-SE NULLABLE
    cpf VARCHAR(11) UNIQUE NOT NULL, -- Permanece NOT NULL e UNIQUE
    phone VARCHAR(11), -- Já era NULLABLE, admin pode preencher

    -- NOVOS CAMPOS DE ENDEREÇO (todos opcionais no nível do DB, validação na app)
    cep VARCHAR(9), -- Ex: '12345-678'
    estado VARCHAR(100),
    cidade VARCHAR(100),
    bairro VARCHAR(100),

    role VARCHAR(10) NOT NULL DEFAULT 'client', -- 'client' ou 'admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Ordens de Serviço (sem alterações diretas aqui, mas depende do CPF)
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    client_cpf VARCHAR(11) NOT NULL, -- Chave para vincular ao usuário eventualmente
    client_name VARCHAR(255) NOT NULL,    -- Nome do cliente no momento da OS
    client_phone VARCHAR(11),           -- Telefone do cliente no momento da OS
    equipment_type VARCHAR(100) NOT NULL,
    service_type VARCHAR(100),
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'received',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    admin_id INTEGER,
    photo_url VARCHAR(255),
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL -- Se o admin for deletado, o admin_id do serviço fica nulo
    -- Não há FOREIGN KEY direta de services.client_cpf para users.cpf aqui,
    -- pois um serviço pode ser criado para um CPF antes do usuário se registrar.
);

-- Índices para otimizar consultas
CREATE INDEX idx_services_client_cpf ON services(client_cpf);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_users_email ON users(email); -- Mantém índice mesmo sendo NULLABLE
CREATE INDEX idx_users_cpf ON users(cpf);
CREATE INDEX idx_users_phone ON users(phone);

-- Trigger para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- Criação do Usuário Administrador (Exemplo)
-- A senha aqui está em texto plano. Em produção, deve ser um hash.
-- O sistema de login/registro no app.js precisa ser adaptado para usar bcrypt para o admin também, se desejar.
INSERT INTO users (name, email, password, cpf, phone, role)
VALUES (
    'Administrador',                                                        -- Nome do administrador
    'admin@techfix.com',                                                    -- Email para login
    '$2a$10$PtxJ20ECgo.bYfhEzezDguVGc8wOc/eQZje0X0MZVNlg.U7gMC6TS',         -- Senha ===== 12345678 
    '00000000000',                                                          -- CPF fictício para o admin (deve ser único)
    '00000000000',                                                          -- Telefone fictício
    'admin'                                                                 -- Papel do usuário
) ON CONFLICT (cpf) DO NOTHING; -- Não insere se o CPF do admin já existir