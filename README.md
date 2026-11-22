# Campus Events API

[![CI](https://github.com/Kethelems/campus-events-api/actions/workflows/ci.yml/badge.svg)](https://github.com/Kethelems/campus-events-api/actions/workflows/ci.yml)
[![Lint](https://github.com/Kethelems/campus-events-api/actions/workflows/lint.yml/badge.svg)](https://github.com/Kethelems/campus-events-api/actions/workflows/lint.yml)

API REST para eventos acadêmicos do campus: cadastro de eventos, inscrições e regras de vagas.
Projeto integrador do curso de Tecnologia em Análise e Desenvolvimento de Sistemas (TADS), IFRS Campus Rio Grande, desenvolvido em dupla por **Julie Martins Monteiro** e **Kethelem Socoowski**.

- **Ambiente publicado:** https://campus-events-api-zdky.onrender.com
- **Repositório:** https://github.com/Kethelems/campus-events-api

## Sumário

1. [Objetivo e contexto](#1-objetivo-e-contexto)
2. [Funcionalidades](#2-funcionalidades)
3. [Tecnologias](#3-tecnologias)
4. [Arquitetura](#4-arquitetura)
5. [Configuração e execução local](#5-configuração-e-execução-local)
6. [Variáveis de ambiente](#6-variáveis-de-ambiente)
7. [Banco de dados](#7-banco-de-dados)
8. [Docker e Docker Compose](#8-docker-e-docker-compose)
9. [Endpoints](#9-endpoints)
10. [Testes](#10-testes)
11. [Integração Contínua](#11-integração-contínua)
12. [Ambiente publicado (Render)](#12-ambiente-publicado-render)
13. [Organização do desenvolvimento](#13-organização-do-desenvolvimento)
14. [Decisões técnicas](#14-decisões-técnicas)
15. [Dificuldades e soluções](#15-dificuldades-e-soluções)
16. [Limitações e evolução](#16-limitações-e-evolução)
17. [Estrutura de pastas](#17-estrutura-de-pastas)

---

## 1. Objetivo e contexto

Eventos acadêmicos (semanas acadêmicas, palestras, oficinas) têm número limitado de vagas. Quando as inscrições são controladas manualmente, por planilha ou formulário, é comum aparecerem inscrições duplicadas e mais inscritos do que lugares.

A **Campus Events API** resolve isso no backend: valida os dados de cada evento e aceita uma inscrição somente quando ainda há vaga e a pessoa não está inscrita.

O projeto também teve um objetivo pedagógico: praticar, ao longo do semestre, o ciclo profissional de desenvolvimento, com Issues, branches, Pull Requests, code review, testes automatizados, Integração Contínua, containers e deploy.

O ponto de partida foi o template [`template-node-express`](https://github.com/miikkaylisiurunen/template-node-express) (Node.js + Express + TypeScript + PostgreSQL). Sobre ele, a dupla adicionou as regras de eventos e inscrições, a validação de configuração, a evolução da pipeline e o deploy.

## 2. Funcionalidades

| Funcionalidade | Situação |
|---|---|
| Health checks de liveness (`/health`) e readiness com banco (`/health/deep`) | ✅ Implementado |
| Cadastro e listagem de pessoas, com validação via Zod | ✅ Implementado |
| Validação de eventos: nome e data obrigatórios, capacidade inteira maior que zero | ✅ Implementado |
| Regra de inscrição: bloqueia inscrição duplicada e evento lotado | ✅ Implementado e testado no domínio |
| Validação da `DATABASE_URL` na inicialização (*fail-fast*) | ✅ Implementado |
| Erros padronizados em JSON e logs de requisição com ID | ✅ Implementado |
| Persistência de eventos e inscrições no banco | ⚠️ Pendente (ver [Limitações](#16-limitações-e-evolução)) |

## 3. Tecnologias

| Categoria | Tecnologia |
|---|---|
| Linguagem / runtime | TypeScript 5, Node.js 22 (compatível com 20) |
| Framework HTTP | Express 5 |
| Banco de dados | PostgreSQL 17, driver `pg` |
| Migrations | node-pg-migrate |
| Validação | Zod |
| Logs | Pino + pino-http |
| Testes | Vitest + Supertest |
| Qualidade de código | ESLint + Prettier |
| Containers | Docker (multi-stage) e Docker Compose |
| CI | GitHub Actions, Dependency Review e Dependabot |
| Deploy | Render (Web Service Docker + Render PostgreSQL), via Blueprint `render.yaml` |

## 4. Arquitetura

A aplicação é organizada em camadas, com a regra de negócio isolada em funções puras:

```mermaid
flowchart LR
    C[Cliente<br/>Postman / curl] --> R[Rotas<br/>Express]
    R --> CT[Controllers]
    CT --> D[Domínio<br/>canRegister<br/>validateEventInput]
    CT --> Q[Queries<br/>SQL com pg]
    Q --> DB[(PostgreSQL 17)]
```

| Componente | Pasta | Responsabilidade |
|---|---|---|
| Rotas | `src/routes` | Mapeiam URL e método HTTP para o controller |
| Controllers | `src/controllers` | Leem a requisição, chamam domínio e banco, montam a resposta |
| Domínio | `src/domain` | Regras de negócio puras (`canRegister`, `validateEventInput`), sem Express e sem banco |
| Queries | `src/database` | Acesso ao PostgreSQL, pool de conexões e migrations |
| Middleware | `src/middleware` | Log de requisições (Pino, com `X-Request-Id`), rota 404 e tratamento central de erros |
| Erros | `src/errors` | Classe `HttpError` para respostas com status e mensagem consistentes |
| Configuração | `src/config.ts` | Lê o `.env` com dotenv, valida com Zod e encerra o processo se faltar `DATABASE_URL` |

**Injeção de dependência:** `makeApp({ queries, middleware })` recebe suas dependências por parâmetro. Assim, os testes usam o banco de teste e podem simular falhas (por exemplo, o banco fora do ar) sem alterar o código da aplicação.

**Inicialização** (`src/index.ts`): valida as variáveis de ambiente → aplica as migrations pendentes → cria logger, queries e middleware → sobe o servidor na porta configurada.

## 5. Configuração e execução local

### Pré-requisitos

- Node.js 20 ou superior (o arquivo `.nvmrc` indica a versão 22)
- Docker e Docker Compose
- Git

### Passo a passo

```bash
# 1. Clonar o repositório
git clone https://github.com/Kethelems/campus-events-api.git
cd campus-events-api

# 2. Criar o arquivo de ambiente a partir do exemplo
cp .env.example .env

# 3. Instalar as dependências
npm install

# 4. Subir os bancos de desenvolvimento e de teste (Docker)
npm run db:up

# 5. Iniciar a API em modo desenvolvimento (recarrega ao salvar)
npm run dev
```

A API fica disponível em `http://localhost:3001` (porta definida em `PORT` no `.env`). Para conferir:

```bash
curl http://localhost:3001/health
# {"status":"healthy","timestamp":"..."}
```

Para parar os bancos: `npm run db:down`.

### Scripts

| Script | Descrição |
|---|---|
| `npm run dev` | Inicia em modo desenvolvimento com `tsx watch` |
| `npm run build` | Compila o TypeScript para `dist/` |
| `npm start` | Executa a versão compilada (produção) |
| `npm test` | Executa todos os testes com Vitest |
| `npm run lint` | Verifica ESLint/Prettier (falha com qualquer aviso) |
| `npm run lint:fix` | Corrige automaticamente o que for possível |
| `npm run db:up` | Sobe os bancos via Docker Compose |
| `npm run db:down` | Para e remove os containers dos bancos |

> **Windows:** se o lint acusar centenas de avisos de quebra de linha (CRLF), rode `npm run lint:fix`. Veja [Dificuldades e soluções](#15-dificuldades-e-soluções).

## 6. Variáveis de ambiente

O arquivo `.env.example` já traz valores compatíveis com o Docker Compose local.

| Variável | Obrigatória | Exemplo (local) | Uso |
|---|---|---|---|
| `PORT` | Sim | `3001` | Porta HTTP da API |
| `DATABASE_URL` | Sim | `postgres://api:password@localhost:4329/api_dev` | Conexão com o banco de desenvolvimento. Se estiver ausente, a API encerra na inicialização com mensagem de erro clara |
| `TEST_PORT` | Para testes | `3002` | Porta usada pela suíte de testes |
| `TEST_DATABASE_URL` | Para testes | `postgres://api:password@localhost:4328/api_test` | Banco exclusivo dos testes |
| `NODE_ENV` | Em produção | `production` | Definida no `render.yaml` e no `Dockerfile` |

> O `.env` não é versionado. Em produção, `DATABASE_URL` é injetada pelo Render e nenhuma credencial fica no repositório.

> Se alterar usuário, senha ou porta do banco, altere o `.env` e o `docker-compose.yml` com os mesmos valores.

## 7. Banco de dados

- **SGBD:** PostgreSQL 17.
- **Ambientes:** dois bancos locais separados, `api_dev` (porta 4329) e `api_test` (porta 4328), para que os testes nunca apaguem dados de desenvolvimento. Em produção, Render PostgreSQL.
- **Migrations:** ficam em `migrations/` e são aplicadas **automaticamente** quando a API inicia (`applyMigrations` em `src/database/migrate.ts`). Os testes de integração aplicam as migrations no início de cada suíte e as revertem no fim. O controle fica na tabela `migrations`.

Esquema atual (`migrations/1681229663482_create-tables.sql`):

```sql
CREATE TABLE people (
  id          INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name        VARCHAR(255) NOT NULL,
  age         INT NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

As consultas de inscrição (`getEventById`, `getRegistrationsByEventId`, `createRegistration`) já usam as tabelas `events` (`id`, `capacity`) e `registrations` (`event_id`, `user_id`), mas **essas tabelas ainda não têm migration**. Ver [Limitações](#16-limitações-e-evolução).

## 8. Docker e Docker Compose

### Docker Compose (desenvolvimento e testes)

O `docker-compose.yml` sobe dois serviços PostgreSQL 17:

| Serviço | Banco | Porta no host |
|---|---|---|
| `postgres-dev` | `api_dev` | 4329 |
| `postgres-test` | `api_test` | 4328 |

```bash
npm run db:up     # docker compose up -d
npm run db:down   # docker compose down
```

### Dockerfile (produção)

Build *multi-stage* sobre `node:22-slim`:

1. **Estágio `base`:** instala todas as dependências e compila o TypeScript.
2. **Estágio final:** instala só as dependências de produção (`npm ci --omit=dev`) e copia `dist/` e `migrations/`. Resultado: imagem menor, sem ferramentas de desenvolvimento.

Para gerar e executar a imagem localmente:

```bash
docker build -t campus-events-api .
docker run --rm -p 3001:3001 \
  -e PORT=3001 \
  -e DATABASE_URL="postgres://api:password@host.docker.internal:4329/api_dev" \
  campus-events-api
```

> No Linux, troque `host.docker.internal` pelo IP do host ou use `--network host` (aí a URL pode usar `localhost`).

O mesmo `Dockerfile` é usado pelo Render para construir a imagem publicada.

## 9. Endpoints

URL base local: `http://localhost:3001`. URL base publicada: `https://campus-events-api-zdky.onrender.com`.

| Método | Rota | Descrição | Sucesso |
|---|---|---|---|
| GET | `/health` | A API está no ar (liveness) | 200 |
| GET | `/health/deep` | A API acessa o PostgreSQL (readiness) | 200 / 503 |
| GET | `/people` | Lista as pessoas cadastradas | 200 |
| POST | `/people` | Cadastra uma pessoa | 200 |
| POST | `/events` | Valida os dados de um evento | 201 |
| POST | `/events/:eventId/registrations` | Inscreve um usuário em um evento | 201 |

### Formato de erro

Todos os erros seguem o mesmo formato:

```json
{ "status": 400, "message": "Invalid request", "name": "ZodError" }
```

| Situação | Status |
|---|---|
| Corpo inválido em `/people` (Zod) | 400 |
| Evento inválido em `/events` (mensagem lista os campos) | 400 |
| Inscrição duplicada (`duplicate`) ou evento lotado (`full`) | 400 |
| Evento não encontrado | 404 |
| Rota inexistente | 404 |
| Banco indisponível em `/health/deep` | 503 |
| Erro não tratado | 500 |

### Exemplos

**Health check com banco**

```bash
curl -i https://campus-events-api-zdky.onrender.com/health/deep
```
```json
{"status":"healthy","timestamp":"2026-11-17T00:18:30.810Z"}
```

**Cadastrar pessoa** (`name`: texto não vazio; `age`: número positivo até 150)

```bash
curl -i -X POST https://campus-events-api-zdky.onrender.com/people \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana","age":20}'
```
```json
{"name":"Ana","age":20}
```

**Validar evento** (`name` e `date` obrigatórios; `capacity` inteiro > 0)

```bash
curl -i -X POST http://localhost:3001/events \
  -H "Content-Type: application/json" \
  -d '{"name":"Semana Acadêmica","date":"2026-09-16","capacity":0}'
```
```json
{"status":400,"message":"capacity must be greater than zero","name":"HttpError"}
```

**Inscrever em evento**

```bash
curl -i -X POST http://localhost:3001/events/1/registrations \
  -H "Content-Type: application/json" \
  -d '{"userId":"42"}'
```
```json
{"eventId":"1","userId":"42"}
```

> A inscrição só funciona em um banco que tenha as tabelas `events` e `registrations` (ver [Limitações](#16-limitações-e-evolução)).

## 10. Testes

### Estratégia

São **27 casos de teste** em 6 arquivos, divididos em duas camadas:

| Camada | Ferramentas | O que cobre | Arquivos |
|---|---|---|---|
| **Unitários** (10) | Vitest | Regra `canRegister`: vaga disponível, última vaga, inscrição duplicada, evento lotado, capacidade zero, negativa ou não inteira, `userId` vazio. Validação de `DATABASE_URL` com `process.exit` simulado | `src/domain/events.test.ts`, `src/config.test.ts` |
| **Integração** (17) | Vitest + Supertest + PostgreSQL de teste | Rotas HTTP de ponta a ponta (`/health`, `/people`, `/events`, rota 404) e consultas ao banco. Migrations sobem e descem a cada suíte; `vi.spyOn` simula falha do banco para testar o 503 | `src/routes/*.test.ts`, `src/database/queries.test.ts` |

O domínio é testado sem banco (rápido e determinístico). A integração usa um banco real em container, separado do banco de desenvolvimento.

### Como executar

```bash
npm run db:up   # o banco postgres-test precisa estar rodando
npm test
```

Na CI, o banco de teste sobe como *service container* do GitHub Actions, com as mesmas credenciais.

## 11. Integração Contínua

Workflows em `.github/workflows/`:

| Workflow | Quando roda | O que faz |
|---|---|---|
| `ci.yml` | Push em **qualquer branch** e em Pull Requests | **Build:** `npm ci` + `tsc` em Node 20.x e 22.x (matriz). **Test:** sobe PostgreSQL 17 como service container (com `pg_isready` como health check) e roda `npm test` em Node 20.x e 22.x |
| `lint.yml` | Push em qualquer branch e em PRs | `npm run lint` com `--max-warnings 0`: qualquer aviso reprova |
| `dependency-review.yml` | Pull Requests | Analisa as dependências adicionadas ou alteradas e reprova o PR se houver vulnerabilidade de severidade **alta** |

Também há:

- **Cache de npm** (`actions/setup-node` com `cache: npm`) para acelerar a instalação.
- **Dependabot** (`.github/dependabot.yml`): abre PRs semanais atualizando pacotes npm.
- **Ligação com o deploy:** o Render só publica um commit da `main` depois que todos os checks passam (`autoDeployTrigger: checksPass`).

```
push / PR ──► Lint ──► Build (Node 20, 22) ──► Test (Node 20, 22 + Postgres 17)
                         │
           PR ──► Dependency Review
                         │
         merge na main + checks verdes ──► deploy automático no Render
```

## 12. Ambiente publicado (Render)

**URL:** https://campus-events-api-zdky.onrender.com

```
Usuário / Postman → Render Web Service (Dockerfile) → Render PostgreSQL
```

- **Infraestrutura como código:** o [`render.yaml`](render.yaml) (Blueprint) define o Web Service `campus-events-api` e o banco `campus-events-db`.
- **Web Service:** construído a partir do `Dockerfile`, branch `main`, plano Free, região Oregon.
- **Banco:** Render PostgreSQL (plano Free), na mesma região, acessado pela rede interna do Render.
- **Variáveis:** `DATABASE_URL` é injetada a partir do banco (`fromDatabase`), `NODE_ENV=production` vem do `render.yaml` e `PORT` é fornecida pelo Render.
- **Migrations:** aplicadas no startup da API.
- **Health check:** o Render usa `GET /health`; uma nova versão só recebe tráfego depois de responder 200.

### Como validar

```bash
API=https://campus-events-api-zdky.onrender.com
curl -i $API/health
curl -i $API/health/deep
curl -i $API/people
curl -i -X POST $API/people -H "Content-Type: application/json" -d '{"name":"Ana","age":20}'
curl -i $API/people
```

Esperado: `HTTP 200`, `{"status":"healthy"}` nos health checks e a pessoa criada aparecendo na listagem (gravada no PostgreSQL).

Evidências: [`docs/evidencias-deploy.txt`](docs/evidencias-deploy.txt), [`docs/evidencias/render-live.jpg`](docs/evidencias/render-live.jpg) e [`docs/evidencias/validacao-endpoints.jpg`](docs/evidencias/validacao-endpoints.jpg).

> **Plano Free:** a API hiberna após 15 minutos sem uso e a primeira requisição pode levar cerca de 1 minuto. O PostgreSQL Free expira 30 dias após a criação (banco criado em 16/11/2026, disponível até 16/12/2026).

### Deploy e rollback

- **Deploy:** automático a cada merge na `main`, depois que CI e lint passam.
- **Rollback:** Render → serviço → **Events** → escolher um deploy anterior saudável → **Rollback**. O rollback volta só o código, não o banco; por isso migrations destrutivas devem ser evitadas.

Uma alternativa com infraestrutura própria (VPS + Docker Compose + Nginx) foi pesquisada e comparada em [`docs/deploy-alternativas.md`](docs/deploy-alternativas.md).

## 13. Organização do desenvolvimento

Toda mudança seguiu o mesmo fluxo:

1. **Issue** descrevendo a tarefa (ex.: #1 documentação de setup, #6 validação da `DATABASE_URL`, #11 evolução da CI, #13 deploy).
2. **Branch** por tarefa, com prefixo do tipo: `feat/`, `fix/`, `docs/`, `ci/`.
3. **Commits** no padrão Conventional Commits, citando a issue (`feat:`, `fix:`, `docs:`, `ci:`, `style:`, `chore:`, `test:`).
4. **Pull Request** para a `main`, com a CI rodando automaticamente.
5. **Code review** pela outra integrante; os ajustes pedidos viram novos commits (ex.: PRs #8 e #14).
6. **Merge** com revisão concluída e checks verdes.

### Contribuições

| Integrante | Principais entregas |
|---|---|
| **Julie Martins Monteiro** | Validação da `DATABASE_URL` na inicialização e refatoração para `config.ts` (#6); regra `canRegister`, controller de inscrições e validações da inscrição; Dependency Review na pipeline (#11); pesquisa de deploy alternativo VPS + Docker + Nginx (#13) |
| **Kethelem Socoowski** | Onboarding e passo a passo de setup em português (#1); rota `POST /events` com validação e testes de integração; evolução da CI para todas as branches, cache e correções de lint (#11); Blueprint, deploy no Render, evidências e rollback (#13) |

As duas revisaram os PRs uma da outra e participaram da resolução de conflitos e da documentação.

## 14. Decisões técnicas

| Decisão | Motivo |
|---|---|
| Partir de um template Express + TypeScript | Testes, lint, Docker e CI já prontos; o esforço da dupla foi para as regras de negócio e para a evolução do processo |
| Regras de negócio como funções puras em `src/domain` | Testáveis sem banco e sem HTTP, rápidas e fáceis de entender; o controller só orquestra |
| Validar a `DATABASE_URL` na inicialização | Um erro de configuração aparece imediatamente, com mensagem clara, em vez de quebrar na primeira requisição |
| Bancos separados para desenvolvimento e testes | Os testes limpam tabelas e revertem migrations; não podem tocar nos dados de desenvolvimento |
| CI em todas as branches, não só na `main` | O problema aparece no PR, antes do merge |
| Dependency Review nos PRs | Barra dependências com vulnerabilidade alta antes que cheguem à `main` |
| Render (PaaS) com `render.yaml` | Para uma dupla e um projeto acadêmico, entrega HTTPS, banco, health check, deploy condicionado à CI e rollback com pouca configuração, tudo versionado |
| Migrations no startup | O banco de produção fica sempre no esquema que o código espera, sem passo manual |

## 15. Dificuldades e soluções

| Dificuldade | Solução |
|---|---|
| No Windows, o lint acusou 636 avisos de quebra de linha (CRLF) | `npm run lint:fix` e Prettier padronizando o formato; a CI passou a reprovar qualquer aviso |
| Typo `DATEBASE_URL` nos testes da configuração | Correção do nome junto com a validação explícita da variável na inicialização (#6) |
| Conflito ao integrar a regra de inscrição com a `main` (PR #10) removeu a validação de eventos | Resolução manual do conflito e commit `fix: restore event validation` para restaurar a validação |
| Ao rodar o lint em todas as branches, apareceram problemas de formatação antigos | Commits `style:` dedicados, separados da mudança de CI (#11) |
| Plano Free hiberna e o banco expira | Limitação documentada; a API é "acordada" antes de validar ou demonstrar |
| Integrantes em sistemas diferentes (Windows e Ubuntu) | Ambiente padronizado com Docker Compose, `.env.example` e Prettier/ESLint na CI |

## 16. Limitações e evolução

### Limitações atuais

- **Eventos e inscrições não são persistidos.** `POST /events` valida e devolve os dados, mas não os grava. As consultas de inscrição usam as tabelas `events` e `registrations`, que ainda não têm migration; por isso, a rota de inscrição não funciona no ambiente publicado.
- Não há rotas de listagem e consulta de eventos (`GET /events`).
- Não há autenticação nem perfis de usuário; o `userId` vem no corpo da requisição.
- O ambiente publicado usa planos gratuitos: hibernação e banco temporário.

### Possibilidades de evolução

1. Criar migrations para `events` e `registrations` (com `UNIQUE (event_id, user_id)` e chave estrangeira) e gravar eventos em `POST /events`.
2. Adicionar `GET /events`, `GET /events/:id` e listagem de inscritos.
3. Garantir a regra de vagas também sob concorrência (transação ou bloqueio de linha), para duas inscrições simultâneas não ocuparem a última vaga.
4. Autenticação (por exemplo, JWT) com perfis de organizador e participante.
5. Cancelamento de inscrição e lista de espera.
6. Documentação interativa com OpenAPI/Swagger.
7. Banco persistente (plano pago ou gerenciado), backups e monitoramento.

## 17. Estrutura de pastas

```
.
├── .github/
│   ├── workflows/        # ci.yml, lint.yml, dependency-review.yml
│   └── dependabot.yml
├── docs/
│   ├── deploy-alternativas.md   # pesquisa VPS + Docker + Nginx
│   ├── evidencias-deploy.txt    # smoke test após o deploy
│   ├── evidencias/              # prints do Render e da validação
│   └── onboarding/
├── migrations/           # scripts SQL (node-pg-migrate)
├── src/
│   ├── controllers/      # health, people, events, registrations
│   ├── database/         # pool, queries, migrate, tipos
│   ├── domain/           # regras de negócio puras e testes
│   ├── errors/           # HttpError
│   ├── middleware/       # logger, 404, tratamento de erros
│   ├── routes/           # rotas e testes de integração
│   ├── app.ts            # montagem do Express (injeção de dependência)
│   ├── config.ts         # leitura e validação de variáveis
│   ├── logger.ts
│   └── index.ts          # ponto de entrada
├── docker-compose.yml
├── Dockerfile
├── render.yaml
└── .env.example
```
