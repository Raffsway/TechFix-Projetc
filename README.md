# TechFix - Sistema de Gerenciamento de Serviços de Reparo

## Descrição

O **TechFix** é um sistema web para gerenciamento de usuários (administradores e clientes) e ordens de serviço para reparo, montagem e manutenção de computadores. Ele oferece uma interface para administradores gerenciarem os serviços e para clientes acompanharem o status de suas solicitações.

## Funcionalidades Principais

### 1. Usuários
* **Administrador (Admin):** Gerencia todo o sistema, cadastra novas ordens de serviço, atualiza status, e gerencia informações de clientes vinculadas aos serviços.
* **Cliente:** Pode se cadastrar para acompanhar o status dos serviços associados ao seu CPF e atualizar seus dados de perfil.

### 2. Fluxo do Sistema
* **Criação de Serviço (Admin):**
    * Um administrador, através da página "Novo Serviço" (`new-service.html`), cadastra uma nova ordem de serviço.
    * Neste formulário, são inseridos o **Nome do Cliente**, **Telefone do Cliente**, **CPF do Cliente**, tipo de equipamento, tipo de serviço, descrição do problema e, opcionalmente, uma foto do equipamento.
    * Estes dados são salvos na tabela `services`, incluindo `client_name` e `client_phone` diretamente.
* **Cadastro de Cliente (`signup.html`):**
    * Clientes podem se cadastrar usando **CPF, Email e Senha**. Os campos Nome e Telefone foram removidos deste formulário.
    * **Condição para Cadastro:** O CPF fornecido pelo cliente deve já possuir pelo menos uma ordem de serviço registrada no sistema.
    * O nome do usuário na tabela `users` será `NULL` ou um valor gerado (ex: parte do email) se não for fornecido um nome padrão no backend e a coluna `name` for `NULLABLE`.
* **Login (`login.html`):**
    * Usuários (admins e clientes) fazem login com email e senha.
    * Após o login, o sistema armazena um token JWT e os dados do usuário (incluindo nome, email, cpf, role e telefone, se disponíveis) no `localStorage`.
* **Painel do Administrador (`admin-dashboard.html`):**
    * Visualiza todas as ordens de serviço.
    * Pode filtrar serviços por status, data ou buscar por cliente/equipamento.
    * Altera o status dos serviços.
    * Visualiza detalhes do serviço, incluindo a foto do equipamento e os dados do cliente (nome, telefone, CPF) informados na criação do serviço.
    * Exclui ordens de serviço (o que também remove a foto associada do servidor).
* **Painel do Cliente (`client-dashboard.html`):**
    * Visualiza os serviços associados ao seu CPF.
    * Pode ver detalhes de cada serviço, incluindo a foto do equipamento.
* **Atualização de Perfil (`update-profile.html`):**
    * Usuários logados (admins e clientes) podem atualizar seu nome, email e telefone.
    * Podem opcionalmente alterar a senha, fornecendo a senha atual.
    * O campo de telefone é pré-preenchido se o dado existir no `localStorage` (obtido durante o login).
* **Upload de Fotos:**
    * Na criação de um novo serviço, o administrador pode fazer upload de uma foto do equipamento.
    * Tipos de imagem aceitos: JPEG, JPG, PNG, GIF. A validação ocorre no frontend e no backend (`multer` `fileFilter`).
    * As fotos são salvas em `public/uploads/service_photos/` e o caminho é armazenado na tabela `services`.
    * As fotos são exibidas nos modais de detalhes do serviço nos painéis de admin e cliente.

## Configuração e Uso

### Pré-requisitos
* Node.js (versão 14.x ou superior recomendada)
* npm (geralmente vem com o Node.js)
* PostgreSQL (servidor de banco de dados)
* Docker e Docker Compose (Opcional, mas recomendado para gerenciar o PostgreSQL, conforme `docker-compose.yml`)

### 1. Configuração do Ambiente
1.  **Clone o repositório (se aplicável) ou extraia os arquivos do projeto.**
2.  **Variáveis de Ambiente:**
    * Crie um arquivo `.env` na raiz do projeto (`TECHFIX/.env`).
    * Copie o conteúdo de um `.env.example` (se houver) ou adicione as seguintes variáveis, ajustando os valores conforme sua configuração:
        ```dotenv
        DB_USER=seu_usuario_pg
        DB_HOST=localhost
        DB_NAME=techfix_db
        DB_PASSWORD=sua_senha_pg
        DB_PORT=5432
        JWT_SECRET=seuSegredoSuperSecretoParaDesenvolvimentoNumerosLetras!@#$
        NODE_ENV=development
        PORT=3000
        ```
    * **Importante:** `JWT_SECRET` deve ser uma string longa, complexa e secreta em um ambiente de produção.
3.  **Instale as Dependências do Backend:**
    Navegue até a pasta raiz do projeto no terminal e rode:
    ```bash
    npm install
    ```
    Isso instalará `express`, `cors`, `jsonwebtoken`, `pg`, `dotenv`, e `multer`.

### 2. Configuração do Banco de Dados
1.  **Inicie o PostgreSQL:**
    * **Usando Docker (Recomendado):**
        * Certifique-se de que o Docker e o Docker Compose estejam instalados.
        * Na raiz do projeto (onde está o `docker-compose.yml`), rode:
            ```bash
            docker-compose up -d
            ```
        Isso iniciará um container PostgreSQL com as configurações do seu arquivo `.env`. O volume `postgres_data` persistirá os dados.
    * **Instalação Manual:** Se você tem o PostgreSQL instalado localmente, certifique-se de que ele esteja rodando e crie um banco de dados e um usuário com as credenciais especificadas no seu arquivo `.env`.
2.  **Crie as Tabelas:**
    * Conecte-se ao seu banco de dados PostgreSQL (usando `psql`, pgAdmin, DBeaver, etc.).
    * Execute o script SQL fornecido em `db_init_scripts/01_create_tables.sql` para criar as tabelas `users` e `services` com os índices e triggers. Certifique-se de usar a versão mais recente do script que inclui `client_name` e `client_phone` na tabela `services` e `name` como `NULLABLE` na tabela `users`.
3.  **(Opcional) Inserir Usuário Administrador Inicial:**
    Para poder usar o sistema, você precisará de um usuário administrador. Execute o seguinte o docker compose que ele iria subir uma conta de administrador para testar funcionalidades. Assim que executar a conta de usuario é ``email=admin@techfix.com`` e ``senha=desenvolvimentoWeb@2025.1``

### 3. Iniciando o Servidor Backend
Na raiz do projeto, rode:
```bash
node src/backend/server.js
```
Ou, se tiver configurado um script no `package.json` (ex: `npm start` ou `npm run dev`).
O servidor deverá iniciar na porta especificada no `.env` (padrão 3000).

### 4. Acessando a Aplicação
1.  **Landing Page:** Abra seu navegador e acesse `http://localhost:3000` (ou a porta configurada). Você verá a `index.html`.
2.  **Login:**
    * Clique em "Login". Você será redirecionado para `login.html`.
    * Use as credenciais do administrador que você inseriu (ex: `admin@techfix.com` / `admin123`).
    * Após o login, você será redirecionado para o Painel Administrativo (`/admin` ou `/admin-dashboard.html`).
3.  **Criando um Novo Serviço (Admin):**
    * No painel do administrador, clique em "Novo Serviço". Você será levado para `new-service.html`.
    * Preencha os dados do cliente (Nome, Telefone, CPF) e os detalhes do serviço.
    * Opcionalmente, adicione uma foto.
    * Clique em "Enviar Solicitação". O serviço será criado e listado no painel.
4.  **Cadastro de Cliente:**
    * Um cliente pode se cadastrar através da página `signup.html`.
    * Eles precisarão fornecer CPF, Email e Senha.
    * **Importante:** O CPF fornecido deve corresponder a um serviço já existente no sistema, caso contrário o cadastro falhará.
    * Após o cadastro e login, o cliente será redirecionado para o Painel do Cliente (`/cliente` ou `/client-dashboard.html`).
5.  **Atualização de Perfil:**
    * Tanto administradores quanto clientes podem acessar a página "Atualizar Dados" (geralmente a partir do menu de usuário no cabeçalho) para modificar seu nome, email, telefone e senha.

### Estrutura de Pastas Relevantes
* `public/`: Contém todos os arquivos frontend (HTML, CSS, JS cliente, imagens).
    * `public/html/`: Páginas HTML.
    * `public/js/`: Scripts JavaScript do lado do cliente.
    * `public/css/`: Arquivos de estilo CSS.
    * `public/uploads/service_photos/`: Onde as fotos dos serviços são armazenadas pelo backend (este diretório precisa ser criado).
* `src/backend/`: Contém a lógica do servidor Node.js.
    * `src/backend/app.js`: Configuração principal do Express, rotas da API, middlewares.
    * `src/backend/server.js`: Inicia o servidor Express.
    * `src/backend/db.js`: Configuração da conexão com o banco de dados PostgreSQL.
* `db_init_scripts/`: Scripts SQL para inicialização do banco.

### Pontos de Atenção
* **Senhas:** As senhas estão sendo armazenadas e comparadas em texto plano no backend. Em um ambiente de produção, é **crucial** implementar hashing de senhas (ex: usando `bcryptjs`).
* **Validação de Dados:** Embora haja alguma validação no frontend e backend, ela pode ser expandida para maior robustez (ex: formatos de email mais estritos, validação de CPF mais completa, sanitização de inputs).
* **Tratamento de Erros:** O tratamento de erros foi melhorado, mas pode ser ainda mais detalhado para fornecer feedback específico ao usuário em todas as situações.
* **Segurança:** Considere medidas de segurança adicionais para produção, como HTTPS, rate limiting, proteção contra XSS, CSRF, etc.
