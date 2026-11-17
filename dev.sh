#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if [[ -f ".env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_PORT="${BACKEND_PORT:-3100}"
DRY_RUN="false"
MAX_PORT_RETRIES=5

usage() {
  cat <<EOF
Usage: ./dev.sh [options]

Starts Stream Flix separated services cleanly:
  - sf_backend (Express API) on BACKEND_PORT (default: 3100)
  - sf_frontend (Vite React SPA) on FRONTEND_PORT (default: 3000)

Options:
  --frontend-port <port>   Override Vite frontend port (default: 3000)
  --backend-port <port>    Override Express backend port (default: 3100)
  --dry-run                Verify ports and configuration without spawning long-running servers
  -h, --help               Show help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --frontend-port)
      FRONTEND_PORT="${2:?Missing value for --frontend-port}"
      shift 2
      ;;
    --backend-port)
      BACKEND_PORT="${2:?Missing value for --backend-port}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${CYAN}[dev.sh]${NC} $*"; }
log_ok() { echo -e "${GREEN}[dev.sh]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[dev.sh]${NC} $*"; }
log_err() { echo -e "${RED}[dev.sh]${NC} $*"; }

# Cross-environment listener PID finder (works with lsof, fuser, ss, or Node /proc/net fallback)
find_port_pids() {
  local port="$1"
  local pids=""

  if command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -ti :"$port" 2>/dev/null || true)"
  fi

  if [[ -z "$pids" ]] && command -v fuser >/dev/null 2>&1; then
    pids="$(fuser "${port}/tcp" 2>/dev/null | tr -s ' ' '\n' || true)"
  fi

  if [[ -z "$pids" ]] && command -v ss >/dev/null 2>&1; then
    pids="$(ss -tlnp "sport = :${port}" 2>/dev/null | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -u || true)"
  fi

  if [[ -z "$pids" ]] && command -v node >/dev/null 2>&1; then
    pids="$(node -e "
      const fs = require('fs');
      const targetPort = Number(process.argv[1]);
      const inodes = new Set();
      for (const file of ['/proc/net/tcp', '/proc/net/tcp6']) {
        if (!fs.existsSync(file)) continue;
        const lines = fs.readFileSync(file, 'utf8').trim().split('\n').slice(1);
        for (const line of lines) {
          const cols = line.trim().split(/\s+/);
          if (!cols[1] || cols[3] !== '0A') continue;
          const hexPort = cols[1].split(':')[1];
          if (parseInt(hexPort, 16) === targetPort && cols[9]) inodes.add(cols[9]);
        }
      }
      if (!inodes.size) process.exit(0);
      const found = new Set();
      for (const pid of fs.readdirSync('/proc')) {
        if (!/^[0-9]+$/.test(pid) || Number(pid) === process.pid) continue;
        try {
          for (const fd of fs.readdirSync('/proc/' + pid + '/fd')) {
            try {
              const link = fs.readlinkSync('/proc/' + pid + '/fd/' + fd);
              const m = link.match(/^socket:\[(\d+)\]$/);
              if (m && inodes.has(m[1])) found.add(pid);
            } catch {}
          }
        } catch {}
      }
      if (found.size) console.log([...found].join('\n'));
    " "$port" 2>/dev/null || true)"
  fi

  echo "$pids" | tr ' ' '\n' | grep -E '^[0-9]+$' | grep -v "^$$\$" | sort -u || true
}

is_port_busy() {
  local port="$1"
  node -e "
    const net = require('net');
    const srv = net.createServer();
    srv.once('error', () => process.exit(0));
    srv.once('listening', () => { srv.close(() => process.exit(1)); });
    srv.listen(Number(process.argv[1]), '0.0.0.0');
  " "$port" >/dev/null 2>&1
}

clear_port_with_retry() {
  local port="$1"
  local label="$2"
  local attempt=1

  while [[ "$attempt" -le "$MAX_PORT_RETRIES" ]]; do
    if ! is_port_busy "$port"; then
      log_ok "Port ${port} (${label}) is free and ready."
      return 0
    fi

    log_warn "Port ${port} (${label}) is busy (attempt ${attempt}/${MAX_PORT_RETRIES}). Locating occupying process..."
    local pids
    pids="$(find_port_pids "$port")"

    if [[ -n "$pids" ]]; then
      for pid in $pids; do
        log_warn "Sending SIGTERM to PID ${pid} on port ${port}..."
        kill -15 "$pid" 2>/dev/null || true
      done
      sleep 0.6

      # Force kill if still bound after graceful wait
      local remaining
      remaining="$(find_port_pids "$port")"
      if [[ -n "$remaining" ]]; then
        for pid in $remaining; do
          log_warn "Escalating to SIGKILL for lingering PID ${pid}..."
          kill -9 "$pid" 2>/dev/null || true
        done
      fi
    else
      log_warn "Listener on port ${port} did not expose a killable PID; waiting briefly for socket release..."
    fi

    sleep 0.5
    attempt=$((attempt + 1))
  done

  if is_port_busy "$port"; then
    log_err "Failed to clear port ${port} (${label}) after ${MAX_PORT_RETRIES} retries."
    return 1
  fi

  log_ok "Port ${port} (${label}) cleared successfully."
  return 0
}

TSX_CMD=(npx tsx)
if [[ -x "./node_modules/.bin/tsx" ]]; then
  TSX_CMD=(./node_modules/.bin/tsx)
fi

VITE_CMD=(npx vite)
if [[ -x "./node_modules/.bin/vite" ]]; then
  VITE_CMD=(./node_modules/.bin/vite)
fi

kill_process_tree() {
  local root_pid="$1"
  local sig="${2:-15}"
  [[ -z "$root_pid" ]] && return 0

  local descendants
  descendants="$(node -e "
    const { execSync } = require('child_process');
    const root = Number(process.argv[1]);
    try {
      const out = execSync('ps -eo pid=,ppid=', { encoding: 'utf8' });
      const childrenMap = new Map();
      for (const line of out.trim().split('\n')) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 2) continue;
        const pid = Number(parts[0]);
        const ppid = Number(parts[1]);
        if (!childrenMap.has(ppid)) childrenMap.set(ppid, []);
        childrenMap.get(ppid).push(pid);
      }
      const order = [];
      const visit = (p) => {
        for (const c of (childrenMap.get(p) || [])) visit(c);
        order.push(p);
      };
      visit(root);
      console.log(order.join('\n'));
    } catch {}
  " "$root_pid" 2>/dev/null || true)"

  for pid in $descendants; do
    kill "-${sig}" "$pid" 2>/dev/null || true
  done
  kill "-${sig}" "$root_pid" 2>/dev/null || true
}

BACKEND_PID=""
FRONTEND_PID=""
SERVICES_LAUNCHED="false"
CLEANED_UP="false"

cleanup() {
  local exit_code=$?
  if [[ "$CLEANED_UP" == "true" ]]; then
    return 0
  fi
  CLEANED_UP="true"

  if [[ "$SERVICES_LAUNCHED" == "true" ]]; then
    echo ""
    log_info "Shutting down Stream Flix services..."

    if [[ -n "$FRONTEND_PID" ]]; then
      kill_process_tree "$FRONTEND_PID" 15
    fi
    if [[ -n "$BACKEND_PID" ]]; then
      kill_process_tree "$BACKEND_PID" 15
    fi

    sleep 0.4

    if [[ -n "$FRONTEND_PID" ]]; then
      kill_process_tree "$FRONTEND_PID" 9
      wait "$FRONTEND_PID" 2>/dev/null || true
    fi
    if [[ -n "$BACKEND_PID" ]]; then
      kill_process_tree "$BACKEND_PID" 9
      wait "$BACKEND_PID" 2>/dev/null || true
    fi

    # Final safeguard: clear any lingering sockets on our launched ports
    for p in "$FRONTEND_PORT" "$BACKEND_PORT"; do
      local stragglers
      stragglers="$(find_port_pids "$p")"
      if [[ -n "$stragglers" ]]; then
        for spid in $stragglers; do
          kill -9 "$spid" 2>/dev/null || true
        done
      fi
    done
    log_ok "Ports ${FRONTEND_PORT} & ${BACKEND_PORT} released cleanly."
  fi

  exit "$exit_code"
}

trap cleanup INT TERM EXIT

log_info "Stream Flix Dual-Service Launcher"
log_info "Backend (sf_backend) Target Port : ${BACKEND_PORT}"
log_info "Frontend (sf_frontend) Target Port: ${FRONTEND_PORT}"

if [[ "$FRONTEND_PORT" == "$BACKEND_PORT" ]]; then
  log_err "FRONTEND_PORT and BACKEND_PORT must differ (got ${FRONTEND_PORT} for both)."
  exit 1
fi

clear_port_with_retry "$BACKEND_PORT" "sf_backend API"
clear_port_with_retry "$FRONTEND_PORT" "sf_frontend SPA"

if [[ "$DRY_RUN" == "true" ]]; then
  log_ok "Dry-run complete: ports ${BACKEND_PORT} & ${FRONTEND_PORT} verified clean; backend & frontend ready."
  exit 0
fi

SERVICES_LAUNCHED="true"

start_backend() {
  PORT="$BACKEND_PORT" BACKEND_PORT="$BACKEND_PORT" "${TSX_CMD[@]}" sf_backend/server.ts &
  BACKEND_PID=$!
}

log_info "Launching sf_backend on port ${BACKEND_PORT}..."
start_backend

# Wait for backend health readiness with one automatic port-clear retry on transient failure
health_attempt=1
backend_ready="false"
while [[ "$health_attempt" -le 20 ]]; do
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    log_warn "sf_backend exited unexpectedly during boot; retrying port clear + restart..."
    clear_port_with_retry "$BACKEND_PORT" "sf_backend retry"
    start_backend
  fi

  if curl -sf "http://127.0.0.1:${BACKEND_PORT}/api/health" >/dev/null 2>&1; then
    backend_ready="true"
    break
  fi
  sleep 0.5
  health_attempt=$((health_attempt + 1))
done

if [[ "$backend_ready" != "true" ]]; then
  log_err "sf_backend did not pass health check on http://127.0.0.1:${BACKEND_PORT}/api/health"
  exit 1
fi

log_ok "sf_backend is healthy at http://127.0.0.1:${BACKEND_PORT}/api/health"

log_info "Launching sf_frontend (Vite SPA + /api -> :${BACKEND_PORT} proxy) on port ${FRONTEND_PORT}..."
BACKEND_PORT="$BACKEND_PORT" FRONTEND_PORT="$FRONTEND_PORT" "${VITE_CMD[@]}" --port "$FRONTEND_PORT" --host 0.0.0.0 &
FRONTEND_PID=$!

sleep 1.2
if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
  log_warn "sf_frontend failed initial bind; retrying port clear on ${FRONTEND_PORT}..."
  clear_port_with_retry "$FRONTEND_PORT" "sf_frontend retry"
  BACKEND_PORT="$BACKEND_PORT" FRONTEND_PORT="$FRONTEND_PORT" "${VITE_CMD[@]}" --port "$FRONTEND_PORT" --host 0.0.0.0 &
  FRONTEND_PID=$!
fi

log_ok "Both services running cleanly:"
log_ok "  Frontend : http://localhost:${FRONTEND_PORT}"
log_ok "  Backend  : http://localhost:${BACKEND_PORT}/api/health"
log_ok "  Admin UI : http://localhost:${FRONTEND_PORT}/#/control-portal"
log_info "Press Ctrl+C to stop both services cleanly."

# Wait until either child process exits
wait -n "$BACKEND_PID" "$FRONTEND_PID"
