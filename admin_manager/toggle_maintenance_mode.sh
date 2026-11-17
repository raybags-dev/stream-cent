#!/usr/bin/env bash
# ==============================================================================
# Stream Flix - Live vs Dummy Maintenance Mode Switcher
# ==============================================================================
# Usage:
#   ./toggle_maintenance_mode.sh [on|off]
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

ACTION="${1:-}"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}====================================================${NC}"
echo -e "${YELLOW}  Stream Flix - Service Maintenance Mode Controller ${NC}"
echo -e "${YELLOW}====================================================${NC}"

PAYLOAD="{}"
if [ "$ACTION" = "on" ] || [ "$ACTION" = "true" ] || [ "$ACTION" = "live" ]; then
  PAYLOAD='{"enabled": true}'
elif [ "$ACTION" = "off" ] || [ "$ACTION" = "false" ] || [ "$ACTION" = "dummy" ] || [ "$ACTION" = "maintenance" ]; then
  PAYLOAD='{"enabled": false}'
fi

IDEMPOTENCY_KEY="cli-toggle-mode-$(date +%s)-${RANDOM}"

echo -e "Server         : ${GREEN}${API_URL}${NC}"
echo -e "Target Action  : ${YELLOW}${ACTION:-TOGGLE CURRENT STATE}${NC}"
echo -e "Idempotency Key: ${YELLOW}${IDEMPOTENCY_KEY}${NC}"
echo -e "Updating movie service controller state..."

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/admin/toggle-live-movies" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: ${ADMIN_SECRET}" \
  -H "Idempotency-Key: ${IDEMPOTENCY_KEY}" \
  -d "$PAYLOAD" || echo -e "\n000")

HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}[SUCCESS] Service mode toggled! (HTTP 200)${NC}"
  node -e "try { console.log(JSON.stringify(JSON.parse(process.argv[1]), null, 2)); } catch { console.log(process.argv[1]); }" "$BODY"
  exit 0
else
  echo -e "${RED}[FAILED] Toggle failed with HTTP status ${HTTP_STATUS}${NC}"
  node -e "try { console.log(JSON.stringify(JSON.parse(process.argv[1]), null, 2)); } catch { console.log(process.argv[1]); }" "$BODY"
  exit 1
fi
