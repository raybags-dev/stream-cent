#!/usr/bin/env bash
# ==============================================================================
# Stream Flix - Superuser & Admin Deletion / Revocation Script
# ==============================================================================
# Usage:
#   ./delete_superuser.sh <email>
# Example:
#   ./delete_superuser.sh devops@streamflix.local
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [ -f "${PROJECT_ROOT}/.env" ]; then
  export $(grep -v '^#' "${PROJECT_ROOT}/.env" | xargs -d '\n' 2>/dev/null || true)
fi

PORT="${PORT:-3000}"
API_URL="${API_BASE_URL:-http://127.0.0.1:${PORT}}"
ADMIN_SECRET="${ADMIN_SECRET_KEY:-super_admin_secret_token_streamflix_2026}"
ROOT_ADMIN="${ADMIN_EMAIL:-admin@streamflix.local}"

EMAIL="${1:-}"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}====================================================${NC}"
echo -e "${RED}  Stream Flix Cinema - Account Deletion & Revoke    ${NC}"
echo -e "${RED}====================================================${NC}"

if [ -z "$EMAIL" ]; then
  read -rp "Enter Email of account to permanently delete: " EMAIL
fi

if [ "$EMAIL" = "$ROOT_ADMIN" ]; then
  echo -e "${RED}[SECURITY VIOLATION] Root superadmin account ($ROOT_ADMIN) cannot be deleted.${NC}"
  exit 1
fi

IDEMPOTENCY_KEY="cli-delete-user-$(date +%s)-${RANDOM}"

echo -e "Target Server  : ${YELLOW}${API_URL}${NC}"
echo -e "Account Email  : ${RED}${EMAIL}${NC}"
echo -e "Idempotency Key: ${YELLOW}${IDEMPOTENCY_KEY}${NC}"
echo -e "Revoking credentials and deleting records..."

PAYLOAD=$(node -e "console.log(JSON.stringify({ email: process.argv[1] }))" "$EMAIL")

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/admin/users/delete" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: ${ADMIN_SECRET}" \
  -H "Idempotency-Key: ${IDEMPOTENCY_KEY}" \
  -d "$PAYLOAD" || echo -e "\n000")

HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}[SUCCESS] Account ${EMAIL} permanently deleted! (HTTP ${HTTP_STATUS})${NC}"
  node -e "try { console.log(JSON.stringify(JSON.parse(process.argv[1]), null, 2)); } catch { console.log(process.argv[1]); }" "$BODY"
  exit 0
else
  echo -e "${RED}[FAILED] Deletion failed with HTTP status ${HTTP_STATUS}${NC}"
  node -e "try { console.log(JSON.stringify(JSON.parse(process.argv[1]), null, 2)); } catch { console.log(process.argv[1]); }" "$BODY"
  exit 1
fi
