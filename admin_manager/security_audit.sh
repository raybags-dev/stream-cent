#!/usr/bin/env bash
# ==============================================================================
# Stream Flix - Defensive Security & Cyber Hardening Audit Tool
# ==============================================================================
# Usage:
#   ./security_audit.sh
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [ -f "${PROJECT_ROOT}/.env" ]; then
  export $(grep -v '^#' "${PROJECT_ROOT}/.env" | xargs -d '\n' 2>/dev/null || true)
fi

PORT="${PORT:-3000}"
API_URL="${API_BASE_URL:-http://127.0.0.1:${PORT}}"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}====================================================${NC}"
echo -e "${CYAN}  Stream Flix - Cyber Defense Verification Suite    ${NC}"
echo -e "${CYAN}====================================================${NC}"
echo -e "Auditing target: ${GREEN}${API_URL}${NC}\n"

TESTS_PASSED=0
TESTS_TOTAL=0

assert_test() {
  local description="$1"
  local expected="$2"
  local actual="$3"
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  
  if [ "$expected" = "$actual" ]; then
    echo -e "  [PASS] ${description} (Got ${GREEN}${actual}${NC})"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "  [FAIL] ${description} (Expected ${YELLOW}${expected}${NC}, got ${RED}${actual}${NC})"
  fi
}

# 1. Security Headers Inspection
echo -e "${BLUE}[Audit 1] Defensive HTTP Security Headers Check:${NC}"
HEADERS=$(curl -s -I "${API_URL}/api/health" || echo "")

HAS_X_FRAME=$(echo "$HEADERS" | grep -i "x-frame-options: SAMEORIGIN" >/dev/null && echo "yes" || echo "no")
assert_test "Anti-Clickjacking (X-Frame-Options: SAMEORIGIN)" "yes" "$HAS_X_FRAME"

HAS_NOSNIFF=$(echo "$HEADERS" | grep -i "x-content-type-options: nosniff" >/dev/null && echo "yes" || echo "no")
assert_test "MIME Sniff Protection (X-Content-Type-Options: nosniff)" "yes" "$HAS_NOSNIFF"

HAS_XSS=$(echo "$HEADERS" | grep -i "x-xss-protection" >/dev/null && echo "yes" || echo "no")
assert_test "Cross-Site Scripting Guard (X-XSS-Protection)" "yes" "$HAS_XSS"

# 2. Path Traversal & Dotfile Exposure Prevention
echo -e "\n${BLUE}[Audit 2] Sensitive File & Path Traversal Guard:${NC}"
DOTENV_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/.env" || echo "000")
assert_test "Block Direct .env Exposure (Expect 403)" "403" "$DOTENV_STATUS"

TRAVERSAL_STATUS=$(curl -s --path-as-is -o /dev/null -w "%{http_code}" "${API_URL}/api/../etc/passwd" || echo "000")
assert_test "Block Path Traversal (Expect 403)" "403" "$TRAVERSAL_STATUS"

# 3. Prototype Pollution & Injection Guard
echo -e "\n${BLUE}[Audit 3] Prototype Pollution & Malicious Keys Defense:${NC}"
POLLUTION_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${API_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"__proto__": {"isAdmin": true}, "email": "evil@test.local"}' || echo "000")
assert_test "Reject Prototype Pollution Attempt (Expect 400)" "400" "$POLLUTION_STATUS"

# 4. Unauthorized Admin Secret Access
echo -e "\n${BLUE}[Audit 4] Admin RBAC & Secret Key Enforcement:${NC}"
UNAUTH_ADMIN=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${API_URL}/api/admin/users/create" \
  -H "Content-Type: application/json" \
  -d '{"email": "unauth@hack.local"}' || echo "000")
assert_test "Reject Unauthenticated Admin Creation (Expect 401)" "401" "$UNAUTH_ADMIN"

# 5. Idempotency Key Preservation
echo -e "\n${BLUE}[Audit 5] Idempotency Caching & Replay Guard:${NC}"
IDEMP_KEY="audit-idemp-$(date +%s)-${RANDOM}"
curl -s -X POST "${API_URL}/api/podcasts/upload" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: ${IDEMP_KEY}" \
  -d '{"title": "Audit Podcast", "host": "SecAuditor", "category": "Tech"}' >/dev/null || true

RESP2=$(curl -s -D - -X POST "${API_URL}/api/podcasts/upload" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: ${IDEMP_KEY}" \
  -d '{"title": "Audit Podcast", "host": "SecAuditor", "category": "Tech"}' -o /dev/null || echo "")

REPLAY_HEADER=$(echo "$RESP2" | grep -i "x-idempotent-replay: true" >/dev/null && echo "yes" || echo "no")
assert_test "Idempotency Duplicate Replay Protected (X-Idempotent-Replay: true)" "yes" "$REPLAY_HEADER"

echo -e "\n${CYAN}----------------------------------------------------${NC}"
echo -e "Security Audit Complete: ${GREEN}${TESTS_PASSED}/${TESTS_TOTAL}${NC} verification checks passed."
echo -e "${CYAN}----------------------------------------------------${NC}"

if [ "$TESTS_PASSED" -eq "$TESTS_TOTAL" ]; then
  exit 0
else
  exit 1
fi
