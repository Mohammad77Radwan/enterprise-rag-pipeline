#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"

if [ -f "${ROOT_DIR}/.backend.pid" ]; then
  PID="$(cat "${ROOT_DIR}/.backend.pid")"
  kill "${PID}" 2>/dev/null || true
  rm -f "${ROOT_DIR}/.backend.pid"
  echo "Stopped backend (${PID})"
fi

if [ -f "${ROOT_DIR}/.frontend.pid" ]; then
  PID="$(cat "${ROOT_DIR}/.frontend.pid")"
  kill "${PID}" 2>/dev/null || true
  rm -f "${ROOT_DIR}/.frontend.pid"
  echo "Stopped frontend (${PID})"
fi
