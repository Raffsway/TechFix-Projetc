# TechFix - Sistema de Gerenciamento de Serviços de Reparo

## Descrição

O **TechFix** é um sistema web para gerenciamento de usuários (administradores e clientes) e ordens de serviço para reparo, montagem e manutenção de computadores. Ele oferece uma interface para administradores gerenciarem os serviços e para clientes acompanharem o status de suas solicitações e atualizarem seus perfis.

## Funcionalidades Principais

### 1. Usuários
* **Administrador (Admin):** Gerencia todo o sistema, cadastra novas ordens de serviço, atualiza status, e gerencia informações de clientes.
* **Cliente:** Pode se cadastrar para acompanhar o status dos serviços associados ao seu CPF e atualizar seus dados de perfil (nome, email, telefone, endereço e senha).

### 2. Fluxo do Sistema
* **Criação de Serviço (Admin):**
    * Um administrador, através da página "Novo Serviço" (`new-service.html`), cadastra uma nova ordem de serviço.
    * Neste formulário, são inseridos o CPF do Cliente (que busca dados se o cliente já existir ou libera campos para novo cadastro), Nome do Cliente, Telefone do Cliente, tipo de equipamento, tipo de serviço, descrição do problema e, opcionalmente, uma foto do equipamento.
    * Os dados do cliente (nome, telefone) são salvos diretamente na tabela `services` junto com o `client_cpf`.
* **Cadastro de Cliente (`signup.html`):**
    * Clientes podem se cadastrar usando CPF, Email e Senha.
    * **Condição para Cadastro:** O CPF fornecido pelo cliente deve já possuir pelo menos uma ordem de serviço registrada no sistema (essa lógica está no backend). Se o CPF já existir na tabela `users` mas sem email/senha (pré-cadastro pelo admin ou em OS antiga), o cadastro atualiza o registro existente com email e senha criptografada.
    * Os dados de nome, telefone e endereço podem ser preenchidos posteriormente pelo cliente na tela "Atualizar Perfil".
* **Login (`login.html`):**
    * Usuários (admins e clientes) fazem login com email e senha.
    * Após o login, o sistema armazena um token JWT e os dados do usuário (incluindo nome, email, cpf, role, telefone, e dados de endereço, se disponíveis) no `localStorage`.
* **Painel do Administrador (`admin-dashboard.html`):**
    * Visualiza todas as ordens de serviço com paginação.
    * Pode filtrar serviços por status, data ou buscar por cliente (nome/CPF), ID da OS ou equipamento.
    * Altera o status dos serviços (Recebido, Em análise, Em manutenção, Finalizado).
    * Visualiza detalhes do serviço em um modal, incluindo a foto do equipamento e os dados do cliente (nome, telefone, CPF) informados na criação do serviço.
    * Exclui ordens de serviço (o que também remove a foto associada do servidor, se existir).
    * Links para "Novo Cliente" e "Novo Serviço".
* **Adicionar Novo Cliente (Admin) (`add-client.html`):**
    * Administradores podem pré-cadastrar clientes informando CPF, Nome Completo, Telefone (opcional) e Endereço (opcional).
    * O cliente pré-cadastrado não terá email ou senha definidos; ele precisará usar a tela de "Cadastre-se" para ativar sua conta.
    * O sistema verifica se o CPF já existe para evitar duplicidade na criação.
* **Painel do Cliente (`client-dashboard.html`):**
    * Visualiza os serviços associados ao seu CPF com paginação.
    * Pode filtrar seus serviços por status, data ou buscar por ID/equipamento.
    * Pode ver detalhes de cada serviço em um modal, incluindo a foto do equipamento.
* **Atualização de Perfil (`update-profile.html`):**
    * Usuários logados (admins e clientes) podem atualizar seu nome, email, telefone, e os campos de endereço (CEP, estado, cidade, bairro).
    * Podem opcionalmente alterar/definir a senha. Se uma senha já existir, a senha atual é necessária para alterá-la. Se for o primeiro acesso ou se a senha não estiver definida, a senha atual não é exigida.
    * A busca de endereço por CEP (ViaCEP) está implementada.
* **Upload de Fotos:**
    * Na criação de um novo serviço, o administrador pode fazer upload de uma foto do equipamento.
    * Tipos de imagem aceitos: JPEG, JPG, PNG, GIF (Máx 5MB). A validação ocorre no frontend e no backend (`multer` `fileFilter`).
    * As fotos são salvas em `public/uploads/service_photos/` e o caminho relativo é armazenado na tabela `services`.
    * As fotos são exibidas nos modais de detalhes do serviço nos painéis de admin e cliente.

## Estrutura do Projeto

* `public/`: Contém todos os arquivos frontend.
    * `css/`: Arquivos CSS (global.css, landing-page.css).
    * `html/`: Páginas HTML da aplicação.
    * `js/`: Scripts JavaScript do lado do cliente (authService.js, adminDashboard.js, etc.).
    * `uploads/service_photos/`: Diretório onde as fotos dos serviços são armazenadas (criado pelo backend se não existir).
    * `index.html`: Landing page da aplicação.
* `src/`: Contém o código-fonte do backend e outros scripts.
    * `backend/`: Lógica do servidor Node.js.
        * `app.js`: Configuração principal do Express, rotas da API, middlewares.
        * `server.js`: Script para iniciar o servidor Express.
        * `db.js`: Configuração da conexão com o banco de dados PostgreSQL.
    * `hash.js`: Script utilitário para gerar hashes de senha Bcrypt.
* `db_init_scripts/`: Scripts SQL para inicialização do banco de dados.
    * `01_create_tables.sql`: Script para criar as tabelas `users` e `services`, índices e triggers, e inserir um usuário administrador padrão.
* `.env`: Arquivo para variáveis de ambiente (não versionado, crie a partir do exemplo).
* `docker-compose.yml`: Arquivo de configuração do Docker Compose para o serviço PostgreSQL.
* `package.json`: Define metadados do projeto, dependências e scripts.
* `package-lock.json`: Registra as versões exatas das dependências.

## Configuração e Uso

### Pré-requisitos
* Node.js (versão 14.x ou superior)
* npm (geralmente incluído com o Node.js)
* PostgreSQL (servidor de banco de dados)
* Docker e Docker Compose (Recomendado para gerenciar o PostgreSQL, conforme `docker-compose.yml`)

### 1. Configuração do Ambiente
1.  **Clone o repositório (se aplicável).**
2.  **Variáveis de Ambiente:**
    * Crie um arquivo `.env` na raiz do projeto (`TECHFIX/.env`).
    * Adicione as seguintes variáveis, ajustando os valores conforme sua configuração (consulte `src/backend/db.js` e `docker-compose.yml` para os nomes usados):
        ```dotenv
        DB_USER=seu_usuario_pg
        DB_HOST=localhost # Ou o nome do serviço Docker, ex: postgres-db
        DB_NAME=techfix_db
        DB_PASSWORD=sua_senha_pg
        DB_PORT=5432
        JWT_SECRET=seuSegredoSuperSecretoParaDesenvolvimentoNumerosLetras!@#$
        NODE_ENV=development
        PORT=3000
        ```
    * **Importante:** `JWT_SECRET` deve ser uma string longa, complexa e secreta em produção.
3.  **Instale as Dependências do Backend:**
    Navegue até a pasta raiz do projeto e execute:
    ```bash
    npm install
    ```
    Isso instalará as dependências listadas no `package.json` (express, cors, jsonwebtoken, pg, dotenv, bcryptjs, multer).

### 2. Configuração do Banco de Dados
1.  **Inicie o PostgreSQL:**
    * **Usando Docker (Recomendado):**
        * Certifique-se de que o Docker e o Docker Compose estejam instalados.
        * Na raiz do projeto (onde está o `docker-compose.yml`), execute:
            ```bash
            docker-compose up -d
            ```
        Isso iniciará um contêiner PostgreSQL. O volume `postgres_data` persistirá os dados. Os scripts em `db_init_scripts` serão executados automaticamente na primeira inicialização.
    * **Instalação Manual:** Se você tem o PostgreSQL instalado localmente, crie um banco de dados e um usuário com as credenciais do seu `.env`.
2.  **Criação das Tabelas e Usuário Admin:**
    * Se estiver usando Docker, o script `db_init_scripts/01_create_tables.sql` será executado automaticamente na primeira vez que o contêiner do banco for iniciado com um volume de dados vazio. Este script cria as tabelas e o usuário administrador inicial.
    * Se a configuração manual for usada ou se precisar recriar as tabelas, conecte-se ao seu banco PostgreSQL e execute o conteúdo de `db_init_scripts/01_create_tables.sql`.
    * **Credenciais do Administrador Padrão (conforme `01_create_tables.sql`):**
        * **Email:** `admin@techfix.com`
        * **Senha:** `12345678` (Esta senha está em texto plano no script SQL. Para produção, gere um hash bcrypt para esta senha usando `src/hash.js` e coloque o hash no script SQL antes de inicializar o banco pela primeira vez).

### 3. Iniciando o Servidor Backend
Na raiz do projeto, execute:
```bash
npm start