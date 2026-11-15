# Pesquisa Comparativa de Ferramentas de Deploy (Parte B)

Esta seção apresenta o estudo comparativo de uma estratégia alternativa de implantação para a `campus-events-api`, contrapondo-a à solução PaaS utilizada na Parte A (Render).

## Alternativa Escolhida: Servidor VPS Dedicado com Docker, Docker Compose e Nginx

### 1. Arquitetura Geral da Solução
A arquitetura baseia-se em um servidor virtual privado (VPS) provisionado em um provedor de infraestrutura (como DigitalOcean, AWS EC2 ou Linode). A aplicação Node.js (executando via Docker) e o banco de dados PostgreSQL (em container separado ou gerido na mesma máquina) rodam isolados. Um servidor Nginx atua como proxy reverso na porta 80/443, recebendo as requisições externas da internet, gerenciando certificados SSL (HTTPS) e repassando o tráfego para a porta interna da API.

### 2. Principais Ferramentas ou Serviços Envolvidos
* **Provedor de VPS:** Infraestrutura como Serviço (IaaS) para hospedar o sistema operacional (Ubuntu Server).
* **Docker & Docker Compose:** Para containerização e orquestração local dos serviços da API e do banco de dados PostgreSQL.
* **Nginx:** Proxy reverso, terminação SSL e balanceamento de carga.
* **Certbot (Let's Encrypt):** Geração e renovação automática de certificados de segurança SSL.

### 3. Onde a API e o Banco de Dados Seriam Executados
Ambos seriam executados diretamente na mesma instância de servidor VPS (ou em instâncias separadas, dependendo da escala), utilizando volumes persistentes do Docker (`volumes`) para garantir que os dados do PostgreSQL não sejam perdidos caso o container reinicie.

### 4. Processo de Build e Deploy
* **Build:** O código é compilado localmente ou em uma pipeline de CI/CD (ex: GitHub Actions) que gera a imagem Docker da aplicação e a envia para um registry (como Docker Hub ou GitHub Packages).
* **Deploy:** Via acesso SSH à VPS, o desenvolvedor (ou a pipeline) executa comandos como `docker compose pull` e `docker compose up -d --build` para atualizar os containers em produção sem tempo de indisponibilidade prolongado.

### 5. Tratamento de Variáveis de Ambiente e Secrets
As credenciais sensíveis (como strings de conexão do banco e chaves JWT) não ficam salvas no código-fonte. Elas são gerenciadas através de um arquivo `.env` protegido com permissões restritas de leitura no servidor, ou injetadas de forma segura diretamente no arquivo `docker-compose.yml` utilizando os recursos nativos de variáveis de ambiente do Docker.

### 6. Possibilidade de Rollback
O rollback em uma VPS com Docker é realizado revertendo a versão da imagem utilizada no arquivo de configuração (`docker-compose.yml` com uma tag anterior, ex: `v1.0.0` em vez de `v1.1.0`) e executando novamente o comando de deploy (`docker compose up -d`). Caso utilize uma pipeline automatizada, o histórico de commits do GitHub Actions permite reverter para a versão anterior de forma controlada.

### 7. Vantagens e Limitações
* **Vantagens:** Controle total sobre o sistema operacional, customização irrestrita de rede e firewall, melhor aproveitamento de recursos de hardware fixos e ausência de limitações de tempo ocioso (como o "spin down" do plano gratuito do Render).
* **Limitações:** Alta complexidade de manutenção manual (atualizações de segurança do SO, configuração de firewall UFW, gestão de backups do banco de dados e certificados SSL por conta própria).

### 8. Comparação do Nível de Complexidade
Enquanto a estratégia utilizada na **Parte A (Render)** possui baixíssima complexidade operacional (foco total apenas no código, com provisionamento automático e gerenciamento nativo de banco de dados e HTTPS), a abordagem de **VPS com Docker e Nginx** exige um nível de complexidade intermediário/avançado, pois transfere a responsabilidade de administração de infraestrutura, redes, segurança e resiliência inteiramente para o desenvolvedor.
