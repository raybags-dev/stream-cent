#!/usr/bin/env bash
# ==============================================================================
# Stream Flix - Superuser & Admin Creator Script
# ==============================================================================
# Usage:
#   ./create_superuser.sh <email> [role: superuser|admin] [profile_name]
# Example:
#   ./create_superuser.sh ops@streamflix.local superuser "DevOps Master"
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Load environment variables if available
if [ -f "${PROJECT_ROOT}/.env" ]; then
  # export variables from .env ignoring comments
  export $(grep -v '^#' "${PROJECT_ROOT}/.env" | xargs -d '\n' 2>/dev/null || true)
fi

PORT="${PORT:-3000}"
API_URL="${API_BASE_URL:-http://127.0.0.1:${PORT}}"
ADMIN_SECRET="${ADMIN_SECRET_KEY:-super_admin_secret_token_streamflix_2026}"

EMAIL="${1:-}"
ROLE="${2:-superuser}"
PROFILE_NAME="${3:-Super Admin}"

# ANSI Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}  Stream Flix Cinema - Superuser / Admin Creator    ${NC}"
echo -e "${BLUE}====================================================${NC}"

if [ -z "$EMAIL" ]; then
  echo -e "${YELLOW}Interactive Mode:${NC}"
  read -rp "Enter Email: " EMAIL
  read -rp "Enter Role (superuser/admin) [default: superuser]: " INPUT_ROLE
  ROLE="${INPUT_ROLE:-superuser}"
  read -rp "Enter Profile Name [default: Super Admin]: " INPUT_NAME
  PROFILE_NAME="${INPUT_NAME:-Super Admin}"
fi

if [[ ! "$EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
  echo -e "${RED}[Error] Invalid email address: ${EMAIL}${NC}"
  exit 1
fi

IDEMPOTENCY_KEY="cli-create-${ROLE}-$(date +%s)-${RANDOM}"

echo -e "Target Server  : ${GREEN}${API_URL}${NC}"
echo -e "User Account   : ${GREEN}${EMAIL}${NC}"
echo -e "Assigned Role  : ${GREEN}${ROLE}${NC}"
echo -e "Profile Name   : ${GREEN}${PROFILE_NAME}${NC}"
echo -e "Idempotency Key: ${YELLOW}${IDEMPOTENCY_KEY}${NC}"
echo -e "Provisioning..."

PAYLOAD=$(node -e "console.log(JSON.stringify({ email: process.argv[1], role: process.argv[2], profileName: process.argv[3], planId: 'premium' }))" "$EMAIL" "$ROLE" "$PROFILE_NAME")

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/admin/users/create" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: ${ADMIN_SECRET}" \
  -H "Idempotency-Key: ${IDEMPOTENCY_KEY}" \
  -d "$PAYLOAD" || echo -e "\n000")

HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" -eq 201 ] || [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}[SUCCESS] Account provisioned successfully! (HTTP ${HTTP_STATUS})${NC}"
  echo -e "${GREEN}Response details:${NC}"
  node -e "try { console.log(JSON.stringify(JSON.parse(process.argv[1]), null, 2)); } catch { console.log(process.argv[1]); }" "$BODY"
  echo -e "\n${BLUE}Notification: Welcome email and security alert dispatched via Resend integration.${NC}"
  exit 0
else
  echo -e "${RED}[FAILED] Request failed with HTTP status ${HTTP_STATUS}${NC}"
  node -e "try { console.log(JSON.stringify(JSON.parse(process.argv[1]), null, 2)); } catch { console.log(process.argv[1]); }" "$BODY"
  exit 1
fi
