-- Tabela de Usuários (Administradores e Clientes)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255), -- Alterado para permitir NULL
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    cpf VARCHAR(11) UNIQUE NOT NULL,
    phone VARCHAR(11), -- Já era NULLABLE
    role VARCHAR(10) NOT NULL DEFAULT 'client', -- 'client' ou 'admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Ordens de Serviço
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    client_cpf VARCHAR(11) NOT NULL,
    client_name VARCHAR(255) NOT NULL,    -- NOVO CAMPO, ESSENCIAL
    client_phone VARCHAR(11),           -- NOVO CAMPO, OPCIONAL MAS COLETADO
    equipment_type VARCHAR(100) NOT NULL,
    service_type VARCHAR(100),
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'received',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    admin_id INTEGER,
    photo_url VARCHAR(255),
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Índices para otimizar consultas
CREATE INDEX idx_services_client_cpf ON services(client_cpf);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_users_email ON users(email);
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


-- Criação do Uusario Adminisatrador
INSERT INTO users (name, email, password, cpf, phone, role)
VALUES (
    'administrador',                    -- Nome do administrador
    'admin@techfix.com',                -- Email para login
    'desenvolvimentoWeb@2025.1',        -- Senha (em texto plano, conforme seu app.js)
    '00000000000',                      -- CPF fictício para o admin (deve ser único)
    '00000000000',                      -- Telefone fictício
    'admin'                             -- Papel do usuário
)
