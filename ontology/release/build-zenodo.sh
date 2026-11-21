#!/usr/bin/env bash
# Monta o pacote da ontologia para depósito no Zenodo.
# Uso, da raiz do repositório, depois de reason.sh e do relatório:
#   bash ontology/release/build-zenodo.sh
set -euo pipefail

OUT=ontology/reasoning/out
JAR=${ROBOT_JAR:-$OUT/robot-1.9.8.jar}
VERSION=$(sed -n 's:.*<owl\:versionInfo>\(.*\)</owl\:versionInfo>.*:\1:p' ontology/contacomigo/contacomigo.owl)
NAME="contacomigo-ontology-v$VERSION"
STAGE="ontology/release/dist/$NAME"
REPORT="docs/dissertacao/anexos/Verificacao-Ontologia-ContaComigo-v$VERSION.pdf"

[ -f "$REPORT" ] || { echo "Relatório $REPORT não encontrado; rode build_report.py e render_report.js." >&2; exit 1; }
rm -rf "$STAGE" && mkdir -p "$STAGE/reasoning"

cp ontology/contacomigo/contacomigo.owl "$STAGE/"
java -jar "$JAR" convert --input ontology/contacomigo/contacomigo.owl --format ttl --output "$STAGE/contacomigo.ttl"
cp -R ontology/competency-questions "$STAGE/"
cp ontology/reasoning/{reason.sh,mutation-tests.sh,build_report.py,render_report.js,report.css} "$STAGE/reasoning/"
cp "$REPORT" "$STAGE/verificacao-v$VERSION.pdf"
cp ontology/release/README.md ontology/release/CITATION.cff "$STAGE/"
( cd "$STAGE" && shasum -a 256 contacomigo.owl contacomigo.ttl "verificacao-v$VERSION.pdf" > SHA256SUMS )

( cd ontology/release/dist && rm -f "$NAME.zip" && zip -qr "$NAME.zip" "$NAME" )
echo "ontology/release/dist/$NAME.zip"
