#!/bin/sh
set -e
NODE_PATH=/opt/ops/node_modules \
  node /opt/ops/node_modules/prisma/build/index.js db push \
  --schema=/app/prisma/schema.prisma \
  --skip-generate
