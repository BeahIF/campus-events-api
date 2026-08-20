CAMPUS EVENTS API
ENTREGA 0 — ONBOARDING TÉCNICO

Data: 19/08/2026

1. OBJETIVO

Esta etapa tem como objetivo configurar o ambiente local para execução do projeto Campus Events API, verificar o funcionamento da aplicação e registrar os procedimentos realizados durante o onboarding técnico.

2. AMBIENTE UTILIZADO

- Sistema operacional: Ubuntu Linux
- Git: 2.43.0
- Node.js: v24.14.0
- npm: 11.9.0
- Docker: 29.5.3
- Docker Compose: v5.1.4

3. REPOSITÓRIO

Repositório-base:
https://github.com/BeahIF/campus-events-api

Foi realizado um fork do projeto para a conta do GitHub e, posteriormente, o fork foi clonado para o ambiente local.

Comandos utilizados:
git remote -v
git status

4. INSTALAÇÃO DAS DEPENDÊNCIAS

Comando:
npm install

A instalação foi concluída com sucesso.

Durante a instalação, o npm informou:
18 vulnerabilities
1 low
3 moderate
12 high
2 critical

Não foi utilizado npm audit fix --force, para evitar alterações incompatíveis no projeto durante a atividade.

5. CONFIGURAÇÃO DAS VARIÁVEIS DE AMBIENTE

O projeto possui um arquivo .env.example.

Foi criado o arquivo .env utilizando:
cp .env.example .env

Configuração utilizada:

PORT="3001"
DATABASE_URL="postgres://api:password@localhost:4329/api_dev"

TEST_PORT="3002"
TEST_DATABASE_URL="postgres://api:password@localhost:4328/api_test"

O arquivo .env é utilizado localmente e não deve ser enviado ao repositório.

6. BANCO DE DADOS

O projeto utiliza PostgreSQL e possui configuração por meio do Docker Compose.

Comando:
docker compose up -d

Verificação:
docker compose ps

Foram identificados:
- Banco de desenvolvimento — porta 4329
- Banco de testes — porta 4328

As migrações do banco foram executadas com sucesso.

Migração identificada:
1681229663482_create-tables (UP)

7. BUILD

Comando:
npm run build

Resultado:
template-node-express@0.0.1 build
tsc

O processo foi concluído sem erros.

Resultado: APROVADO.

8. LINT

Comando:
npm run lint

Resultado:
template-node-express@0.0.1 lint
eslint . --max-warnings 0

O processo foi concluído sem erros.

Resultado: APROVADO.

9. EXECUÇÃO DA API

Comando:
npm run dev

A API iniciou corretamente na porta 3001.

Mensagem:
Server is up on port 3001

10. TESTE DA API

Teste da raiz:
curl http://localhost:3001

Resposta:
{"status":404,"message":"Route not found","name":"HttpError"}

Essa resposta confirmou que o servidor estava acessível, embora não exista uma rota configurada para /.

Health check:
curl http://localhost:3001/health

Resposta:
{"status":"healthy","timestamp":"2026-08-20T00:06:35.292Z"}

Resultado: HEALTH CHECK APROVADO.

11. TESTES AUTOMATIZADOS

Inicialmente, os testes apresentaram erros relacionados às variáveis de ambiente PORT e DATABASE_URL.

Erros:
expected: number
received: NaN

e:

expected: string
received: undefined

Após a criação e configuração do arquivo .env e a inicialização dos bancos PostgreSQL, os testes foram executados novamente.

Comando:
npm test

Resultado final:
Test files 3 passed
Tests 13 passed

Resultado:
- 3 arquivos de teste aprovados
- 13 testes aprovados
- 0 testes com falha

Resultado: APROVADO.

12. REGISTRO DE ONBOARDING

Foi criado o registro:
docs/onboarding/juliemartins1.md

O arquivo registra informações sobre o ambiente utilizado e a versão do Git.

Comando:
git add docs/onboarding/juliemartins1.md

Commit criado:
docs: add onboarding notes

13. GIT

Comandos utilizados:
git status
git diff
git add
git commit
git log --oneline
git remote -v
git push

O objetivo foi manter o histórico do projeto organizado e registrar as alterações realizadas durante o onboarding.

14. CHECKLIST DA ENTREGA 0

[OK] Fork do repositório
[OK] Clone do projeto
[OK] Git configurado
[OK] Node.js configurado
[OK] npm configurado
[OK] Dependências instaladas
[OK] .env configurado
[OK] Docker configurado
[OK] Banco PostgreSQL de desenvolvimento
[OK] Banco PostgreSQL de testes
[OK] Migrações executadas
[OK] Build
[OK] Lint
[OK] API executada localmente
[OK] Health check
[OK] Testes automatizados
[OK] 3 arquivos de teste aprovados
[OK] 13 testes aprovados
[OK] Documentação de onboarding
[OK] Commit
[ok] Push para o GitHub

15. DIFICULDADES ENCONTRADAS

Durante o processo de configuração, os testes inicialmente não foram executados corretamente porque as variáveis de ambiente necessárias não estavam configuradas.

Principais problemas:
PORT = NaN
DATABASE_URL = undefined

Solução:
cp .env.example .env

Depois da configuração do ambiente e da inicialização dos bancos PostgreSQL pelo Docker Compose, os testes passaram.

Resultado final:
3 test files passed
13 tests passed

16. CONCLUSÃO

O ambiente local do Campus Events API foi configurado e validado.

A aplicação foi compilada, executada localmente, conectada ao banco de dados e validada por meio do endpoint /health.

Também foram executados o lint e os testes automatizados.

Resultado final:
3 arquivos de teste aprovados
13 testes aprovados

Dessa forma, o ambiente está preparado para o desenvolvimento das próximas etapas do projeto.

17. PRÓXIMO PASSO

Caso o push ainda não tenha sido realizado:

git push origin main

Depois verificar:

git status

O objetivo é que o repositório local esteja atualizado com origin/main e que a working tree esteja limpa.
