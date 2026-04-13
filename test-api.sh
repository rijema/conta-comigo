#!/bin/bash

# Script para testar os endpoints de autenticação da MathASD API
# Requer: curl, jq (opcional para formatação)

API_URL="http://localhost:3001/api"
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASS="senhaForte123"
TEST_NAME="Usuário de Teste"

echo "🚀 Iniciando teste da API..."

# 1. Registro
echo -e "\n1. Tentando registrar novo usuário: $TEST_EMAIL"
REGISTER_RES=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$TEST_NAME\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASS\",
    \"role\": \"guardian\"
  }")

echo "Resposta Registro: $REGISTER_RES"

# 2. Login
echo -e "\n2. Tentando fazer login com: $TEST_EMAIL"
LOGIN_RES=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASS\"
  }")

echo "Resposta Login: $LOGIN_RES"

# Extrair token (usando grep/sed para evitar dependência de jq)
TOKEN=$(echo $LOGIN_RES | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "\n❌ Erro: Não foi possível obter o accessToken do login."
  exit 1
fi

echo -e "\n✅ Login realizado com sucesso! Token obtido."

# 3. Perfil (/me)
echo -e "\n3. Verificando perfil com o token..."
ME_RES=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")

echo "Resposta Perfil: $ME_RES"

if [[ $ME_RES == *"$TEST_EMAIL"* ]]; then
  echo -e "\n✨ TESTE CONCLUÍDO COM SUCESSO! ✨"
else
  echo -e "\n⚠️  A resposta do perfil não contém o email esperado."
fi
