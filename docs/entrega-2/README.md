# Entrega 2 — Fluxo de desenvolvimento

Aluno: Ricardo Minuto. Data: 15/11/2026. Trabalho individual.

## Issues, branches e pull requests

| Issue | Branch | Pull request | Resultado |
| --- | --- | --- | --- |
| [#2 — Eventos](https://github.com/Ricardopbm/campus-events-api/issues/2) | `feat/cadastro-eventos` | [PR #7](https://github.com/Ricardopbm/campus-events-api/pull/7) | Cadastro e listagem de eventos |
| [#3 — Inscrições](https://github.com/Ricardopbm/campus-events-api/issues/3) | `feat/inscricoes-eventos` | [PR #8](https://github.com/Ricardopbm/campus-events-api/pull/8) | Inscrição com vagas e bloqueio de duplicidade |

O PR #7 tem base em main. Como inscrições dependem dos eventos, o PR #8 tem base em feat/cadastro-eventos, isolando as alterações de inscrições no seu diff. Os dois PRs estão abertos; não foram integrados. Depois da integração do primeiro, o segundo pode ter sua base alterada para main.

## Implementação e validação

- `POST /events`: título não vazio, descrição opcional, data/hora futura com fuso e capacidade inteira positiva. Resposta 201 com id.
- `GET /events`: lista ordenada por data/hora e id.
- `POST /events/:eventId/registrations`: valida identificador, nome e e-mail; normaliza e-mail; retorna 404 para evento inexistente e 409 para evento iniciado, lotação ou duplicidade.
- Migrations reversíveis, consultas parametrizadas, chave estrangeira e unicidade de e-mail por evento.
- Controle de concorrência: transação e `SELECT ... FOR UPDATE` sobre o evento antes de verificar duplicidade e contar vagas. A conexão é liberada em `finally` e falhas provocam rollback.

### Evidências

| Etapa | Testes | Lint | Build | Requisições HTTP reais |
| --- | --- | --- | --- | --- |
| Eventos | [24 aprovados](evidencias/eventos-testes.txt) | [Aprovado](evidencias/eventos-lint.txt) | [Aprovado](evidencias/eventos-build.txt) | [201, 400 e 200](evidencias/eventos-http.txt) |
| Eventos e inscrições | [40 aprovados](evidencias/inscricoes-testes.txt) | [Aprovado](evidencias/inscricoes-lint.txt) | [Aprovado](evidencias/inscricoes-build.txt) | [201 e 409](evidencias/inscricoes-http.txt) |

A suíte final inclui 13 testes originais, 11 de eventos e 16 de inscrições. Entre os casos estão requisições simultâneas pela última vaga, duplicidade simultânea, e-mail em eventos diferentes, entrada inválida e evento iniciado. As migrations de subida e descida são exercitadas pela suíte.

Os testes usam o banco api_test na porta 4328. A validação HTTP manual usou api_dev e uma instância temporária na porta **3010**, pois havia uma instância anterior na porta 3001. Os participantes usados são dados fictícios com domínio example.com. Os logs acima são de execução local; não são evidências do GitHub Actions.

Para executar a versão com as duas funcionalidades:

```powershell
git switch feat/inscricoes-eventos
npm.cmd ci
npm.cmd run db:up
# Aguardar os bancos aceitarem conexões antes dos testes.
npm.cmd test -- --run
npm.cmd run lint
npm.cmd run build
npm.cmd run dev
```

## Verificação técnica assistida e ajuste

Foram conferidos os contratos HTTP, as validações, as migrations, os parâmetros SQL, o ciclo de transação e os testes de concorrência. Na revisão da tipagem foi identificado que `pg` retorna TIMESTAMPTZ como `Date`, mas o tipo CampusEvent herdava `startsAt` como string da entrada HTTP. A tipagem foi corrigida para Date; Express continua serializando o valor como ISO 8601 na resposta. A verificação final de lint e build está em [revisao-checks.txt](evidencias/revisao-checks.txt).

## Pendência da atividade em dupla

A implementação, commits, pushes, vínculos com issues, PRs e evidências estão preparados. **Não houve revisão por outra pessoa da dupla nem troca de comentários entre dois integrantes.** O trabalho foi realizado individualmente com assistência de IA; a verificação técnica descrita acima não substitui o requisito de revisão por colega. A aceitação dessa adaptação precisa ser alinhada com a professora.

Assim, esta entrega está preparada tecnicamente, mas não é apresentada como cumprimento integral do requisito de colaboração. Os links dos dois PRs deverão constar no e-mail conjunto. Nenhum e-mail foi enviado.
