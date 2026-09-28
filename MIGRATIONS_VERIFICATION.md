# Verificação de Migrations - Islands Implementation

## Como Verificar se as Migrations Rodaram

### 1. **Verificar via TypeORM (Recomendado)**

```bash
cd backend
npm run db:migrate
```

Este comando executa todas as migrations pendentes. Se as migrations já foram executadas, ele não fará nada.

### 2. **Verificar Tabelas no Banco de Dados**

```sql
-- Conectar ao banco PostgreSQL
psql $DATABASE_URL

-- Verificar se as tabelas foram criadas
\dt islands
\dt island_activity_mappings
\dt island_exercises_mapping

-- Verificar se as colunas foram adicionadas à ade_decisions
\d ade_decisions

-- Verificar se as colunas foram adicionadas à activity_attempts
\d activity_attempts
```

### 3. **Verificar Dados das Ilhas**

```sql
-- Listar todas as ilhas criadas
SELECT islandId, name, theme, sequenceOrder FROM islands ORDER BY sequenceOrder;

-- Resultado esperado:
-- islandId        | name              | theme   | sequenceOrder
-- island-numbers  | Ilha dos Números  | numbers | 1
-- island-colors   | Ilha das Cores    | colors  | 2
-- island-beach    | Ilha da Praia     | beach   | 3
```

### 4. **Verificar Mapeamento de Atividades**

```sql
-- Contar atividades por ilha
SELECT islandId, COUNT(*) as activity_count 
FROM island_activity_mappings 
GROUP BY islandId;

-- Listar algumas atividades mapeadas
SELECT iam.islandId, iam.sequenceInIsland, a.title 
FROM island_activity_mappings iam
JOIN activities a ON iam.activityId = a.id
LIMIT 10;
```

### 5. **Verificar Colunas Adicionadas**

```sql
-- Verificar se ade_decisions tem as novas colunas
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'ade_decisions' 
AND column_name IN ('recommendedIslandId', 'sequenceInIsland');

-- Resultado esperado:
-- recommendedIslandId
-- sequenceInIsland

-- Verificar se activity_attempts tem islandId
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'activity_attempts' 
AND column_name = 'islandId';

-- Resultado esperado:
-- islandId
```

## Migrations Implementadas

### 1. `1726950004000-AddIslandCycleToActivityAttempts.ts`
- Adiciona coluna `islandId` a `activity_attempts`
- Adiciona coluna `cycleNumber` a `activity_attempts`

### 2. `1726950005000-AddCheckpointContextToReviewAssignments.ts`
- Adiciona coluna `checkpointContext` a `review_assignments`

### 3. `1726950006000-CreateIslandsAndActivityMappings.ts`
- Cria tabela `islands` com metadados das ilhas
- Cria tabela `island_activity_mappings` para mapear atividades às ilhas
- Insere 3 ilhas iniciais (Números, Cores, Praia)

### 4. `1726950007000-AddIslandContextToAdeDecision.ts`
- Adiciona coluna `recommendedIslandId` a `ade_decisions`
- Adiciona coluna `sequenceInIsland` a `ade_decisions`
- Cria índices para performance

## Como Executar Migrations em Produção (Railway)

1. **Via Railway CLI:**
```bash
railway run npm run db:migrate
```

2. **Via Dashboard Railway:**
   - Ir para o serviço backend
   - Abrir terminal
   - Executar: `npm run db:migrate`

3. **Via GitHub Actions (se configurado):**
   - As migrations devem rodar automaticamente no deploy

## Verificar Status das Migrations

```bash
# Ver todas as migrations executadas
npm run db:migrate -- --show

# Ver apenas as migrations pendentes
npm run db:migrate -- --pending
```

## Rollback (se necessário)

```bash
# Reverter a última migration
npm run db:migrate -- --revert

# Reverter até uma migration específica
npm run db:migrate -- --revert --until=1726950006000
```

## Checklist de Verificação

- [ ] Tabela `islands` existe e contém 3 ilhas
- [ ] Tabela `island_activity_mappings` existe
- [ ] Coluna `islandId` existe em `activity_attempts`
- [ ] Coluna `cycleNumber` existe em `activity_attempts`
- [ ] Coluna `recommendedIslandId` existe em `ade_decisions`
- [ ] Coluna `sequenceInIsland` existe em `ade_decisions`
- [ ] Índices foram criados para performance
- [ ] Atividades foram mapeadas para ilhas
- [ ] Frontend consegue buscar dados via `/activities/islands/map`

## Troubleshooting

### Erro: "relation 'islands' does not exist"
- Significa que a migration `1726950006000` não rodou
- Solução: Execute `npm run db:migrate`

### Erro: "column 'islandId' does not exist"
- Significa que a migration `1726950004000` não rodou
- Solução: Execute `npm run db:migrate`

### Migrations não aparecem no banco
- Verifique se o `DATABASE_URL` está correto
- Verifique se o banco está acessível
- Verifique os logs: `npm run db:migrate -- --verbose`

## Referências

- [TypeORM Migrations](https://typeorm.io/migrations)
- [Railway Database](https://docs.railway.app/databases)
- [PostgreSQL psql commands](https://www.postgresql.org/docs/current/app-psql.html)
