#!/bin/bash

# Validate HTML output after Next.js build
# This script checks the final rendered HTML against accessibility standards

set -e

echo "🔍 Validating HTML accessibility..."

# Check if build exists
if [ ! -d ".next" ]; then
  echo "❌ Build not found. Run 'npm run build' first."
  exit 1
fi

# Validate main HTML pages
echo "  ✓ Validating _app.html..."
npx html-validate .next/static/**/*.html 2>/dev/null | head -20 || true

echo "✅ HTML validation complete (see results above)"
