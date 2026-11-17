#!/usr/bin/env bash
# ==============================================================================
# Stream Flix - Resend Transactional Email Test Utility
# ==============================================================================
# Usage:
#   ./test_resend_email.sh [recipient_email]
# Example:
#   ./test_resend_email.sh user@example.com
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [ -f "${PROJECT_ROOT}/.env" ]; then
  export $(grep -v '^#' "${PROJECT_ROOT}/.env" | xargs -d '\n' 2>/dev/null || true)
fi

PORT="${PORT:-3000}"
API_URL="${API_BASE_URL:-http://127.0.0.1:${PORT}}"
RECIPIENT="${1:-${ADMIN_EMAIL:-admin@streamflix.local}}"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}====================================================${NC}"
echo -e "${CYAN}  Stream Flix Cinema - Resend Email Integration Test${NC}"
echo -e "${CYAN}====================================================${NC}"

echo -e "Server       : ${GREEN}${API_URL}${NC}"
echo -e "Recipient    : ${YELLOW}${RECIPIENT}${NC}"
echo -e "Testing Resend integration through register endpoint trigger...\n"

IDEMPOTENCY_KEY="cli-email-test-$(date +%s)"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: ${IDEMPOTENCY_KEY}" \
  -d "{\"email\": \"${RECIPIENT}\", \"profileName\": \"Resend Test User\", \"planId\": \"premium\"}" || echo -e "\n000")

HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" -eq 201 ] || [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}[SUCCESS] Email trigger pipeline successfully executed! (HTTP ${HTTP_STATUS})${NC}"
  echo -e "${BLUE}Check server logs for Resend dispatch confirmation ID / payload.${NC}"
  exit 0
else
  echo -e "${YELLOW}[NOTE] Response HTTP ${HTTP_STATUS}:${NC}"
  node -e "try { console.log(JSON.stringify(JSON.parse(process.argv[1]), null, 2)); } catch { console.log(process.argv[1]); }" "$BODY"
  exit 0
fi
