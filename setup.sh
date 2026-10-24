#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v npm >/dev/null 2>&1; then
  echo "Install Node.js first." >&2
  exit 1
fi

if ! command -v rustup >/dev/null 2>&1 || ! command -v cargo >/dev/null 2>&1; then
  echo "Install Rust first." >&2
  exit 1
fi

rustup target add wasm32-unknown-unknown
npm ci
npm run build:with-wasm
