#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TARGET="auto"
COMMIT_MSG=""
REMOTE_NAME="origin"
BRANCH_NAME=""
DRY_RUN="false"

usage() {
  cat <<EOF
Usage: ./scripts/push_changed.sh [options]

Selectively commits and pushes ONLY the changed Stream Flix component (sf_frontend or sf_backend)
after running full-stack typecheck, Vitest integration tests, and component verification gates.

Options:
  --auto               Auto-detect whether sf_frontend, sf_backend, or both have changes (default)
  --frontend           Restrict commit/push scope strictly to sf_frontend (and Vite HTML entry files if changed)
  --backend            Restrict commit/push scope strictly to sf_backend (and root server.ts if changed)
  --all                Include all modified workspace files after passing full integration tests
  -m, --message <msg>  Custom git commit message
  --remote <name>      Git remote name (default: origin)
  --branch <name>      Target branch (default: current git branch)
  --dry-run            Run all integration tests and show exact scoped files without committing or pushing
  -h, --help           Show help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --auto) TARGET="auto"; shift ;;
    --frontend) TARGET="frontend"; shift ;;
    --backend) TARGET="backend"; shift ;;
    --all) TARGET="all"; shift ;;
    -m|--message) COMMIT_MSG="${2:?Missing commit message}"; shift 2 ;;
    --remote) REMOTE_NAME="${2:?Missing remote name}"; shift 2 ;;
    --branch) BRANCH_NAME="${2:?Missing branch name}"; shift 2 ;;
    --dry-run) DRY_RUN="true"; shift ;;
    -h|--help) usage; exit 0 ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_step() { echo -e "${CYAN}[push-gate]${NC} $*"; }
log_ok()   { echo -e "${GREEN}[push-gate]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[push-gate]${NC} $*"; }
log_err()  { echo -e "${RED}[push-gate]${NC} $*"; }

IS_GIT_REPO="true"
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  IS_GIT_REPO="false"
  if [[ "$DRY_RUN" != "true" ]]; then
    log_err "Current directory is not a git repository. Initialize with 'git init && git remote add origin <url>' first."
    exit 1
  fi
  log_warn "No .git repository detected yet; running verification gate in --dry-run mode."
fi

if [[ -z "$BRANCH_NAME" ]]; then
  if [[ "$IS_GIT_REPO" == "true" ]] && git rev-parse --verify HEAD >/dev/null 2>&1; then
    BRANCH_NAME="$(git rev-parse --abbrev-ref HEAD)"
  else
    BRANCH_NAME="main"
  fi
fi

# Collect changed & untracked paths accurately (handles newly created separated directories)
if [[ "$IS_GIT_REPO" == "true" ]]; then
  ALL_CHANGED="$( { git status --porcelain=v1 -uall | sed -E 's/^...//; s/.* -> //'; } | sort -u || true )"
else
  ALL_CHANGED="$(find sf_frontend sf_backend server.ts index.html vite.config.ts -maxdepth 4 -type f 2>/dev/null | sort -u || true)"
fi

FRONTEND_CHANGED="$(echo "$ALL_CHANGED" | grep -E '^(sf_frontend/|index\.html$|vite\.config\.ts$)' || true)"
BACKEND_CHANGED="$(echo "$ALL_CHANGED" | grep -E '^(sf_backend/|server\.ts$)' || true)"

if [[ "$TARGET" == "auto" ]]; then
  if [[ -n "$FRONTEND_CHANGED" && -z "$BACKEND_CHANGED" ]]; then
    TARGET="frontend"
  elif [[ -n "$BACKEND_CHANGED" && -z "$FRONTEND_CHANGED" ]]; then
    TARGET="backend"
  elif [[ -n "$FRONTEND_CHANGED" && -n "$BACKEND_CHANGED" ]]; then
    TARGET="all"
  else
    log_warn "No pending changes inside sf_frontend/ or sf_backend/."
    if [[ "$IS_GIT_REPO" == "true" && "$DRY_RUN" != "true" && -z "$ALL_CHANGED" ]]; then
      log_ok "Working tree clean. Running integration gate before checking push state..."
    fi
    TARGET="all"
  fi
fi

log_step "Selected Push Scope : ${TARGET}"
log_step "Target Remote/Branch: ${REMOTE_NAME} -> ${BRANCH_NAME}"

# ------------------------------------------------------------------
# MANDATORY FULL-STACK INTEGRATION VERIFICATION GATE
# ------------------------------------------------------------------
log_step "1/4 Running cross-boundary TypeScript check (npm run lint)..."
npm run lint

log_step "2/4 Running full integration, security, idempotency & catalog test suite (npm test)..."
npm test

if [[ "$TARGET" == "frontend" || "$TARGET" == "all" ]]; then
  log_step "3/4 Verifying production sf_frontend bundle (npm run build)..."
  npm run build
else
  log_step "3/4 Verifying standalone sf_backend module boot integrity..."
  npx tsx -e "import('./sf_backend/app.ts').then(({ createServerApp }) => { createServerApp(); console.log('[sf_backend] Express app compiled and mounted cleanly.'); })"
fi

log_ok "4/4 All integration verification gates PASSED."

# Determine scoped paths for selective commit & push
SCOPED_PATHS=()
if [[ "$TARGET" == "frontend" ]]; then
  while IFS= read -r line; do [[ -n "$line" ]] && SCOPED_PATHS+=("$line"); done <<< "$FRONTEND_CHANGED"
  DEFAULT_MSG="chore(sf_frontend): update frontend SPA (verified integration suite)"
elif [[ "$TARGET" == "backend" ]]; then
  while IFS= read -r line; do [[ -n "$line" ]] && SCOPED_PATHS+=("$line"); done <<< "$BACKEND_CHANGED"
  DEFAULT_MSG="chore(sf_backend): update modular API service (verified integration suite)"
else
  while IFS= read -r line; do [[ -n "$line" ]] && SCOPED_PATHS+=("$line"); done <<< "$ALL_CHANGED"
  DEFAULT_MSG="chore(stream-flix): update frontend & backend modules (verified integration suite)"
fi

if [[ -z "$COMMIT_MSG" ]]; then
  COMMIT_MSG="$DEFAULT_MSG"
fi

if [[ "${#SCOPED_PATHS[@]}" -eq 0 ]]; then
  log_warn "No uncommitted files match scope '${TARGET}'."
  if [[ "$DRY_RUN" == "true" ]]; then
    log_ok "Dry-run complete: integration gate passed with zero uncommitted scoped paths."
    exit 0
  fi
else
  log_step "Scoped files eligible for selective push (${#SCOPED_PATHS[@]}):"
  printf '  - %s\n' "${SCOPED_PATHS[@]}"
fi

if [[ "$DRY_RUN" == "true" ]]; then
  log_ok "[DRY-RUN] Would stage ONLY scoped paths, commit '${COMMIT_MSG}', and push to ${REMOTE_NAME}/${BRANCH_NAME}."
  exit 0
fi

# Selectively commit ONLY targeted files (leaves unrelated component edits untouched)
if [[ "${#SCOPED_PATHS[@]}" -gt 0 ]]; then
  git reset -q HEAD -- . 2>/dev/null || true
  git add -- "${SCOPED_PATHS[@]}"
  if ! git diff --cached --quiet; then
    git commit -m "$COMMIT_MSG" -- "${SCOPED_PATHS[@]}"
  fi
fi

if git remote get-url "$REMOTE_NAME" >/dev/null 2>&1; then
  log_step "Pushing verified ${TARGET} commit(s) to ${REMOTE_NAME}/${BRANCH_NAME}..."
  git push "$REMOTE_NAME" "$BRANCH_NAME"
  log_ok "Successfully pushed ${TARGET} after passing all integration checks."
else
  log_warn "Git remote '${REMOTE_NAME}' is not configured yet. Local selective commit complete; configure remote to push:"
  log_warn "  git remote add ${REMOTE_NAME} <your-repo-url> && git push -u ${REMOTE_NAME} ${BRANCH_NAME}"
fi
