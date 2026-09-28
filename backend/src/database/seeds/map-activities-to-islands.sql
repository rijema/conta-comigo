-- Script to map existing activities to the 3 initial islands
-- Island 1: Números (Numbers)
-- Island 2: Cores (Colors)
-- Island 3: Praia (Beach)

-- ============================================
-- ISLAND 1: NÚMEROS (Numbers)
-- ============================================
-- Focus: Counting, sequences, basic operations with numbers
-- Difficulty progression: very_easy → easy → medium → hard → extreme

-- Very Easy (Sequence 1-2)
INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-numbers', id, 1, difficulty, 'visual', 
  'Conte os números',
  'Observe os números e conte quantos há',
  '{"hints": ["Comece do 1"], "workedExample": "1, 2, 3"}'::jsonb
FROM activities
WHERE title LIKE '%Qual número vem depois%' AND difficulty = 'very_easy'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-numbers', id, 2, difficulty, 'visual',
  'Complete a sequência',
  'Qual número falta na sequência?',
  '{"hints": ["Conte em ordem"], "workedExample": "1, 2, ?"}'::jsonb
FROM activities
WHERE title LIKE '%Completar a contagem%' AND difficulty = 'very_easy'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

-- Easy (Sequence 3-5)
INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-numbers', id, 3, difficulty, 'visual',
  'Ordene os números',
  'Arraste os números do menor para o maior',
  '{"hints": ["Comece pelo menor"], "workedExample": "1, 2, 3, 4"}'::jsonb
FROM activities
WHERE title LIKE '%Ordene do menor para o maior%' AND difficulty = 'easy'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-numbers', id, 4, difficulty, 'visual',
  'Qual número é maior?',
  'Compare os números e escolha o maior',
  '{"hints": ["O número maior fica à direita"], "workedExample": "7 > 4"}'::jsonb
FROM activities
WHERE title LIKE '%Qual número é maior%' AND difficulty = 'easy'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-numbers', id, 5, difficulty, 'visual',
  'Soma simples',
  'Junte dois grupos e conte o total',
  '{"hints": ["Conte todos os itens"], "workedExample": "2 + 1 = 3"}'::jsonb
FROM activities
WHERE title LIKE '%Somar dois grupos%' AND difficulty = 'easy'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

-- Medium (Sequence 6-7)
INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-numbers', id, 6, difficulty, 'cognitive',
  'Operação com dois dígitos',
  'Resolva a operação matemática',
  '{"hints": ["Conte nos dedos", "Use a reta numérica"], "workedExample": "5 + 3 = 8"}'::jsonb
FROM activities
WHERE title LIKE '%Complete: 3 + ? = 8%' AND difficulty = 'medium'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-numbers', id, 7, difficulty, 'cognitive',
  'Subtração básica',
  'Tire itens do grupo e conte o que sobra',
  '{"hints": ["Comece com o total", "Tire um de cada vez"], "workedExample": "5 - 2 = 3"}'::jsonb
FROM activities
WHERE title LIKE '%Tirar e contar%' AND difficulty = 'medium'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

-- Hard (Sequence 8-9)
INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-numbers', id, 8, difficulty, 'cognitive',
  'Problema com dois passos',
  'Resolva um problema que precisa de duas operações',
  '{"hints": ["Faça uma operação de cada vez", "Depois use o resultado"], "workedExample": "Tinha 5, ganhou 2, depois perdeu 1. Quantos tem?"}'::jsonb
FROM activities
WHERE title LIKE '%Resolver uma compra em duas etapas%' AND difficulty = 'hard'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-numbers', id, 9, difficulty, 'sensory',
  'Padrão numérico',
  'Descubra o padrão e complete a sequência',
  '{"hints": ["Qual é a regra?", "Aumenta ou diminui?"], "workedExample": "2, 4, 6, 8, ?"}'::jsonb
FROM activities
WHERE title LIKE '%Contar de dois em dois%' AND difficulty = 'hard'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

-- Extreme (Sequence 10)
INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-numbers', id, 10, difficulty, 'cognitive',
  'Desafio numérico',
  'Resolva um problema complexo com números maiores',
  '{"hints": ["Divida em partes", "Resolva uma de cada vez"], "workedExample": "Tinha 15, ganhou 8, depois perdeu 5. Quantos tem?"}'::jsonb
FROM activities
WHERE title LIKE '%Descobrir quantos livros foram retirados%' AND difficulty = 'extreme'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

-- ============================================
-- ISLAND 2: CORES (Colors)
-- ============================================
-- Focus: Color recognition, patterns, classification
-- Difficulty progression: very_easy → easy → medium → hard → extreme

-- Very Easy (Sequence 1-2)
INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-colors', id, 1, difficulty, 'visual',
  'Reconheça a cor',
  'Qual é a cor desta forma?',
  '{"hints": ["Olhe bem", "Qual cor você vê?"], "workedExample": "Este círculo é vermelho"}'::jsonb
FROM activities
WHERE title LIKE '%Continuar o padrão de cores%' AND difficulty = 'very_easy'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-colors', id, 2, difficulty, 'visual',
  'Agrupe por cor',
  'Coloque as figuras da mesma cor juntas',
  '{"hints": ["Procure pela mesma cor", "Vermelho com vermelho"], "workedExample": "Vermelho, vermelho, azul"}'::jsonb
FROM activities
WHERE title LIKE '%Agrupar figuras por cor%' AND difficulty = 'very_easy'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

-- Easy (Sequence 3-5)
INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-colors', id, 3, difficulty, 'visual',
  'Padrão de cores simples',
  'Continue o padrão de cores',
  '{"hints": ["Qual cor vem depois?", "Repete a sequência"], "workedExample": "Vermelho, azul, vermelho, ?"}'::jsonb
FROM activities
WHERE title LIKE '%Completar o padrão%' AND difficulty = 'easy'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-colors', id, 4, difficulty, 'visual',
  'Separe por tamanho e cor',
  'Agrupe as figuras por tamanho e cor',
  '{"hints": ["Primeiro por tamanho", "Depois por cor"], "workedExample": "Pequeno vermelho, grande azul"}'::jsonb
FROM activities
WHERE title LIKE '%Separar figuras por tamanho%' AND difficulty = 'easy'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-colors', id, 5, difficulty, 'visual',
  'Qual cor tem mais?',
  'Compare grupos de cores diferentes',
  '{"hints": ["Conte cada cor", "Qual tem mais?"], "workedExample": "3 vermelhos, 2 azuis. Vermelho tem mais"}'::jsonb
FROM activities
WHERE title LIKE '%Comparar cores das figuras%' AND difficulty = 'easy'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

-- Medium (Sequence 6-7)
INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-colors', id, 6, difficulty, 'cognitive',
  'Padrão complexo de cores',
  'Descubra e continue o padrão de cores',
  '{"hints": ["Qual é a regra?", "Repete ou muda?"], "workedExample": "Vermelho, vermelho, azul, vermelho, vermelho, ?"}'::jsonb
FROM activities
WHERE title LIKE '%Descobrir a repetição%' AND difficulty = 'medium'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-colors', id, 7, difficulty, 'cognitive',
  'Classificação por múltiplos atributos',
  'Agrupe por cor E tamanho',
  '{"hints": ["Dois critérios", "Cor E tamanho"], "workedExample": "Pequeno vermelho aqui, grande azul ali"}'::jsonb
FROM activities
WHERE title LIKE '%Comparar tamanhos das figuras%' AND difficulty = 'medium'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

-- Hard (Sequence 8-9)
INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-colors', id, 8, difficulty, 'cognitive',
  'Padrão com transformação',
  'O padrão muda de cor e tamanho',
  '{"hints": ["Muda cor?", "Muda tamanho?"], "workedExample": "Pequeno vermelho, grande azul, pequeno vermelho, ?"}'::jsonb
FROM activities
WHERE title LIKE '%Perceber a forma mesmo girada%' AND difficulty = 'hard'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-colors', id, 9, difficulty, 'sensory',
  'Encontre a cor diferente',
  'Qual cor não pertence ao grupo?',
  '{"hints": ["Procure a diferença", "Uma não é igual"], "workedExample": "Vermelho, vermelho, azul, vermelho. Qual é diferente?"}'::jsonb
FROM activities
WHERE title LIKE '%Encontrar a figura diferente do grupo%' AND difficulty = 'hard'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

-- Extreme (Sequence 10)
INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-colors', id, 10, difficulty, 'cognitive',
  'Desafio de padrões',
  'Resolva um padrão muito complexo com cores',
  '{"hints": ["Qual é a regra?", "Muda cor? Muda tamanho? Muda posição?"], "workedExample": "Pequeno vermelho, grande azul, médio verde, ?"}'::jsonb
FROM activities
WHERE title LIKE '%Comparar figuras com quatro lados%' AND difficulty = 'extreme'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

-- ============================================
-- ISLAND 3: PRAIA (Beach)
-- ============================================
-- Focus: Beach items, ocean, sand, sun, learning through beach context
-- Difficulty progression: very_easy → easy → medium → hard → extreme

-- Very Easy (Sequence 1-2)
INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-beach', id, 1, difficulty, 'visual',
  'Conte os itens da praia',
  'Quantos itens de praia você vê?',
  '{"hints": ["Conte um de cada vez", "Comece do 1"], "workedExample": "1 sol, 2 conchas"}'::jsonb
FROM activities
WHERE title LIKE '%Contar as estrelas%' AND difficulty = 'very_easy'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-beach', id, 2, difficulty, 'visual',
  'Qual grupo tem mais?',
  'Compare grupos de itens da praia',
  '{"hints": ["Conte cada grupo", "Qual tem mais?"], "workedExample": "3 conchas, 2 peixes. Conchas têm mais"}'::jsonb
FROM activities
WHERE title LIKE '%Encontrar o grupo com mais%' AND difficulty = 'very_easy'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

-- Easy (Sequence 3-5)
INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-beach', id, 3, difficulty, 'visual',
  'Soma na praia',
  'Junte itens de praia e conte',
  '{"hints": ["Conte todos", "Junte os grupos"], "workedExample": "2 conchas + 3 conchas = 5 conchas"}'::jsonb
FROM activities
WHERE title LIKE '%Juntar bolas e contar%' AND difficulty = 'easy'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-beach', id, 4, difficulty, 'visual',
  'Problema da praia',
  'Resolva um problema sobre itens de praia',
  '{"hints": ["Leia com atenção", "Qual é a pergunta?"], "workedExample": "Tinha 5 conchas, achei mais 2. Quantas tenho?"}'::jsonb
FROM activities
WHERE title LIKE '%Resolver um problema do dia a dia%' AND difficulty = 'easy'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-beach', id, 5, difficulty, 'sensory',
  'Subtração na praia',
  'Tire itens e conte o que sobra',
  '{"hints": ["Comece com o total", "Tire alguns"], "workedExample": "Tinha 5 peixes, 2 fugiram. Quantos ficaram?"}'::jsonb
FROM activities
WHERE title LIKE '%Tirar frutas de uma cesta%' AND difficulty = 'easy'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

-- Medium (Sequence 6-7)
INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-beach', id, 6, difficulty, 'cognitive',
  'Operação com números maiores',
  'Soma ou subtração com números da praia',
  '{"hints": ["Use a reta numérica", "Conte nos dedos"], "workedExample": "10 conchas + 5 conchas = 15 conchas"}'::jsonb
FROM activities
WHERE title LIKE '%Somar mais figuras%' AND difficulty = 'medium'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-beach', id, 7, difficulty, 'cognitive',
  'Problema com dois passos na praia',
  'Resolva um problema que precisa de duas operações',
  '{"hints": ["Faça uma operação de cada vez", "Depois use o resultado"], "workedExample": "Tinha 8 conchas, achei 4, perdi 2. Quantas tenho?"}'::jsonb
FROM activities
WHERE title LIKE '%Descobrir quantas frutas restaram%' AND difficulty = 'medium'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

-- Hard (Sequence 8-9)
INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-beach', id, 8, difficulty, 'cognitive',
  'Problema complexo da praia',
  'Resolva um problema com múltiplos passos',
  '{"hints": ["Divida em partes", "Resolva uma de cada vez"], "workedExample": "Tinha 12 conchas, achei 8, perdi 5. Quantas tenho?"}'::jsonb
FROM activities
WHERE title LIKE '%Descobrir quantas figurinhas sobraram%' AND difficulty = 'hard'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-beach', id, 9, difficulty, 'sensory',
  'Comparação na praia',
  'Compare quantidades de itens de praia',
  '{"hints": ["Conte cada grupo", "Qual tem mais?"], "workedExample": "Uma cesta tem 7 conchas, outra tem 5. Qual tem mais?"}'::jsonb
FROM activities
WHERE title LIKE '%Comparar quantidades de grupos%' AND difficulty = 'hard'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

-- Extreme (Sequence 10)
INSERT INTO "island_activity_mappings" ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "scaffolding")
SELECT 'island-beach', id, 10, difficulty, 'cognitive',
  'Desafio da praia',
  'Resolva um problema muito complexo',
  '{"hints": ["Qual é a pergunta?", "Divida em partes", "Resolva uma de cada vez"], "workedExample": "Tinha 20 conchas, achei 15, perdi 8. Quantas tenho?"}'::jsonb
FROM activities
WHERE title LIKE '%Comparar duas cestas de frutas%' AND difficulty = 'extreme'
LIMIT 1
ON CONFLICT ("islandId", "activityId") DO NOTHING;

-- ============================================
-- Summary
-- ============================================
-- This script maps 30 activities (10 per island) to the 3 initial islands
-- Each island has a progression from very_easy to extreme difficulty
-- Each activity has custom titles, instructions, and scaffolding for the island context
