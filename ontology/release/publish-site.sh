#!/usr/bin/env bash
# Copia a ontologia, o relatório e o pacote para a página oculta do sandbox
# (/pt/dev/k7x9-sandbox?view=ontologia). Rode depois de reason.sh,
# build_report.py, render_report.js e build-zenodo.sh.
set -euo pipefail

VERSION=$(sed -n 's:.*<owl\:versionInfo>\(.*\)</owl\:versionInfo>.*:\1:p' ontology/contacomigo/contacomigo.owl)
TARGET=frontend/public/dev/k7x9-ontology
DIST="ontology/release/dist/contacomigo-ontology-v$VERSION"

rm -rf "$TARGET" && mkdir -p "$TARGET"
cp ontology/contacomigo/contacomigo.owl "$DIST/contacomigo.ttl" "$TARGET/"
cp "$DIST/verificacao-v$VERSION.pdf" "$TARGET/"
cp "ontology/release/dist/contacomigo-ontology-v$VERSION.zip" "$TARGET/"
cp ontology/reasoning/out/summary.json "$TARGET/"
ls -la "$TARGET"
