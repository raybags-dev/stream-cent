#!/usr/bin/env bash
# ==============================================================================
# Stream Flix - Superuser & Admin Password Reset Script
# ==============================================================================
# Usage:
#   ./reset_superuser.sh <email>
# Example:
#   ./reset_superuser.sh admin@streamflix.local
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

EMAIL="${1:-}"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}====================================================${NC}"
echo -e "${CYAN}  Stream Flix Cinema - Account Password Reset Tool  ${NC}"
echo -e "${CYAN}====================================================${NC}"

if [ -z "$EMAIL" ]; then
  read -rp "Enter Email of account to reset: " EMAIL
fi

IDEMPOTENCY_KEY="cli-reset-pass-$(date +%s)-${RANDOM}"

echo -e "Target Server  : ${GREEN}${API_URL}${NC}"
echo -e "Target Account : ${CYAN}${EMAIL}${NC}"
echo -e "Idempotency Key: ${YELLOW}${IDEMPOTENCY_KEY}${NC}"
echo -e "Generating temporary credentials..."

PAYLOAD=$(node -e "console.log(JSON.stringify({ email: process.argv[1] }))" "$EMAIL")

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/admin/users/reset-password" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: ${ADMIN_SECRET}" \
  -H "Idempotency-Key: ${IDEMPOTENCY_KEY}" \
  -d "$PAYLOAD" || echo -e "\n000")

HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}[SUCCESS] Password reset dispatched successfully! (HTTP ${HTTP_STATUS})${NC}"
  node -e "try { console.log(JSON.stringify(JSON.parse(process.argv[1]), null, 2)); } catch { console.log(process.argv[1]); }" "$BODY"
  echo -e "\n${BLUE}Transactional email has been triggered via Resend integration.${NC}"
  exit 0
else
  echo -e "${RED}[FAILED] Password reset failed with HTTP status ${HTTP_STATUS}${NC}"
  node -e "try { console.log(JSON.stringify(JSON.parse(process.argv[1]), null, 2)); } catch { console.log(process.argv[1]); }" "$BODY"
  exit 1
fi
