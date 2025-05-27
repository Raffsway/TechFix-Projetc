# TechFix - Sistema de Gerenciamento de Serviços de Reparo

## Descrição

O **TechFix** é um sistema web projetado para facilitar o gerenciamento de ordens de serviço de reparo, montagem e manutenção de computadores. Ele serve como uma plataforma centralizada para administradores controlarem os serviços e para clientes acompanharem o progresso de suas solicitações, além de gerenciar seus dados de perfil.

## Funcionalidades Principais

### 1. Gestão de Usuários
* **Administrador (Admin):** Possui controle total sobre o sistema. É responsável por cadastrar novas ordens de serviço, atualizar o status dos atendimentos e gerenciar as informações dos clientes vinculadas a esses serviços.
* **Cliente:** Pode se registrar na plataforma para visualizar e acompanhar o status dos serviços associados ao seu CPF. Também tem a capacidade de atualizar seus dados cadastrais, como nome, email, telefone, endereço e senha.

### 2. Fluxo do Sistema e Operações
* **Criação de Nova Ordem de Serviço (Admin):**
    * Através da página "Novo Serviço" (`new-service.html`), o administrador insere os detalhes da solicitação.
    * O formulário inclui campos para o CPF do cliente (que, se já cadastrado, preenche automaticamente nome e telefone), nome e telefone do cliente (caso seja um novo CPF ou para confirmação), tipo de equipamento, tipo de serviço, descrição detalhada do problema e, opcionalmente, uma foto do equipamento.
    * As informações do cliente (nome, telefone) são armazenadas diretamente na tabela `services` junto com o `client_cpf`.
* **Cadastro de Novo Cliente (`signup.html`):**
    * Clientes realizam o cadastro fornecendo CPF, Email e Senha.
    * **Condição Essencial para Cadastro:** É necessário que o CPF informado já possua ao menos uma ordem de serviço registrada no sistema. Esta validação é feita no backend.
    * Se o CPF já existir na tabela `users` (por exemplo, devido a um pré-cadastro pelo admin ou uma OS antiga) mas sem email/senha, o processo de cadastro atualiza o registro existente, adicionando o email e a senha criptografada.
    * Dados adicionais como nome, telefone e endereço podem ser inseridos ou atualizados pelo cliente na tela "Atualizar Perfil" após o login.
* **Login de Usuários (`login.html`):**
    * Tanto administradores quanto clientes acessam o sistema utilizando email e senha.
    * Após um login bem-sucedido, um token JWT é gerado e armazenado no `localStorage` do navegador, juntamente com os dados do usuário (nome, email, CPF, função, telefone e informações de endereço, se disponíveis).
* **Painel Administrativo (`admin-dashboard.html`):**
    * Exibe uma lista paginada de todas as ordens de serviço cadastradas.
    * Permite a filtragem dos serviços por status (Recebido, Em análise, Em manutenção, Finalizado), data de criação, ou através de uma busca por nome/CPF do cliente, ID da OS ou tipo de equipamento.
    * Oferece a funcionalidade de alterar o status de cada serviço.
    * Apresenta os detalhes completos de um serviço em um modal, incluindo a foto do equipamento (se houver) e os dados do cliente associados à OS.
    * Permite a exclusão de ordens de serviço. Esta ação também remove a foto do equipamento do servidor, caso exista.
    * Contém links diretos para as funcionalidades "Novo Cliente" e "Novo Serviço".
* **Adicionar Novo Cliente (Admin) (`add-client.html`):**
    * Administradores podem realizar um pré-cadastro de clientes, fornecendo CPF, Nome Completo, Telefone (opcional) e Endereço (opcional: CEP, estado, cidade, bairro).
    * Um cliente pré-cadastrado desta forma não terá email ou senha definidos. Ele precisará completar seu registro através da página "Cadastre-se" para ativar o acesso à sua conta.
    * O sistema verifica a existência do CPF no banco para evitar cadastros duplicados durante esta operação.
* **Painel do Cliente (`client-dashboard.html`):**
    * Exibe uma lista paginada dos serviços de manutenção associados exclusivamente ao CPF do cliente logado.
    * Permite ao cliente filtrar seus serviços por status, data de solicitação ou buscar por ID do serviço/tipo de equipamento.
    * Visualização dos detalhes de cada serviço em um modal, incluindo a foto do equipamento (se houver).
* **Atualização de Perfil (`update-profile.html`):**
    * Disponível para administradores e clientes logados, permite a modificação de dados pessoais como nome, email e telefone.
    * Usuários também podem atualizar suas informações de endereço (CEP, estado, cidade, bairro).
    * Funcionalidade para alterar ou definir a senha. Caso uma senha já exista, a senha atual será solicitada para permitir a alteração. Se for o primeiro acesso do usuário ou se a senha ainda não estiver definida (ex: cliente pré-cadastrado pelo admin), a senha atual não é necessária.
    * Integração com a API ViaCEP para preenchimento automático de endereço a partir do CEP.
* **Upload e Gerenciamento de Fotos de Equipamentos:**
    * Ao criar um novo serviço, o administrador tem a opção de anexar uma foto do equipamento.
    * Formatos de imagem suportados: JPEG, JPG, PNG, GIF, com tamanho máximo de 5MB. As validações ocorrem tanto no frontend quanto no backend (utilizando `multer`).
    * As imagens são armazenadas no diretório `public/uploads/service_photos/` no servidor, e o caminho relativo é salvo na tabela `services`.
    * As fotos são exibidas nos modais de detalhes do serviço, tanto no painel do administrador quanto no do cliente.

## Estrutura do Projeto

* **`public/`**: Contém todos os arquivos estáticos acessíveis pelo cliente (frontend).
    * `css/`: Folhas de estilo (ex: `global.css`, `landing-page.css`).
    * `html/`: Arquivos HTML das diversas páginas da aplicação.
    * `js/`: Scripts JavaScript executados no lado do cliente (ex: `authService.js`, `adminDashboard.js`, `clientDashboard.js`, `utils.js`).
    * `uploads/service_photos/`: Diretório para armazenamento das fotos dos equipamentos (criado dinamicamente pelo backend se não existir).
    * `index.html`: A página inicial (landing page) da aplicação.
* **`src/`**: Diretório contendo o código-fonte do backend e scripts auxiliares.
    * `backend/`: Lógica do servidor Node.js.
        * `app.js`: Arquivo principal de configuração do Express, definição de rotas da API e middlewares.
        * `server.js`: Script responsável por iniciar o servidor Express.
        * `db.js`: Módulo para configuração e exportação da conexão com o banco de dados PostgreSQL.
    * `hash.js`: Script utilitário para gerar hashes de senha Bcrypt manualmente (usado para preparar a senha do admin para o script SQL inicial).
* **`db_init_scripts/`**: Contém scripts SQL para a inicialização e configuração do banco de dados.
    * `01_create_tables.sql`: Script SQL para criar as tabelas `users` e `services`, definir índices, triggers e inserir o usuário administrador padrão com dados iniciais.
* **`.env`**: Arquivo para armazenar variáveis de ambiente (deve ser criado manualmente a partir de um exemplo ou com as configurações necessárias e não deve ser versionado).
* **`docker-compose.yml`**: Arquivo de configuração para orquestração do contêiner do serviço PostgreSQL usando Docker Compose.
* **`package.json`**: Arquivo de manifesto do projeto Node.js, listando metadados, dependências e scripts.
* **`package-lock.json`**: Registra as versões exatas das dependências instaladas para garantir a reprodutibilidade do ambiente.

## Configuração e Uso

### Pré-requisitos
* Node.js (versão 14.x ou superior é recomendada)
* npm (geralmente instalado junto com o Node.js)
* Servidor de Banco de Dados PostgreSQL
* Docker e Docker Compose (altamente recomendado para facilitar a configuração e gerenciamento do PostgreSQL, conforme definido no `docker-compose.yml`)

### 1. Configuração Inicial do Ambiente
1.  **Obtenha os Arquivos do Projeto:** Clone o repositório ou extraia os arquivos para o seu ambiente de desenvolvimento.
2.  **Configure as Variáveis de Ambiente:**
    * Na raiz do projeto (`TECHFIX/`), crie um arquivo chamado `.env`.
    * Popule este arquivo com as variáveis necessárias para a execução do backend e conexão com o banco de dados. Exemplo:
        ```dotenv
        DB_USER=seu_usuario_pg_aqui
        DB_HOST=localhost # Se não usar Docker, ou o nome do serviço Docker, ex: postgres-db
        DB_NAME=techfix_db
        DB_PASSWORD=sua_senha_pg_aqui
        DB_PORT=5432 # Porta padrão do PostgreSQL
        JWT_SECRET=umSegredoMuitoForteParaSeuTokenJWT!ComCaracteresEspeciais123
        NODE_ENV=development # ou production
        PORT=3000 # Porta em que o servidor backend irá rodar
        ```
    * **Atenção:** O `JWT_SECRET` deve ser uma string longa, aleatória e complexa, especialmente em ambientes de produção.
3.  **Instale as Dependências do Backend:**
    Abra um terminal na pasta raiz do projeto e execute o comando:
    ```bash
    npm install
    ```
    Este comando instalará todas as dependências listadas no `package.json` (como Express, pg, bcryptjs, jsonwebtoken, multer, cors, dotenv).

### 2. Configuração do Banco de Dados PostgreSQL
1.  **Inicie o Serviço PostgreSQL:**
    * **Utilizando Docker (Recomendado):**
        * Com Docker e Docker Compose instalados, navegue até a raiz do projeto no terminal.
        * Execute o comando:
            ```bash
            docker-compose up -d
            ```
        Este comando irá baixar a imagem do PostgreSQL (se ainda não existir localmente), criar e iniciar um contêiner com as configurações definidas no `docker-compose.yml` e no seu arquivo `.env`. O volume `postgres_data` será criado para persistir os dados do banco.
    * **Instalação Manual:** Caso opte por uma instalação local do PostgreSQL, certifique-se de que o serviço esteja em execução. Crie um banco de dados e um usuário correspondentes às credenciais fornecidas no arquivo `.env`.
2.  **Criação das Tabelas e Inserção do Usuário Administrador:**
    * **Com Docker:** Na primeira vez que o contêiner do PostgreSQL é iniciado com um volume de dados vazio, os scripts SQL localizados no diretório `db_init_scripts` (montado em `/docker-entrypoint-initdb.d` dentro do contêiner) são executados automaticamente. O script `01_create_tables.sql` se encarregará de criar a estrutura das tabelas (`users`, `services`), índices, triggers e inserir um usuário administrador padrão.
    * **Credenciais do Administrador Padrão (definidas em `01_create_tables.sql`):**
        * **Email:** `admin@techfix.com`
        * **Senha:** `12345678`
        * **Nota Importante sobre a Senha do Admin:** O script `01_create_tables.sql` insere esta senha como texto plano. Para um ambiente seguro (mesmo de desenvolvimento avançado ou produção), você **DEVE** gerar um hash bcrypt para a senha desejada usando o script `src/hash.js` e substituir o valor `'12345678'` no arquivo SQL pelo hash gerado **ANTES** de inicializar o banco de dados pela primeira vez.
    * **Execução Manual do Script SQL:** Se não estiver usando Docker para a inicialização automática ou se precisar recriar as tabelas, conecte-se ao seu banco de dados PostgreSQL (usando `psql`, pgAdmin, DBeaver, etc.) e execute o conteúdo do arquivo `db_init_scripts/01_create_tables.sql`.

### 3. Iniciando o Servidor Backend
Com o banco de dados configurado e em execução, inicie o servidor Node.js. No terminal, a partir da raiz do projeto, execute:
```bash
npm start