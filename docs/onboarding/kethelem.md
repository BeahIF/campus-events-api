# Onboarding - Kethelem Socoowski

## Ambiente
- SO: Windows 10
- Git: 2.51.0
- Node: v24.14.1
- Docker: 29.3.1

## Passos realizados
- Fork e clone do campus-events-api
- cp .env.example .env
- npm install (347 pacotes)
- npm run db:up
- npm run dev
- npm test -> 13/13 testes passaram
- npm run build -> sem erros
- npm run lint -> 636 avisos de CRLF, corrigidos com npm run lint:fix
- curl /health e /health/deep -> status "healthy"

## Dificuldades
- Lint apontou avisos de formatação de quebra de linha (CRLF do Windows), resolvidos com lint:fix
