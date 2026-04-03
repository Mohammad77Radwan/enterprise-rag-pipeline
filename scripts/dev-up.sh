#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"

if [ ! -f "${ENV_FILE}" ]; then
  echo "Missing ${ENV_FILE}. Copy .env.example to .env first." >&2
  exit 1
fi

set -a
. "${ENV_FILE}"
set +a

mkdir -p "${ROOT_DIR}/uploads"

if [ -f "${ROOT_DIR}/.backend.pid" ] && kill -0 "$(cat "${ROOT_DIR}/.backend.pid")" 2>/dev/null; then
  echo "Backend already running (PID $(cat "${ROOT_DIR}/.backend.pid"))."
else
  /usr/bin/python3 -m uvicorn backend.main:app --host 0.0.0.0 --port "${APP_API_PORT}" >"${ROOT_DIR}/.backend.log" 2>&1 &
  echo $! > "${ROOT_DIR}/.backend.pid"
  echo "Started backend on :${APP_API_PORT}"
fi

if [ -f "${ROOT_DIR}/.frontend.pid" ] && kill -0 "$(cat "${ROOT_DIR}/.frontend.pid")" 2>/dev/null; then
  echo "Frontend already running (PID $(cat "${ROOT_DIR}/.frontend.pid"))."
else
  cd "${ROOT_DIR}/frontend"
  npm run dev -- -H 0.0.0.0 -p "${APP_FRONTEND_PORT}" >"${ROOT_DIR}/.frontend.log" 2>&1 &
  echo $! > "${ROOT_DIR}/.frontend.pid"
  echo "Started frontend on :${APP_FRONTEND_PORT}"
fi

echo "Frontend: http://localhost:${APP_FRONTEND_PORT}"
echo "Backend:  http://localhost:${APP_API_PORT}"
