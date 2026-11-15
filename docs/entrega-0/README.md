# Entrega 0 — Onboarding técnico

Aluno: Ricardo Minuto (Ricardopbm)
Data de execução: 15/11/2026
Modalidade: individual

## Objetivo

Preparar o ambiente local do Campus Events API, executar a aplicação e verificar banco, rotas, testes, lint e build.

## Repositórios

- Origem fornecida pela professora: https://github.com/BeahIF/campus-events-api
- Fork: https://github.com/Ricardopbm/campus-events-api
- Commit de origem utilizado: `1fc63ad6996602064c525a6a4e3c1d06977de42f`.

O fork foi criado com `gh repo fork BeahIF/campus-events-api --clone`. O remoto `origin` aponta para Ricardopbm e `upstream` para BeahIF. O histórico original foi preservado.

## Ambiente utilizado

Windows com PowerShell, Git 2.53.0.windows.3, Node.js 25.7.0, npm 11.19.0, Docker 29.5.3 e PostgreSQL 17 em Docker Compose. O projeto exige Node.js >=20; o CI original usa 20 e 22, enquanto esta verificação local foi executada na versão já instalada.

A API usa a porta 3001. Os bancos separados de desenvolvimento e testes usam, respectivamente, as portas locais 4329 e 4328.

## Como reproduzir no PowerShell

Com Git, Node.js e Docker Desktop instalados e o Docker em execução:

```powershell
git clone https://github.com/Ricardopbm/campus-events-api.git
cd campus-events-api
Copy-Item .env.example .env
npm.cmd ci
npm.cmd run db:up
docker compose exec -T postgres-dev pg_isready -U api -d api_dev
docker compose exec -T postgres-test pg_isready -U api -d api_test
```

Aguardar os dois bancos responderem `accepting connections`. Em seguida:

```powershell
npm.cmd test -- --run
npm.cmd run lint
npm.cmd run build
npm.cmd run dev
```

O servidor aplica as migrations automaticamente ao iniciar. O comando de desenvolvimento permanece em execução; em outro terminal:

```powershell
Invoke-RestMethod http://localhost:3001/health
Invoke-RestMethod http://localhost:3001/health/deep
Invoke-RestMethod http://localhost:3001/people
```

Para encerrar a API, usar Ctrl+C no terminal do servidor. Para parar os bancos sem remover seus containers: `docker compose stop`.

O arquivo `.env` contém a configuração local e está ignorado pelo Git. Não é necessário publicar esse arquivo.

## Resultados e evidências

| Verificação | Resultado | Evidência |
| --- | --- | --- |
| Instalação (`npm.cmd ci`) | 347 pacotes adicionados | [Instalação](evidencias/instalacao.txt) |
| Banco (`npm.cmd run db:up`) | Dois containers PostgreSQL iniciados | [Banco](evidencias/banco.txt) |
| Prontidão do banco | Desenvolvimento e testes aceitando conexões | [Prontidão](evidencias/prontidao-banco.txt) |
| Testes (`npm.cmd test -- --run`) | 3 arquivos e 13 testes aprovados | [Testes](evidencias/testes.txt) |
| Lint (`npm.cmd run lint`) | Aprovado, código de saída 0 | [Lint](evidencias/lint.txt) |
| Build (`npm.cmd run build`) | Aprovado, código de saída 0 | [Build](evidencias/build.txt) |
| `GET /health` | HTTP 200 e status healthy | [Rotas](evidencias/rotas.txt) |
| `GET /health/deep` | HTTP 200 e status healthy, incluindo conexão com banco | [Rotas](evidencias/rotas.txt) |
| `GET /people` | HTTP 200 e lista vazia no banco novo | [Rotas](evidencias/rotas.txt) |

## Dificuldades encontradas e soluções

1. **Docker desligado:** a consulta inicial ao Docker falhou porque o engine não estava disponível. O Docker Desktop foi iniciado antes de subir os bancos.
2. **Quebras de linha no Windows:** o primeiro lint apresentou 636 avisos de CRLF. Os arquivos locais foram normalizados para LF e foi adicionado `.gitattributes` com `* text=auto eol=lf`, para manter o padrão também em novos clones. O lint passou após o ajuste. [Registro inicial](evidencias/lint-inicial.txt).
3. **Banco ainda iniciando:** a primeira execução dos testes apresentou falhas de conexão e de inicialização do PostgreSQL. Após verificar a prontidão com `pg_isready`, a nova execução passou nos 13 testes. [Registro inicial](evidencias/testes-iniciais.txt).
4. **Instrução de clone do template:** o README original apontava para o template de outro autor. A instrução foi adaptada para o fork desta atividade.
5. **Dependências:** a instalação reportou 24 vulnerabilidades (1 baixa, 4 moderadas, 15 altas e 4 críticas). Elas permanecem pendentes de avaliação e atualização; não foi aplicado `npm audit fix --force`, que pode introduzir mudanças incompatíveis. A execução bem-sucedida não significa ausência de vulnerabilidades.

## Conclusão

O ambiente local foi preparado e a API foi validada com o PostgreSQL. Testes, lint e build foram executados com sucesso após os ajustes descritos. Os registros de terminal estão na pasta `evidencias`. Esta etapa prepara a base para as próximas entregas; ainda não implementa funcionalidades de eventos ou inscrições.
