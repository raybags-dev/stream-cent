#!/usr/bin/env bash
# ==============================================================================
# Stream Flix - Superuser & Admin Inventory Tool
# ==============================================================================
# Usage:
#   ./list_superusers.sh
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

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}  Stream Flix Cinema - Superuser / Admin Directory  ${NC}"
echo -e "${BLUE}====================================================${NC}"
echo -e "Server: ${GREEN}${API_URL}${NC}\n"

RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/api/admin/users" \
  -H "X-Admin-Secret: ${ADMIN_SECRET}" || echo -e "\n000")

HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}[SUCCESS] Superusers retrieved (HTTP 200):${NC}\n"
  node -e '
    try {
      const data = JSON.parse(process.argv[1]);
      if (data.data && Array.isArray(data.data)) {
        console.log(String("ID").padEnd(30) + String("EMAIL").padEnd(32) + String("ROLE").padEnd(14) + String("PLAN").padEnd(12) + "PROFILES");
        console.log("-".repeat(95));
        data.data.forEach(u => {
          console.log(
            String(u.id).padEnd(30) +
            String(u.email).padEnd(32) +
            String(u.role).padEnd(14) +
            String(u.planId).padEnd(12) +
            String(u.profilesCount || (u.profiles && u.profiles.length) || 1)
          );
        });
        console.log("-".repeat(95));
        console.log(`Total Accounts: ${data.data.length}`);
      } else {
        console.log(JSON.stringify(data, null, 2));
      }
    } catch (e) {
      console.log(process.argv[1]);
    }
  ' "$BODY"
  exit 0
else
  echo -e "${RED}[FAILED] Query failed with HTTP status ${HTTP_STATUS}${NC}"
  node -e "try { console.log(JSON.stringify(JSON.parse(process.argv[1]), null, 2)); } catch { console.log(process.argv[1]); }" "$BODY"
  exit 1
fi
