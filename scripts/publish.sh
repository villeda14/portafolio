#!/usr/bin/env bash
# Compila, exporta los datos de MySQL y publica en GitHub Pages (carpeta docs/).
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
npm run export
git add -A
git commit -m "${1:-Actualizar portafolio}" || { echo "Sin cambios que publicar"; exit 0; }
git push
