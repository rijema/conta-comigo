#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="$ROOT_DIR/docs/root-archive"
TIMESTAMP="$(date +"%Y%m%d-%H%M%S")"
MANIFEST="$TARGET_DIR/archive-manifest-$TIMESTAMP.txt"

mkdir -p "$TARGET_DIR"
: > "$MANIFEST"

find "$ROOT_DIR" -maxdepth 1 -type f \( -iname '*.md' -o -iname '*.txt' \) -print0 | while IFS= read -r -d '' file; do
  filename="$(basename "$file")"
  new_name="${TIMESTAMP}-${filename}"
  dest="$TARGET_DIR/$new_name"
  mv "$file" "$dest"
  printf '%s -> %s\n' "$filename" "$new_name" >> "$MANIFEST"
done

printf '\nArquivados em: %s\n' "$TARGET_DIR"
printf 'Manifesto: %s\n' "$MANIFEST"
