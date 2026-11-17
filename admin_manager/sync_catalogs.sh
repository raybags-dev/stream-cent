#!/usr/bin/env bash
# ==============================================================================
# Stream Flix - Remote Catalogs Sync Tool
# ==============================================================================
# Usage:
#   ./sync_catalogs.sh
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
NC='\033[0m'

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}  Stream Flix Cinema - Sync Remote Movie Catalogs   ${NC}"
echo -e "${BLUE}====================================================${NC}"
echo -e "Server: ${GREEN}${API_URL}${NC}"
echo -e "Triggering TMDB & TVMaze sync into 24-hour cache layer...\n"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/admin/sync-catalog" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: ${ADMIN_SECRET}" || echo -e "\n000")

HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}[SUCCESS] Catalog synchronization complete! (HTTP 200)${NC}"
  node -e "try { console.log(JSON.stringify(JSON.parse(process.argv[1]), null, 2)); } catch { console.log(process.argv[1]); }" "$BODY"
  exit 0
else
  echo -e "${RED}[FAILED] Synchronization failed with HTTP status ${HTTP_STATUS}${NC}"
  node -e "try { console.log(JSON.stringify(JSON.parse(process.argv[1]), null, 2)); } catch { console.log(process.argv[1]); }" "$BODY"
  exit 1
fi
