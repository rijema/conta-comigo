#!/usr/bin/env bash
# Reproduz a verificação da ontologia ContaComigo com HermiT via ROBOT.
# Uso (da raiz do repositório): bash ontology/reasoning/reason.sh
set -euo pipefail

ROBOT_VERSION=1.9.8
ROBOT_SHA256=6f518b0293d8146d8a5a168c53607a952effb66bcaf3c6539996d7ec5c5f05f8
ONTOLOGY=ontology/contacomigo/contacomigo.owl
OUT=${OUT:-ontology/reasoning/out}
JAR=${ROBOT_JAR:-$OUT/robot-$ROBOT_VERSION.jar}

mkdir -p "$OUT"
if [ ! -f "$JAR" ]; then
  curl -sSL -o "$JAR" "https://github.com/ontodev/robot/releases/download/v$ROBOT_VERSION/robot.jar"
fi
echo "$ROBOT_SHA256  $JAR" | shasum -a 256 -c -

robot() { java -jar "$JAR" "$@"; }

shasum -a 256 "$ONTOLOGY" | tee "$OUT/ontology.sha256"
java -version 2>&1 | head -1 | tee "$OUT/java.version"
robot --version | tee "$OUT/robot.version"

# Consistência, classes insatisfatíveis, classificação e asserções inferidas
# (HermiT como referência; JFact como segundo raciocinador)
for reasoner in HermiT JFact; do
  robot reason --reasoner "$reasoner" --input "$ONTOLOGY" \
    --axiom-generators "SubClass ClassAssertion PropertyAssertion" --include-indirect true \
    --dump-unsatisfiable "$OUT/unsatisfiable-$reasoner.txt" --output "$OUT/inferred-$reasoner.owl"
  robot convert --input "$OUT/inferred-$reasoner.owl" --format ofn --output "$OUT/inferred-$reasoner.ofn"
done
robot diff --left "$ONTOLOGY" --right "$OUT/inferred-HermiT.owl" --format markdown --output "$OUT/inferred-diff.md"

# Perfil OWL 2 DL, métricas e relatório de qualidade (não interrompem o script)
robot validate-profile --profile DL --input "$ONTOLOGY" --output "$OUT/profile-dl.txt" || true
robot measure --input "$ONTOLOGY" --metrics essential --format tsv --output "$OUT/metrics.tsv"
robot report --input "$ONTOLOGY" --fail-on none --output "$OUT/report.tsv"

# Testes de mutação: erros plantados devem ser detectados pelo HermiT
ROBOT_JAR="$JAR" OUT="$OUT" bash ontology/reasoning/mutation-tests.sh "$ONTOLOGY" | tee "$OUT/mutations.txt"

# Questões de competência (SPARQL) sobre a ontologia com as inferências do HermiT
mkdir -p "$OUT/cq"
for query in ontology/competency-questions/CQ*.rq; do
  robot query --input "$OUT/inferred-HermiT.owl" --query "$query" "$OUT/cq/$(basename "${query%.rq}").csv"
done
# Verificações de integridade: falham se alguma consulta retornar linhas
robot verify --input "$OUT/inferred-HermiT.owl" --output-dir "$OUT/cq" \
  --queries ontology/competency-questions/integrity/*.rq | tee "$OUT/integrity.txt"

