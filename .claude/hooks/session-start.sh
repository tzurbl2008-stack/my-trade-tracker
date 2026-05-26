#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Install npm dependencies for the React/TypeScript build toolchain.
# The standalone index.html works without any install step.
npm install || echo "npm install failed — standalone index.html still works without dependencies"
