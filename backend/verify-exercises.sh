#!/bin/bash
# 📊 VERIFICAR INSERÇÃO DOS 77 EXERCÍCIOS
# Execute isso no console do backend após rodar seed

echo "🔍 Verificando inserção dos 77 exercícios..."
echo ""

echo "📈 Total de exercícios no banco:"
psql $DATABASE_URL -c "SELECT COUNT(*) as total FROM activities;" 2>&1

echo ""
echo "📚 Exercícios por skill:"
psql $DATABASE_URL -c "SELECT bnccSkills, COUNT(*) as count FROM activities, jsonb_array_elements(\"bnccSkills\") AS skill GROUP BY bnccSkills ORDER BY COUNT DESC;" 2>&1

echo ""
echo "🎯 EF01MA03 (Comparação) - PRIORIDADE:"
psql $DATABASE_URL -c "SELECT COUNT(*) as ma03_count FROM activities WHERE \"bnccSkills\"::text LIKE '%EF01MA03%';" 2>&1

echo ""
echo "🎮 Tipos de exercício:"
psql $DATABASE_URL -c "SELECT type, COUNT(*) as count FROM activities GROUP BY type ORDER BY COUNT DESC;" 2>&1

echo ""
echo "🔐 Estruturas únicas (para hard block filtering):"
psql $DATABASE_URL -c "SELECT COUNT(DISTINCT (content->'semantic'->>'structureId')) as unique_structures FROM activities WHERE content->'semantic'->>'structureId' IS NOT NULL;" 2>&1

echo ""
echo "✅ Se EF01MA03 > 13 e estruturas > 7, o ciclo foi QUEBRADO!"
