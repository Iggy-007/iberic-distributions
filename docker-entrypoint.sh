#!/bin/sh
set -e

if [ "${AUTO_DB_PUSH:-true}" = "true" ] && [ -f /app/prisma/schema.prisma ]; then
  echo "Applying database schema..."
  NODE_PATH=/opt/ops/node_modules \
    node /opt/ops/node_modules/prisma/build/index.js db push \
    --schema=/app/prisma/schema.prisma \
    --skip-generate
fi

exec "$@"
