# Entrega 1 — Backlog inicial

Aluno: Ricardo Minuto (Ricardopbm).

Data: 15/11/2026. Trabalho individual.

## Objetivo e resultado

Foram cadastradas seis issues no GitHub para planejar a evolução do Campus Events API. Todas têm título descritivo, contexto/problema, resultado esperado, critérios de aceite verificáveis, labels de tipo e prioridade, responsável e branch sugerida.

As issues representam trabalho planejado e permanecem abertas. A conclusão desta entrega é o cadastro do backlog; não significa que as funcionalidades já foram implementadas.

## Issues cadastradas

| Categoria exigida | Issue | Prioridade | Branch sugerida |
| --- | --- | --- | --- |
| Documentação/onboarding | [#1 — Guia de instalação e endpoints](https://github.com/Ricardopbm/campus-events-api/issues/1) | Média | `docs/guia-api-eventos` |
| Funcionalidade de eventos | [#2 — Cadastro e listagem de eventos](https://github.com/Ricardopbm/campus-events-api/issues/2) | Alta | `feat/cadastro-eventos` |
| Funcionalidade de inscrições | [#3 — Inscrições, vagas e duplicidade](https://github.com/Ricardopbm/campus-events-api/issues/3) | Alta | `feat/inscricoes-eventos` |
| Teste ou qualidade | [#4 — Regras de domínio e testes Vitest](https://github.com/Ricardopbm/campus-events-api/issues/4) | Alta | `test/regras-eventos-inscricoes` |
| Refatoração/manutenção | [#5 — Consultas separadas por domínio](https://github.com/Ricardopbm/campus-events-api/issues/5) | Média | `refactor/consultas-por-dominio` |
| Segurança, infraestrutura ou CI | [#6 — CI e relatório de cobertura](https://github.com/Ricardopbm/campus-events-api/issues/6) | Média | `ci/cobertura-e-verificacoes` |

Responsável atribuído no GitHub em todas as issues: **Ricardopbm**. Foram criadas labels `tipo:documentacao`, `tipo:funcionalidade`, `tipo:teste`, `tipo:refatoracao`, `tipo:ci`, `prioridade:alta` e `prioridade:media`.

## Ordem proposta

1. Implementar #2 e depois #3, com uma branch e um PR por issue, para a entrega 2.
2. Evoluir as regras isoladas e seus testes em #4, para a entrega 3.
3. Evoluir os workflows em #6, para a entrega 4.
4. Atualizar o guia #1 conforme os endpoints forem disponibilizados e realizar #5 após a implementação das consultas.

O desenvolvimento inicial já deverá validar entradas e preservar os testes existentes. A issue #4 aprofunda a separação e a cobertura unitária das regras. Como o trabalho é individual, a exigência de revisão por outra pessoa na entrega 2 ainda precisa ser alinhada com a professora.

## Evidências

- [Lista de issues no GitHub](https://github.com/Ricardopbm/campus-events-api/issues).
- [Exportação dos seis registros consultados no GitHub](issues-github.json), incluindo títulos, descrições, labels, responsáveis, URLs e estado na data do cadastro.
- Cópias dos textos: [#1](issues/1.md), [#2](issues/2.md), [#3](issues/3.md), [#4](issues/4.md), [#5](issues/5.md) e [#6](issues/6.md).

Foi verificada a presença dos campos obrigatórios, das duas classes de labels e do responsável nas seis issues, além da correspondência entre os textos locais e os publicados.

Este relatório e os links poderão compor o envio conjunto por e-mail. Nenhum e-mail foi enviado nesta etapa.
