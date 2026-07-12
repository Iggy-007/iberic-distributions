#!/bin/sh

if [ "${AUTO_DB_PUSH:-true}" = "true" ] && [ -f /app/prisma/schema.prisma ]; then
  echo "Applying database schema..."
  NODE_PATH=/opt/ops/node_modules \
    node /opt/ops/node_modules/prisma/build/index.js db push \
    --schema=/app/prisma/schema.prisma \
    --skip-generate \
    || echo "WARNING: database schema sync failed; starting app anyway."
fi

if [ "${RESET_ADMIN_ON_START:-false}" = "true" ] && [ -f /app/prisma/reset-admin.bundle.cjs ]; then
  echo "Resetting admin account..."
  node /app/prisma/reset-admin.bundle.cjs \
    || echo "WARNING: admin reset failed; starting app anyway."
fi

exec "$@"
