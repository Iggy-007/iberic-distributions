#!/bin/sh
set -e
cd /app
NODE_PATH=/opt/ops/node_modules:/app/node_modules \
  node /app/prisma/reset-admin.bundle.cjs
