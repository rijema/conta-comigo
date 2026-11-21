#!/usr/bin/env bash
# Testes de mutação da ontologia: insere, um de cada vez, erros de modelagem
# conhecidos e verifica se o HermiT os detecta (inconsistência ou classe
# insatisfatível). Uma ontologia sem disjunções nem propriedades funcionais
# aceita todos esses erros em silêncio; o objetivo é mostrar que a v0.7.0 não.
#
# Uso (da raiz do repositório), depois de reason.sh ter baixado o ROBOT:
#   bash ontology/reasoning/mutation-tests.sh [arquivo.owl]
set -euo pipefail

ONTOLOGY=${1:-ontology/contacomigo/contacomigo.owl}
OUT=${OUT:-ontology/reasoning/out}
JAR=${ROBOT_JAR:-$OUT/robot-1.9.8.jar}
CC='https://contacomigo.org/ontology#'
mkdir -p "$OUT/mutations"

detected=0
total=0

mutate() {
  local name=$1 old=$2 new=$3 target="$OUT/mutations/$1.owl"
  total=$((total + 1))
  python3 -I - "$ONTOLOGY" "$old" "$new" "$target" <<'PY'
import sys
source, old, new, target = sys.argv[1:]
text = open(source, encoding='utf-8').read()
if old not in text:
    sys.exit(f'trecho não encontrado para a mutação: {old[:60]}')
open(target, 'w', encoding='utf-8').write(text.replace(old, new, 1))
PY
  local log
  log=$(java -jar "$JAR" reason --reasoner HermiT --input "$target" --output /dev/null 2>&1 || true)
  if grep -qiE 'inconsistent|unsatisfiable' <<<"$log"; then
    detected=$((detected + 1))
    printf '%-28s detectado\n' "$name"
  else
    printf '%-28s NÃO detectado\n' "$name"
  fi
}

# M1 Habilidade ligada a dois anos (belongsToGrade é funcional; anos são distintos)
mutate M1-dois-anos \
  "<cc:belongsToGrade rdf:resource=\"${CC}BNCCElementaryYear3\"/>" \
  "<cc:belongsToGrade rdf:resource=\"${CC}BNCCElementaryYear3\"/><cc:belongsToGrade rdf:resource=\"${CC}BNCCElementaryYear4\"/>"
# M2 Habilidade em duas unidades temáticas
mutate M2-duas-unidades \
  "<cc:belongsToCurriculumDomain rdf:resource=\"${CC}BNCCNumbersDomain\"/>" \
  "<cc:belongsToCurriculumDomain rdf:resource=\"${CC}BNCCNumbersDomain\"/><cc:belongsToCurriculumDomain rdf:resource=\"${CC}BNCCGeometryDomain\"/>"
# M3 Habilidade tipada também como atividade (camadas disjuntas)
mutate M3-habilidade-atividade \
  "<rdf:type rdf:resource=\"${CC}BNCCSkill\"/>" \
  "<rdf:type rdf:resource=\"${CC}BNCCSkill\"/><rdf:type rdf:resource=\"${CC}LearningActivity\"/>"
# M4 Ano apontando para outra habilidade (alcance CurriculumLevel, disjunto de CurriculumSkill)
mutate M4-ano-errado \
  "<cc:belongsToGrade rdf:resource=\"${CC}BNCCElementaryYear3\"/>" \
  "<cc:belongsToGrade rdf:resource=\"${CC}BNCC_EF01MA01\"/>"
# M5 Erro de alcance do tipo corrigido na v0.6.0 (isAddressedByActivity)
mutate M5-alcance-incorreto \
  "<owl:ObjectProperty rdf:about=\"${CC}isAddressedByActivity\">" \
  "<owl:ObjectProperty rdf:about=\"${CC}isAddressedByActivity\"><rdfs:range rdf:resource=\"${CC}ActivityType\"/>"
# M6 Dimensão de atividade subordinada a outra dimensão
mutate M6-dimensao-misturada \
  "<owl:Class rdf:about=\"${CC}Modality\">" \
  "<owl:Class rdf:about=\"${CC}Modality\"><rdfs:subClassOf rdf:resource=\"${CC}ActivityType\"/>"

echo "Mutações detectadas: $detected de $total"
[ "$detected" -eq "$total" ]
