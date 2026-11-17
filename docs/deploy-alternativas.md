# Pesquisa: alternativa de deploy — VPS + Docker + Nginx

Esta pesquisa compara a solução usada na Parte A (**Render**, uma PaaS) com uma abordagem de infraestrutura própria: **uma VPS (máquina virtual) com Docker Compose e Nginx**.

## 1. Arquitetura geral

```
Usuário / Postman
      │ HTTPS (443)
      ▼
┌──────────────────────── VPS (Ubuntu) ────────────────────────┐
│  Nginx (proxy reverso + TLS com Let's Encrypt)               │
│      │ http://api:3000 (rede interna do Docker)              │
│      ▼                                                       │
│  Container "api" (imagem do Dockerfile do projeto)           │
│      │ postgres://db:5432 (rede interna do Docker)           │
│      ▼                                                       │
│  Container "db" (PostgreSQL 17) + volume persistente         │
└──────────────────────────────────────────────────────────────┘
```

Só o Nginx fica exposto na internet (portas 80/443). A API e o banco ficam numa rede interna do Docker, sem portas públicas.

## 2. Ferramentas e serviços

| Função | Ferramenta |
|---|---|
| Servidor | VPS em provedor como DigitalOcean, Hetzner, AWS EC2 ou Oracle Cloud |
| Sistema operacional | Ubuntu Server LTS |
| Containers | Docker + Docker Compose |
| Proxy reverso | Nginx |
| HTTPS | Certbot / Let's Encrypt |
| Registry da imagem | GitHub Container Registry (ghcr.io) |
| CI/CD | GitHub Actions (build, testes, push da imagem e deploy via SSH) |
| Firewall | UFW, liberando apenas 22, 80 e 443 |

## 3. Onde a API e o banco são executados

- **API:** container Docker na VPS, criado a partir do `Dockerfile` do projeto.
- **Banco:** container PostgreSQL na mesma VPS, com os dados em um **volume Docker** para não se perderem quando o container é recriado.
- Variação mais robusta: usar um banco gerenciado (ex.: AWS RDS, DigitalOcean Managed Postgres) e deixar na VPS só a API.

## 4. Processo de build e deploy

1. Push/merge na `main` → GitHub Actions roda lint, build e testes (o pipeline atual do projeto).
2. Com os checks verdes, o workflow faz `docker build` e publica a imagem com a tag do commit: `ghcr.io/kethelems/campus-events-api:git-<sha>`.
3. O workflow conecta na VPS por SSH (chave guardada em GitHub Secrets) e executa:
   ```bash
   docker compose pull api
   docker compose up -d api
   ```
4. Smoke test após o deploy: `curl -f https://dominio/health` e `curl -f https://dominio/health/deep`. Se falhar, o workflow marca o deploy como falho e dispara o rollback.

Estratégia de publicação: **Recreate** (para o container antigo e sobe o novo), com alguns segundos de indisponibilidade. Para evitar isso, seria possível rodar duas instâncias da API atrás do Nginx (rolling) ou usar blue/green trocando o upstream do Nginx.

## 5. Variáveis de ambiente e secrets

- **Na VPS:** arquivo `.env` fora do repositório (ex.: `/opt/campus-events/.env`), com permissão `600`, lido pelo `docker-compose.yml` via `env_file`.
  - `NODE_ENV=production`, `PORT=3000` → configuração
  - `DATABASE_URL`, `POSTGRES_PASSWORD` → secrets
- **No GitHub:** `SSH_PRIVATE_KEY`, `VPS_HOST` e o token do registry ficam em **GitHub Secrets**, de preferência em um **Environment `production`** com aprovação manual.
- Nenhum secret vai para o Git, para o Dockerfile ou para os logs.

## 6. Rollback

Como cada imagem é versionada pelo commit, o rollback é subir a tag anterior:

```bash
API_TAG=git-a81f3c2 docker compose up -d api
```

- **Código:** rollback rápido (segundos), porque a imagem anterior continua no registry.
- **Dados:** voltar o código não desfaz migrations. É preciso fazer backup do volume ou `pg_dump` antes do deploy e preferir migrations compatíveis (expansão/contração).

## 7. Vantagens e limitações

**Vantagens**

- Controle total do servidor, da rede, do Nginx e das versões.
- Custo previsível e baixo (VPS a partir de ~US$ 5/mês), sem hibernação como no plano Free do Render.
- Sem dependência de uma plataforma específica: o mesmo Docker Compose roda em qualquer provedor.
- Bom para aprender infraestrutura (Linux, rede, TLS, proxy).

**Limitações**

- A equipe passa a ser responsável por **tudo**: atualizações de segurança do SO, firewall, certificados, backups e monitoramento.
- Health check, auto-restart, logs centralizados e rollback precisam ser configurados manualmente (o Render já entrega isso pronto).
- Ponto único de falha: se a VPS cair, API e banco caem juntos.
- Escalar exige trabalho manual (mais VPS + load balancer).

## 8. Comparação de complexidade com a Parte A (Render)

| Critério | Render (Parte A) | VPS + Docker + Nginx |
|---|---|---|
| Configuração inicial | Baixa: conectar repositório + `render.yaml` | Alta: servidor, Docker, Nginx, TLS, firewall |
| Banco de dados | Gerenciado (backup e conexão prontos) | Container próprio ou serviço à parte |
| HTTPS | Automático | Certbot + renovação |
| Health check | Configurado no `render.yaml` | Implementado no pipeline e no Compose |
| Rollback | Um clique em **Events → Rollback** | Comando com a tag anterior |
| Secrets | Painel do Render / `fromDatabase` | `.env` na VPS + GitHub Secrets |
| Manutenção | Baixa (a plataforma cuida) | Alta (a equipe cuida) |
| Custo | Free com limitações (hiberna, banco expira em 30 dias) | Pago, mas sem hibernação |
| **Complexidade geral** | **Baixa** | **Média/Alta** |

**Conclusão:** para uma atividade acadêmica e um time pequeno, o Render é mais adequado, porque entrega deploy, banco, HTTPS, health check e rollback com pouca configuração. A abordagem VPS + Docker + Nginx faz sentido quando a equipe precisa de mais controle, custo previsível sem hibernação ou evitar ficar presa a um provedor, aceitando assumir a operação do servidor.
