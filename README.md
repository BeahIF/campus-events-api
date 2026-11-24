# Campus Events API

> API REST para cadastro de eventos acadêmicos e inscrição de participantes, desenvolvida no
> Projeto Integrador da disciplina **Tópicos em Análise e Desenvolvimento de Sistemas**.

[![CI](https://github.com/Pablo9293/campus-events-api/actions/workflows/ci.yml/badge.svg)](https://github.com/Pablo9293/campus-events-api/actions/workflows/ci.yml)
[![Lint](https://github.com/Pablo9293/campus-events-api/actions/workflows/lint.yml/badge.svg)](https://github.com/Pablo9293/campus-events-api/actions/workflows/lint.yml)

- **Repositório:** https://github.com/Pablo9293/campus-events-api
- **Ambiente publicado:** https://campus-events-api-rwlz.onrender.com
- **Base do projeto:** fork do repositório da disciplina, derivado do template
  [template-node-express](https://github.com/miikkaylisiurunen/template-node-express) (MIT)

## Sumário

1. [Objetivo e contexto](#1-objetivo-e-contexto)
2. [Funcionalidades](#2-funcionalidades)
3. [Tecnologias](#3-tecnologias)
4. [Arquitetura](#4-arquitetura)
5. [Como executar localmente](#5-como-executar-localmente)
6. [Variáveis de ambiente](#6-variáveis-de-ambiente)
7. [Banco de dados](#7-banco-de-dados)
8. [Docker e Docker Compose](#8-docker-e-docker-compose)
9. [Endpoints](#9-endpoints)
10. [Testes](#10-testes)
11. [Integração Contínua](#11-integração-contínua)
12. [Ambiente publicado (deploy)](#12-ambiente-publicado-deploy)
13. [Decisões técnicas](#13-decisões-técnicas)
14. [Dificuldades e soluções](#14-dificuldades-e-soluções)
15. [Limitações e evolução](#15-limitações-e-evolução)
16. [Organização do trabalho](#16-organização-do-trabalho)

---

## 1. Objetivo e contexto

Em um campus, eventos como palestras, oficinas e semanas acadêmicas costumam ser divulgados e
controlados de forma manual (planilhas, formulários soltos). Isso gera inscrições duplicadas e
eventos com mais participantes do que vagas.

A **Campus Events API** centraliza esse processo. Ela permite cadastrar participantes e eventos e
registrar inscrições, aplicando automaticamente as regras de negócio:

- todo evento precisa de título, descrição, data futura e capacidade máxima;
- uma pessoa não pode se inscrever duas vezes no mesmo evento;
- um evento não aceita inscrições além da sua capacidade.

O projeto também serviu de base prática para as práticas da disciplina: backlog com Issues, fluxo
com branches e Pull Requests, Code Review, testes automatizados, Integração Contínua, containers
e deploy.

## 2. Funcionalidades

| Funcionalidade                 | Descrição                                                                 |
| ------------------------------ | ------------------------------------------------------------------------- |
| Health check                   | `/health` (status da API) e `/health/deep` (API + conexão com o banco)    |
| Participantes                  | Cadastro e listagem de pessoas (`/people`)                                |
| Cadastro de eventos            | Criação com validação de título, descrição, data futura e capacidade      |
| Consulta de eventos            | Listagem ordenada por data e consulta por id                              |
| Inscrição em eventos           | Inscrição de uma pessoa em um evento, impedindo duplicidade e lotação     |
| Consulta de inscrições         | Lista de inscritos de um evento                                           |
| Tratamento de erros padronizado | Respostas de erro sempre no formato `{ status, message, name }`           |
| Logs estruturados              | Logs de requisição e erro em JSON com Pino, com `X-Request-Id` por requisição |

## 3. Tecnologias

| Camada           | Tecnologia                                                  |
| ---------------- | ----------------------------------------------------------- |
| Linguagem        | TypeScript 5 (modo `strict`)                                |
| Runtime          | Node.js 20+ (Docker e `.nvmrc` usam Node 22)                |
| Framework HTTP   | Express 5                                                   |
| Banco de dados   | PostgreSQL 17, driver `pg`                                  |
| Migrações        | node-pg-migrate (arquivos `.sql`)                           |
| Validação        | Zod (corpo das requisições e variáveis de ambiente)         |
| Logs             | Pino / pino-http                                            |
| Testes           | Vitest + Supertest                                          |
| Qualidade        | ESLint + Prettier                                           |
| Containers       | Docker (build multi-stage) e Docker Compose                 |
| CI               | GitHub Actions + Dependabot                                 |
| Deploy           | Render (Web Service a partir do Dockerfile)                 |

## 4. Arquitetura

A API segue uma arquitetura em camadas com **injeção de dependências**: `index.ts` cria as
dependências reais (banco, logger) e as entrega para `makeApp`. Nos testes, as mesmas fábricas
recebem um banco de teste.

```mermaid
flowchart LR
    C[Cliente HTTP] --> R[Rotas<br/>src/routes]
    R --> CT[Controllers<br/>src/controllers]
    CT -->|valida formato| Z[Zod<br/>src/database/types.ts]
    CT -->|aplica regras| D[Domínio<br/>src/domain/events.ts]
    CT --> Q[Queries<br/>src/database/queries.ts]
    Q --> DB[(PostgreSQL)]
    CT -. erros .-> M[Middleware<br/>errorHandler]
    M --> C
```

```
.
├── .github/            # workflows de CI (ci.yml, lint.yml) e dependabot.yml
├── migrations/         # migrações SQL (node-pg-migrate)
├── src/
│   ├── app.ts          # monta o Express e registra as rotas
│   ├── index.ts        # ponto de entrada: config, migrações, servidor
│   ├── config.ts       # leitura e validação das variáveis de ambiente
│   ├── controllers/    # orquestram requisição -> domínio -> banco
│   ├── domain/         # regras de negócio puras (sem Express/BD) + testes unitários
│   ├── database/       # pool, migrações, queries SQL e tipos
│   ├── errors/         # HttpError
│   ├── middleware/     # logger, rota 404 e tratamento de erros
│   └── routes/         # rotas e testes de integração
├── Dockerfile
└── docker-compose.yml
```

**Fluxo de uma inscrição (`POST /events/:id/registrations`):**

1. o controller valida o id e o corpo (`{ personId }`) com Zod;
2. busca o evento (404 se não existir) e as inscrições atuais;
3. chama `EventDomain.registerUserInEvent`, que verifica duplicidade e vagas;
4. grava a inscrição; se a pessoa não existir, o banco recusa (FK) e a API responde 404;
5. qualquer erro é convertido pelo middleware em `{ status, message, name }`.

## 5. Como executar localmente

### Requisitos

- Node.js 20 ou superior (recomendado 22, ver `.nvmrc`)
- Docker e Docker Compose **ou** um PostgreSQL local

### Passo a passo

```bash
git clone https://github.com/Pablo9293/campus-events-api.git
cd campus-events-api
cp .env.example .env          # no Windows: copy .env.example .env
npm install
npm run db:up                 # sobe os bancos de desenvolvimento e de teste
npm run dev                   # API em http://localhost:3001
```

As migrações são aplicadas automaticamente quando a API inicia.

Teste rápido:

```bash
curl http://localhost:3001/health
```

### Scripts

| Script             | Função                                              |
| ------------------ | --------------------------------------------------- |
| `npm run dev`      | servidor de desenvolvimento com recarga (tsx watch) |
| `npm run build`    | compila TypeScript para `dist/`                     |
| `npm start`        | executa a versão compilada                          |
| `npm test`         | executa os testes (Vitest)                          |
| `npm run lint`     | ESLint sem nenhum aviso permitido                   |
| `npm run lint:fix` | corrige problemas de lint/formatação                |
| `npm run db:up`    | `docker compose up -d` (bancos)                     |
| `npm run db:down`  | derruba os bancos                                   |

## 6. Variáveis de ambiente

Definidas em `.env` (modelo em `.env.example`) e validadas com Zod em `src/config.ts`. Se alguma
estiver ausente ou inválida, a API não inicia.

| Variável            | Uso                                | Exemplo local                                     |
| ------------------- | ---------------------------------- | ------------------------------------------------- |
| `PORT`              | porta HTTP da API                  | `3001`                                            |
| `DATABASE_URL`      | conexão com o banco da aplicação   | `postgres://api:password@localhost:4329/api_dev`  |
| `TEST_PORT`         | porta usada nos testes             | `3002`                                            |
| `TEST_DATABASE_URL` | banco isolado para os testes       | `postgres://api:password@localhost:4328/api_test` |

No Render, `PORT` e `DATABASE_URL` são configuradas no painel do serviço (seção _Environment_);
o arquivo `.env` nunca é versionado (`.gitignore` e `.dockerignore`).

## 7. Banco de dados

- PostgreSQL 17. Em desenvolvimento, dois bancos separados: `api_dev` (porta 4329) e `api_test`
  (porta 4328), para que os testes nunca apaguem dados de desenvolvimento.
- As migrações ficam em `migrations/` e são aplicadas por `applyMigrations` na inicialização da
  API e no início de cada suíte de testes.

| Tabela          | Colunas principais                                                    |
| --------------- | --------------------------------------------------------------------- |
| `people`        | `id`, `name`, `age`, `created_at`                                     |
| `events`        | `id`, `title`, `description`, `date` (timestamptz), `capacity` (> 0)  |
| `registrations` | `id`, `event_id` → `events`, `person_id` → `people`, `created_at`     |

`registrations` tem a restrição `UNIQUE (event_id, person_id)`, uma segunda barreira contra
inscrições duplicadas além da regra de domínio.

```mermaid
erDiagram
    people ||--o{ registrations : faz
    events ||--o{ registrations : recebe
```

## 8. Docker e Docker Compose

**Dockerfile (multi-stage):**

1. estágio `base`: instala todas as dependências e compila o TypeScript;
2. estágio final: imagem `node:22-slim` só com dependências de produção, `dist/` e `migrations/`.

Isso deixa a imagem final menor e sem ferramentas de desenvolvimento.

**docker-compose.yml:**

| Serviço         | Função                                           | Porta  |
| --------------- | ------------------------------------------------ | ------ |
| `postgres-dev`  | banco de desenvolvimento                         | 4329   |
| `postgres-test` | banco de testes                                  | 4328   |
| `api`           | a própria API em container (perfil `full`)       | 3001   |

```bash
npm run db:up                                # somente os bancos
docker compose --profile full up --build     # bancos + API em container
docker compose down                          # derruba tudo
```

## 9. Endpoints

Todos os corpos são JSON. Erros sempre seguem o formato:

```json
{ "status": 409, "message": "Usuário já está inscrito neste evento.", "name": "BusinessRuleError" }
```

| Método | Rota                          | Descrição                     | Sucesso | Erros               |
| ------ | ----------------------------- | ----------------------------- | ------- | ------------------- |
| GET    | `/health`                     | status da API                 | 200     | —                   |
| GET    | `/health/deep`                | status da API + banco         | 200     | 503                 |
| GET    | `/people`                     | lista participantes           | 200     | —                   |
| POST   | `/people`                     | cadastra participante         | 200     | 400                 |
| GET    | `/events`                     | lista eventos (por data)      | 200     | —                   |
| POST   | `/events`                     | cadastra evento               | 201     | 400                 |
| GET    | `/events/:id`                 | detalha evento                | 200     | 400, 404            |
| GET    | `/events/:id/registrations`   | lista inscrições do evento    | 200     | 400, 404            |
| POST   | `/events/:id/registrations`   | inscreve participante         | 201     | 400, 404, 409       |

### Exemplos

```bash
API=http://localhost:3001   # ou https://campus-events-api-rwlz.onrender.com

# 1. cadastrar participante
curl -X POST $API/people -H "Content-Type: application/json" \
  -d '{"name":"Ana","age":22}'
# -> {"id":1,"name":"Ana","age":22}

# 2. cadastrar evento
curl -X POST $API/events -H "Content-Type: application/json" \
  -d '{"title":"Semana Acadêmica de TI","description":"Palestras e oficinas","date":"2026-12-10T19:00:00.000Z","capacity":2}'
# -> 201 {"id":1,"title":"Semana Acadêmica de TI",...,"capacity":2}

# 3. inscrever participante
curl -X POST $API/events/1/registrations -H "Content-Type: application/json" \
  -d '{"personId":1}'
# -> 201 {"id":1,"eventId":1,"personId":1,"createdAt":"..."}

# 4. repetir a inscrição
# -> 409 {"status":409,"message":"Usuário já está inscrito neste evento.","name":"BusinessRuleError"}
```

| Situação                                   | Resposta |
| ------------------------------------------ | -------- |
| título < 3 caracteres, descrição vazia, data inválida ou passada, capacidade ≤ 0 | 400 |
| corpo com campos faltando ou de tipo errado | 400      |
| evento ou pessoa inexistente               | 404      |
| inscrição duplicada                        | 409      |
| evento lotado                              | 409      |

## 10. Testes

```bash
npm run db:up        # o banco de testes precisa estar rodando
npm test             # modo watch
npm test -- --run    # execução única (igual ao CI)
```

**Estratégia:** pirâmide com duas camadas.

| Tipo        | Arquivo                         | O que cobre                                                      |
| ----------- | ------------------------------- | ---------------------------------------------------------------- |
| Unitário    | `src/domain/events.spec.ts`     | regras de evento e de inscrição, sem banco nem HTTP (13 testes)  |
| Integração  | `src/routes/events.test.ts`     | rotas de eventos/inscrições com banco real (12 testes)           |
| Integração  | `src/routes/people.test.ts`     | rotas de pessoas e rota 404                                      |
| Integração  | `src/routes/health.test.ts`     | health checks, incluindo falha simulada do banco                 |
| Integração  | `src/database/queries.test.ts`  | queries SQL e verificação de conexão                             |

Os testes unitários de domínio foram escritos por categoria:

- **sucesso:** evento válido; inscrição com vagas; mesma pessoa em eventos diferentes;
- **erro / entrada inválida:** título curto, descrição vazia, data inválida, capacidade não
  inteira, inscrição duplicada;
- **limite (boundary):** título com exatamente 3 caracteres, data igual ao "agora", capacidade 0,
  inscrição que ocupa a última vaga, evento exatamente lotado.

A data "agora" é injetada como parâmetro (`validateAndCreateEvent(input, now)`) para os testes
serem determinísticos.

## 11. Integração Contínua

Workflows em `.github/workflows/`, executados em **push** e em **Pull Request** para a `main`:

**`ci.yml`**

| Job     | Passos                                                                                  |
| ------- | --------------------------------------------------------------------------------------- |
| `build` | checkout → Node 20 com **cache npm** (`actions/setup-node`) → `npm ci` → `npm run build` |
| `test`  | sobe um **service container PostgreSQL 17** com healthcheck → `npm ci` → `npm test -- --run` |

**`lint.yml`:** `npm ci` → `npm run lint` (ESLint + Prettier, `--max-warnings 0`).

**Dependabot** (`dependabot.yml`): verifica semanalmente dependências npm desatualizadas e abre
PRs de atualização.

Evolução feita na Entrega 4 (PR #4): gatilhos de push **e** de pull request, cache de
dependências npm via action reutilizável `actions/setup-node@v4` e banco PostgreSQL como serviço
no job de testes. Um PR só deve ser mergeado com todos os checks verdes.

## 12. Ambiente publicado (deploy)

- **URL:** https://campus-events-api-rwlz.onrender.com
- **Plataforma:** Render (PaaS), Web Service construído a partir do `Dockerfile` do repositório.
- **Banco:** PostgreSQL acessado via `DATABASE_URL` configurada no painel do Render.
- **Processo:** push/merge na `main` → Render faz o build da imagem Docker → executa
  `npm start` → a API aplica as migrações pendentes e começa a responder.

### Como validar

```bash
curl https://campus-events-api-rwlz.onrender.com/health        # {"status":"healthy",...}
curl https://campus-events-api-rwlz.onrender.com/health/deep   # confirma conexão com o banco
curl https://campus-events-api-rwlz.onrender.com/events        # lista de eventos
```

> O plano gratuito "dorme" após inatividade. A primeira requisição pode levar até ~50 s.

Evidências da Entrega 5: [painel do Render](./Evidencia_Deploy.png),
[`/health`](./Evidencia1.png), [`/people`](./Evidencia2.png).
Comparação com uma alternativa (VPS + Docker Compose + Nginx): [DEPLOY_RESEARCH.md](./DEPLOY_RESEARCH.md).

## 13. Decisões técnicas

| Decisão | Motivo |
| ------- | ------ |
| Partir de um template Express + TypeScript | estrutura, logs, erros e CI já organizados; foco nas regras do domínio |
| Regras de negócio em `src/domain` sem dependência de Express/BD | permite testes unitários rápidos e isolados (Entrega 3) |
| Zod para formato + domínio para regras | separa "o JSON está bem formado?" de "isso é permitido?" |
| `BusinessRuleError` com código mapeado no middleware | o domínio não conhece HTTP; o middleware decide 400 ou 409 |
| `UNIQUE (event_id, person_id)` no banco | protege contra duplicidade mesmo com requisições simultâneas |
| Nova migração em vez de alterar a existente | o banco publicado já tinha aplicado a primeira migração |
| Bancos de dev e de teste separados | testes limpam tabelas sem afetar dados de desenvolvimento |
| Render (PaaS) em vez de VPS | menor complexidade operacional para o escopo do projeto (ver `DEPLOY_RESEARCH.md`) |
| Dockerfile multi-stage | imagem de produção menor, sem dependências de desenvolvimento |

## 14. Dificuldades e soluções

| Dificuldade | Solução |
| ----------- | ------- |
| Credenciais e portas do PostgreSQL local no Windows (Entrega inicial) | ajuste do `.env` e criação dos bancos `dev` e `test` separados (ver [Relatorio.md](./Relatorio.md)) |
| Erros de lint por quebra de linha CRLF do Windows | `npm run lint:fix` / Prettier |
| PR com escopo diferente da Issue vinculada e Code Review genérico (Entrega 2) | vincular cada PR à Issue correta e revisar com comentários técnicos e critérios de aceite |
| Pipeline quebrando após mudanças no `ci.yml` (Entrega 4) | vários commits de ajuste até restaurar o service PostgreSQL e as variáveis de teste |
| Seguir o projeto sozinho a partir da Entrega 3 | priorização das Issues e auto-revisão com base nos critérios de aceite |
| Funcionalidades em branches que não chegaram à `main` e commit que quebrou o `app.ts` | consolidação na branch `feature/entrega-final`, validada pelo CI antes do merge |

## 15. Limitações e evolução

**Limitações atuais**

- Sem autenticação nem perfis (qualquer cliente pode criar eventos).
- Sem edição/cancelamento de eventos ou inscrições.
- Sem paginação nas listagens.
- Contagem de vagas não usa transação com bloqueio; em concorrência muito alta, duas inscrições
  simultâneas na última vaga poderiam passar.
- Plano gratuito do Render com "cold start".
- Sem deploy contínuo condicionado ao CI (o Render publica a partir da `main`).

**Possibilidades de evolução**

- Autenticação JWT e papéis (organizador × participante).
- `PUT/DELETE` de eventos e cancelamento de inscrição, com lista de espera.
- Transação `SELECT ... FOR UPDATE` na inscrição.
- Relatório de cobertura de testes como artifact no CI e Dependency Review em PRs.
- Documentação OpenAPI/Swagger.
- Deploy acionado só após o CI passar.

## 16. Organização do trabalho

- **Backlog:** Issues no GitHub Projects (quadro _Campus Events API_: Backlog → Ready →
  In Progress → Review → Done), com contexto, resultado esperado, critérios de aceite, labels de
  tipo/prioridade, responsável e branch sugerida.
- **Branches:** uma por Issue (`feature/...`, `docs/...`, `test/...`, `ci/...`).
- **Commits:** mensagens preferencialmente no padrão Conventional Commits (`feat:`, `fix:`, `docs:`, `ci:`).
- **Pull Requests + Code Review:** toda alteração entra por PR, vinculado à Issue e validado pelo CI.

| Entrega | Tema | Link |
| ------- | ---- | ---- |
| 1 | Backlog de Issues | GitHub Projects _Campus Events API_ |
| 2 | Fluxo de desenvolvimento | [PR #11](https://github.com/sergiolmendonca/campus-events-api/pull/11), [PR #12](https://github.com/sergiolmendonca/campus-events-api/pull/12) |
| 3 | Funcionalidade testada | [PR #13](https://github.com/BeahIF/campus-events-api/pull/13) |
| 4 | Evolução da pipeline de CI | [PR #4](https://github.com/Pablo9293/campus-events-api/pull/4) |
| 5 | Deploy | seção 12 deste README |

Documentos complementares: [Relatorio.md](./Relatorio.md) (ambiente local),
[DEPLOY_RESEARCH.md](./DEPLOY_RESEARCH.md) (alternativas de deploy),
[docs/onboarding/pablo.md](./docs/onboarding/pablo.md).
