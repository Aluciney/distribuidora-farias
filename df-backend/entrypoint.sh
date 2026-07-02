#!/bin/bash
set -e

echo "Executando migrations do Prisma..."
npm run prisma:deploy

echo "Iniciando aplicação..."
npm start