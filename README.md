# Node.js API Template

> A Node.js API template with Express, TypeScript and PostgreSQL

[![CI](https://github.com/miikkaylisiurunen/template-node-express/actions/workflows/ci.yml/badge.svg)](https://github.com/miikkaylisiurunen/template-node-express/actions/workflows/ci.yml)

## Table of contents

- [Features](#features)
- [How to use](#how-to-use)
  - [Requirements](#requirements)
  - [Getting started](#getting-started)
  - [Scripts](#scripts)
  - [Default routes](#default-routes)
- [Directory structure](#directory-structure)
- [Consistent error handling](#consistent-error-handling)
  - [Throwing consistent errors](#throwing-consistent-errors)
  - [Error handler middleware](#error-handler-middleware)
- [Testing](#testing)
  - [Running tests](#running-tests)
  - [Automated tests](#automated-tests)
- [Continuous integration](#continuous-integration)

## Features

- Continuous integration with GitHub Actions
- Type safety enforced with TypeScript to minimize errors and improve maintainability
- Custom error handling for better user experience and efficient bug tracking
- Tests powered by [Vitest](https://vitest.dev/) and [Supertest](https://github.com/ladjs/supertest)
- Runtime validation with [Zod](https://zod.dev/) to ensure data quality and consistency
- Database migrations using [node-pg-migrate](https://github.com/salsita/node-pg-migrate) for efficient database management
- Basic request and error logging using [Pino](https://getpino.io/)
- Dockerfile for easy deployment and containerization
- Dependency injection for better testability and decoupling of code components
- Docker Compose for convenient development database setup
- Dependabot integration for automatic npm package updates and improved security
- Code formatting and linting with [Prettier](https://prettier.io) and [ESLint](https://eslint.org/) to improve code quality and consistency
- Environment variable validation

## Como usar

### Pré-requisitos

- Node.js v20 ou superior
- Docker

### Primeiros passos

1. Clone o repositório:
   ```bash
   git clone https://github.com/Kethelems/campus-events-api.git
   ```
2. Entre na pasta do projeto:
   ```bash
   cd campus-events-api
   ```
3. Copie o `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

   > **Importante:** o `.env.example` já vem com um valor padrão de `DATABASE_URL` compatível com o Docker Compose local — só troque se for usar outro banco. A aplicação valida essa variável na inicialização e encerra o processo com um erro claro caso ela não esteja definida.

4. Instale as dependências:
   ```bash
   npm install
   ```
5. Suba os serviços do banco de dados com Docker Compose:
   ```bash
   npm run db:up
   ```
6. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
7. Para rodar os testes:
   ```bash
   npm test
   ```

   > **Nota:** os testes usam um banco separado (`postgres-test`), já configurado via `TEST_DATABASE_URL` no `.env.example`. Certifique-se de que o Docker está rodando antes de executar os testes.

> **Nota:** Se você alterar as credenciais do banco no `.env` ou no `docker-compose.yml`, atualize os dois arquivos com os mesmos valores, senão a aplicação não vai conseguir se conectar ao banco.

### Scripts

| Script       | Descrição                                               |
|--------------|---------------------------------------------------------|
| `start`      | inicia o servidor em modo produção                      |
| `dev`        | inicia o servidor em modo desenvolvimento               |
| `build`      | compila o projeto usando o `tsc`                        |
| `lint`       | verifica problemas de ESLint                            |
| `lint:fix`   | corrige problemas de ESLint automaticamente             |
| `test`       | executa os testes                                       |
| `db:up`      | sobe os serviços de banco de dados via Docker Compose   |
| `db:down`    | para e remove os serviços de banco de dados             |

### Rotas padrão

```
GET /people         # retorna todas as pessoas cadastradas no banco
POST /people        # cadastra uma nova pessoa (campos obrigatórios: "name" e "age")

GET /health         # verificação básica de saúde da API
GET /health/deep    # verificação completa (status da API + conexão com o banco)
```

## Directory structure

```
.
├── .github          # CI workflows and dependabot config to keep npm packages up to date
├── migrations       # database migration scripts
└── src
    ├── controllers  # route controllers
    ├── database     # database queries, tests and file to run migrations
    ├── errors       # custom errors for easier error handling
    ├── middleware   # middleware functions
    └── routes       # routes and their tests
```

## Consistent error handling

### Throwing consistent errors

To ensure consistent error responses and HTTP status codes, use the `HttpError` class when throwing an error. This custom error class is included in the template and provides a straightforward way to throw errors.

### Error handler middleware

An error handling middleware is included to handle and send consistent responses when errors occur. By default, the error response format is as follows:

```json
{
  "status": 401,
  "message": "Unauthorized",
  "name": "HttpError"
}
```

You can specify your own `status` and `message` when using the custom `HttpError` class to throw errors. A catch-all error handler is also included which returns a `500` status code whenever an unhandled error is thrown.

## Testing

This template comes with tests powered by [Vitest](https://vitest.dev) and [Supertest](https://github.com/ladjs/supertest) to ensure the quality and stability of your application through unit and integration testing.

### Running tests

You can manually run tests with the following command:

```
npm test
```

This command will run all tests in the `src` directory and output the results to the console.

### Automated tests

A GitHub Actions workflow is included to automatically run tests. Refer to the [Continuous integration](#continuous-integration) section for more information.

## Continuous integration

This template comes with pre-configured GitHub Actions workflows to automate continuous integration (CI) and ensure that your code is always tested before being merged into the main branch. The workflows run automatically on every push to the `main` branch, or when a pull request is opened, reopened, or synchronized.

The workflows included are:

- `ci.yml` - Runs tests and builds the project, preventing issues and bugs from making their way into production.
- `lint.yml` - Runs ESLint to find linting issues, ensuring that your code is always in compliance with your ESLint rules, which can improve code quality and consistency.

Additionally, a `dependabot.yml` configuration is included and run automatically on a weekly basis. It detects outdated npm packages and creates pull requests to update them, ensuring that your npm packages are always up to date, which can improve security and prevent bugs caused by outdated packages.
