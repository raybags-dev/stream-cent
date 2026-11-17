#!/usr/bin/env bash
# =============================================================================
# Stream Flix staging ship script
#
# Flow:
#   1. Verify the local repo and GitHub remote.
#   2. Switch to (or create) the staging branch.
#   3. Stage everything, prompt for a commit message, commit.
#   4. Push staging, which triggers .github/workflows/ci.yml.
#   5. Wait for the CI run for this exact commit.
#   6. Only if CI passed: merge staging into main and push main.
#
# Usage:
#   ./ship.sh
#   STAGING_BRANCH=ray__staging ./ship.sh
# =============================================================================

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

STAGING_BRANCH="${STAGING_BRANCH:-staging}"
MAIN_BRANCH="${MAIN_BRANCH:-main}"
CI_WORKFLOW="${CI_WORKFLOW:-ci.yml}"
REMOTE_NAME="${REMOTE_NAME:-origin}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; RESET='\033[0m'
log()  { echo -e "${BLUE}[ship]${RESET} $*"; }
ok()   { echo -e "${GREEN}[ OK ]${RESET} $*"; }
warn() { echo -e "${YELLOW}[WARN]${RESET} $*"; }
err()  { echo -e "${RED}[ERR ]${RESET} $*"; }

abort() { err "$*"; exit 1; }

# ── 0. Preflight checks ─────────────────────────────────────────────────────
command -v git >/dev/null 2>&1 || abort "git is not installed."
command -v gh  >/dev/null 2>&1 || abort "GitHub CLI (gh) is not installed. Install it: https://cli.github.com/"

git rev-parse --is-inside-work-tree >/dev/null 2>&1 \
  || abort "This directory is not a git repository. Run 'git init -b main' first."

if ! gh auth status >/dev/null 2>&1; then
  abort "gh is not authenticated. Run 'gh auth login' first, then re-run this script."
fi

origin_url="$(git remote get-url "$REMOTE_NAME" 2>/dev/null)" \
  || abort "No '$REMOTE_NAME' remote configured. Run: git remote add $REMOTE_NAME <github-url>"
log "$REMOTE_NAME -> $origin_url"

git fetch "$REMOTE_NAME" --prune >/dev/null 2>&1 || warn "Could not fetch $REMOTE_NAME (continuing with local refs)."

# ── 1. Switch to (or create) the staging branch ─────────────────────────────
current_branch="$(git branch --show-current)"

if git show-ref --verify --quiet "refs/heads/$STAGING_BRANCH"; then
  if [ "$current_branch" != "$STAGING_BRANCH" ]; then
    git checkout "$STAGING_BRANCH" || abort "Failed to switch to $STAGING_BRANCH"
  fi
  ok "On branch $STAGING_BRANCH"
elif git show-ref --verify --quiet "refs/remotes/$REMOTE_NAME/$STAGING_BRANCH"; then
  git checkout -b "$STAGING_BRANCH" "$REMOTE_NAME/$STAGING_BRANCH" \
    || abort "Failed to check out remote $STAGING_BRANCH"
  ok "Checked out $STAGING_BRANCH from $REMOTE_NAME"
else
  git checkout -b "$STAGING_BRANCH" || abort "Failed to create $STAGING_BRANCH"
  ok "Created new branch $STAGING_BRANCH"
fi

# ── 2. Stage + commit ────────────────────────────────────────────────────────
echo
log "Current changes:"
git status --short | sed 's/^/  /'
echo

if [ -z "$(git status --porcelain)" ]; then
  warn "Nothing to commit-working tree is clean. Nothing to ship."
  exit 0
fi

read -rp "Stage all of the above and commit? [Y/n] " confirm_stage
confirm_stage="${confirm_stage:-Y}"
if [[ ! "$confirm_stage" =~ ^[Yy]$ ]]; then
  warn "Aborted-nothing staged."
  exit 0
fi

git add -A

commit_msg=""
while [ -z "$commit_msg" ]; do
  read -rp "Commit message: " commit_msg
  [ -z "$commit_msg" ] && warn "Commit message can't be empty."
done

git commit -m "$commit_msg" || abort "Commit failed."
ok "Committed on $STAGING_BRANCH"

# ── 3. Push to staging-this triggers CI ─────────────────────────────────────
log "Pushing $STAGING_BRANCH to $REMOTE_NAME..."
if ! git push -u "$REMOTE_NAME" "$STAGING_BRANCH"; then
  abort "Push failed. Resolve the error above and re-run ./ship.sh."
fi
ok "Pushed $STAGING_BRANCH"

commit_sha="$(git rev-parse HEAD)"

# ── 4. Wait for the CI run tied to this commit ──────────────────────────────
log "Waiting for GitHub Actions to register the run for $commit_sha..."
run_id=""
for _ in $(seq 1 12); do
  sleep 5
  run_id="$(gh run list --branch "$STAGING_BRANCH" --workflow "$CI_WORKFLOW" --limit 5 \
              --json databaseId,headSha --jq ".[] | select(.headSha==\"$commit_sha\") | .databaseId" \
              2>/dev/null | head -n1)"
  [ -n "$run_id" ] && break
  echo -n "."
done
echo

if [ -z "$run_id" ]; then
  warn "Could not find a CI run for this exact commit after 60s."
  warn "Check manually: gh run list --branch $STAGING_BRANCH"
  warn "Not merging into $MAIN_BRANCH automatically. Re-run ./ship.sh once CI has run, or merge by hand."
  exit 1
fi

log "Watching CI run $run_id (this blocks until it finishes)..."
if gh run watch "$run_id" --exit-status; then
  ok "CI passed on $STAGING_BRANCH."
else
  err "CI failed on $STAGING_BRANCH. NOT merging into $MAIN_BRANCH."
  err "View the run: gh run view $run_id --web"
  exit 1
fi

# ── 5. CI passed-merge staging into main ────────────────────────────────────
log "Merging $STAGING_BRANCH into $MAIN_BRANCH..."

if git show-ref --verify --quiet "refs/heads/$MAIN_BRANCH"; then
  git checkout "$MAIN_BRANCH" || abort "Failed to switch to $MAIN_BRANCH"
  git pull "$REMOTE_NAME" "$MAIN_BRANCH" --ff-only 2>/dev/null || true
else
  git checkout -b "$MAIN_BRANCH" || abort "Failed to create $MAIN_BRANCH"
fi

if ! git merge --no-ff "$STAGING_BRANCH" -m "chore: merge $STAGING_BRANCH into $MAIN_BRANCH after CI success"; then
  err "Merge into $MAIN_BRANCH produced conflicts. Resolve them manually, then:"
  err "  git add <resolved files> && git commit && git push $REMOTE_NAME $MAIN_BRANCH"
  exit 1
fi

if ! git push -u "$REMOTE_NAME" "$MAIN_BRANCH"; then
  abort "Merge succeeded locally but push to $MAIN_BRANCH failed. Push it manually once resolved."
fi
ok "Merged and pushed $MAIN_BRANCH"

git checkout "$STAGING_BRANCH" >/dev/null 2>&1
log "Back on $STAGING_BRANCH. Done."
