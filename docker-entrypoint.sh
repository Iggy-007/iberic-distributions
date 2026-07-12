#!/bin/sh

if [ "${AUTO_DB_PUSH:-true}" = "true" ] && [ -f /app/prisma/schema.prisma ]; then
  echo "Applying database schema..."
  NODE_PATH=/opt/ops/node_modules \
    node /opt/ops/node_modules/prisma/build/index.js db push \
    --schema=/app/prisma/schema.prisma \
    --skip-generate \
    || echo "WARNING: database schema sync failed; starting app anyway."
fi

if [ "${RESET_ADMIN_ON_START:-false}" = "true" ] && [ -f /opt/ops/ops-reset-admin.sh ]; then
  echo "Resetting admin account..."
  sh /opt/ops/ops-reset-admin.sh \
    || echo "WARNING: admin reset failed; starting app anyway."
fi

exec "$@"
