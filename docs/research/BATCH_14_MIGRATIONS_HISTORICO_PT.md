[DECISÃO DE ENGENHARIA] O backend passou a usar um runner real de migrations do TypeORM com histórico persistido em `typeorm_migrations`.

[DECISÃO DE ENGENHARIA] A implementação anterior executava apenas `schema.sql` por meio de um script customizado idempotente, sem registrar quais mudanças já haviam sido aplicadas em cada ambiente.

[DECISÃO DE ENGENHARIA] Isso criava divergência entre:
- o conjunto de migrations TypeScript em `backend/src/database/migrations/*.ts`
- o `schema.sql` efetivamente executado em produção
- o banco implantado na Railway

[DECISÃO DE ENGENHARIA] A nova estratégia estabelece uma trilha explícita de evolução do schema:
1. baseline do estado que já estava consolidado em produção
2. migração de alinhamento para estruturas que existiam no código, mas não no banco
3. uso contínuo do histórico de migrations do TypeORM para mudanças futuras

[DECISÃO DE ENGENHARIA] A baseline não tenta reexecutar as migrations antigas uma a uma sobre um banco já existente. Em vez disso, ela registra no histórico as migrations equivalentes ao estado previamente materializado no ambiente produtivo.

[DECISÃO DE ENGENHARIA] Esse desenho reduz risco operacional, porque evita aplicar uma migration antiga cuja expectativa de schema inicial não corresponde mais ao banco real.

[PARÂMETRO EXPERIMENTAL] A tabela de histórico adotada foi `typeorm_migrations`, seguindo a convenção nativa do TypeORM.

[DECISÃO DE ENGENHARIA] A migração de alinhamento cobre os artefatos identificados como órfãos no banco Railway durante a auditoria:
- `exercise_performance`
- `island_exercises_mapping`
- `islands`
- `island_activity_mappings`
- `activities.islandId`
- colunas adicionais de `review_assignments`
- colunas adicionais de `review_outcomes`
- colunas de contexto de ilha em `ade_decisions`

[HIPÓTESE A VALIDAR] Após a mudança, ambientes novos e ambientes existentes devem convergir para o mesmo schema sem necessidade de manter `schema.sql` como fonte de verdade operacional.

[DECISÃO DE ENGENHARIA] O seed continua separado da trilha de migrations, mas agora usa a mesma configuração central de `DataSource`, reduzindo deriva entre execução de aplicação, migrations e seeds.

## Texto potencial para a dissertação

### Metodologia

[DECISÃO DE ENGENHARIA] Foi realizada uma auditoria comparando o schema produtivo observado na Railway, o script idempotente anteriormente usado na inicialização do backend e o conjunto de migrations TypeScript mantido no repositório. A partir dessa comparação, definiu-se uma baseline histórica e uma migração de alinhamento para normalizar a evolução do banco.

### Decisão de projeto

[DECISÃO DE ENGENHARIA] Optou-se por adotar o mecanismo nativo de migrations do TypeORM com tabela de histórico persistente, pois ele permite rastreabilidade, reprodutibilidade e menor risco de divergência entre ambientes.

### Limitações

[LIMITAÇÃO] A baseline representa o estado consolidado já existente e não substitui uma reconstrução histórica perfeita da evolução do schema desde a origem do projeto.

### Evidência necessária no experimento

[HIPÓTESE A VALIDAR] Deve-se demonstrar empiricamente que um ambiente limpo e um ambiente previamente implantado convergem para o mesmo conjunto de tabelas, colunas e índices após a execução do novo fluxo de migrations.
