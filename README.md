# NeuroSync

Sistema de gestão para clínica psicológica, desenvolvido com **Next.js**, **React** e **TypeScript**.

## Requisitos

Antes de começar, instale:

- **Node.js 20 ou superior**
- **npm**
- **MySQL** ou **MariaDB**
- Opcional: **Docker** e **Docker Compose** para subir o banco mais rápido

## Passo a passo para rodar do zero

### 1. Clonar o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd neurosync
```

Substitua `<URL_DO_REPOSITORIO>` pela URL real do projeto.

### 2. Instalar as dependências

```bash
npm install
```

### 3. Criar o arquivo de ambiente

Copie o arquivo de exemplo:

```bash
copy .env.example .env
```

Depois, ajuste os valores do `.env` conforme o seu banco e e-mail.

Exemplo:

```env
MYSQL_HOST=localhost
MYSQL_USER=neurosync
MYSQL_PASSWORD=senha
MYSQL_DATABASE=neurosync
MYSQL_PORT=3306

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=example@dominio.com
EMAIL_PASS=senha

USE_EMAIL=false
```

Observações:

- Se usar **MySQL local**, mantenha a porta padrão do seu banco.
- Se usar o **Docker Compose** do projeto, o banco fica exposto em `localhost:3307`.
- Se não for configurar envio de e-mail no início, deixe `USE_EMAIL=false`.

### 4. Subir o banco de dados

#### Opção A: usando Docker Compose

```bash
docker compose up -d
```

Isso sobe um container de MariaDB com:

- banco: `neurosync`
- usuário: `neurosync_user`
- senha: `neurosync_pw`
- porta local: `3307`

Se usar essa opção, ajuste o `.env` para:

```env
MYSQL_HOST=localhost
MYSQL_USER=neurosync_user
MYSQL_PASSWORD=neurosync_pw
MYSQL_DATABASE=neurosync
MYSQL_PORT=3307
```

#### Opção B: usando MySQL/MariaDB local

Crie o banco manualmente com os dados que você definiu no `.env`.

Exemplo:

```sql
CREATE DATABASE neurosync CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Importar a estrutura do banco

O projeto inclui o arquivo `script.sql`, que cria as tabelas e parte da estrutura inicial.

Importe esse arquivo no banco configurado:

```bash
mysql -u SEU_USUARIO -p neurosync < script.sql
```

Ou importe o arquivo usando o cliente visual de sua preferência.

### 6. Rodar o projeto em desenvolvimento

```bash
npm run dev
```

Depois, abra:

```text
http://localhost:3000
```

### 7. Criar o primeiro acesso

Na primeira utilização, acesse a tela de cadastro e crie a clínica e o usuário inicial.

Depois, use esse usuário para entrar no sistema pela tela de login.

## Scripts disponíveis

```bash
npm run dev        # ambiente de desenvolvimento
npm run build      # gera build de produção
npm run start      # executa a aplicação em produção
npm run typecheck  # valida o TypeScript
npm run lint       # executa as verificações do Biome
npm run format     # formata os arquivos com o Biome
```

## Estrutura principal

- `app/` - páginas, rotas e componentes da aplicação
- `hooks/` - hooks compartilhados
- `lib/` - utilitários e integrações
- `migrations/` - scripts e ajustes de banco
- `public/` - arquivos estáticos

## Observações importantes

- O projeto usa **MySQL/MariaDB**.
- O login inicial depende de um cadastro válido de clínica/usuário.
- Ajuste as variáveis de ambiente antes de iniciar a aplicação.
- Se trocar a porta do banco, atualize também o arquivo `.env`.

