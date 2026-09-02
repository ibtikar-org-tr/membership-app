#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT_DIR/.logs"
mkdir -p "$LOG_DIR"

free_port() {
  local port="$1"
  local pids=""
  if command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
  elif command -v fuser >/dev/null 2>&1; then
    pids="$(fuser "$port/tcp" 2>/dev/null | tr -d ' ' || true)"
  else
    echo "[vms] lsof/fuser not found; skipping cleanup for port $port"
    return 0
  fi

  if [[ -n "${pids:-}" ]]; then
    echo "[vms] stopping existing processes on port $port: $pids"
    # shellcheck disable=SC2086
    kill -9 $pids 2>/dev/null || true
    sleep 0.4
  fi
}

launch_app() {
  local name="$1"
  local dir="$2"
  local cmd="$3"
  local port="$4"
  local log_file="$LOG_DIR/$name.log"

  free_port "$port"
  echo "[vms] starting $name on port $port"
  (
    cd "$ROOT_DIR/$dir"
    nohup bash -lc "$cmd" >"$log_file" 2>&1 &
    echo $! >"$LOG_DIR/$name.pid"
  )
  local pid
  pid="$(cat "$LOG_DIR/$name.pid")"
  if kill -0 "$pid" 2>/dev/null; then
    echo "[vms] $name started with pid $pid"
    echo "[vms] logs: $log_file"
  else
    echo "[vms] $name failed to start; see $log_file"
  fi
}

launch_app "vms-frontend" "frontend" "npm run dev" 5930
launch_app "vms-backend" "backend" "npm run dev:local" 5931

echo "[vms] all apps launched in background"
echo "[vms] frontend: http://localhost:5930"
echo "[vms] backend:  http://localhost:5931"
echo "[vms] log directory: $LOG_DIR"
