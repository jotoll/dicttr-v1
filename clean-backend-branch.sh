#!/bin/bash

echo "=== Limpiando branch backend-only ==="
echo "Este script eliminará todos los archivos que no sean del backend."
echo ""

# Lista de archivos/directorios a mantener
KEEP_FILES=(
  "src"
  "config"
  "package.json"
  "package-lock.json"
  "README.md"
  ".dockerignore"
  "Dockerfile"
  "docker-compose.yml"
  "docker-compose.coolify.yml"
  ".gitignore"
  "SPEAKER_DIFFERENTIATION_IMPLEMENTATION.md"
  "test-speaker-differentiation.js"
  "test-complete-speaker-differentiation.js"
  "keep-backend-files.txt"
  "clean-backend-branch.sh"
)

echo "Archivos a mantener:"
for file in "${KEEP_FILES[@]}"; do
  if [ -e "$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ $file (no existe)"
  fi
done

echo ""
echo "=== Eliminando archivos no-backend ==="

# Eliminar directorios no-backend (excepto .git)
find . -maxdepth 1 -type d ! -name '.' ! -name '.git' ! -name 'src' ! -name 'config' ! -name 'backend' ! -name 'scripts' ! -name 'shared' ! -name 'uploads' ! -name 'exports' -exec echo "Eliminando directorio: {}" \; -exec rm -rf {} \;

# Eliminar archivos en root que no están en la lista KEEP_FILES
find . -maxdepth 1 -type f ! -name '.git*' ! -name 'package.json' ! -name 'package-lock.json' ! -name 'README.md' ! -name '.dockerignore' ! -name 'Dockerfile' ! -name 'docker-compose.yml' ! -name 'docker-compose.coolify.yml' ! -name '.gitignore' ! -name 'SPEAKER_DIFFERENTIATION_IMPLEMENTATION.md' ! -name 'test-speaker-differentiation.js' ! -name 'test-complete-speaker-differentiation.js' ! -name 'keep-backend-files.txt' ! -name 'clean-backend-branch.sh' -exec echo "Eliminando archivo: {}" \; -exec rm -f {} \;

echo ""
echo "=== Verificando estructura final ==="
echo "Estructura de archivos después de la limpieza:"
find . -type f -name "*.js" -o -name "*.json" -o -name "*.md" -o -name "*.yml" -o -name "Dockerfile" | sort

echo ""
echo "=== Añadiendo cambios a Git ==="
git add -A
git status --short

echo ""
echo "=== Haciendo commit ==="
git commit -m "feat: Branch backend-only - Solo archivos del backend"

echo ""
echo "=== ¡Listo! ==="
echo "El branch backend-only ahora solo contiene archivos del backend."
echo "Puedes hacer push con: git push origin backend-only"
