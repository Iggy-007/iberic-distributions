#!/bin/sh

if [ "${AUTO_DB_PUSH:-true}" = "true" ] && [ -f /app/prisma/schema.prisma ]; then
  if [ -f /app/prisma/migrate-shipping-services.sql ]; then
    echo "Running shipping services migration prelude..."
    NODE_PATH=/opt/ops/node_modules \
      node /opt/ops/node_modules/prisma/build/index.js db execute \
      --file=/app/prisma/migrate-shipping-services.sql \
      --schema=/app/prisma/schema.prisma \
      || echo "WARNING: shipping migration prelude failed; continuing with db push."
  fi

  if [ -f /app/prisma/migrate-document-types.sql ]; then
    echo "Running document types migration prelude..."
    NODE_PATH=/opt/ops/node_modules \
      node /opt/ops/node_modules/prisma/build/index.js db execute \
      --file=/app/prisma/migrate-document-types.sql \
      --schema=/app/prisma/schema.prisma \
      || echo "WARNING: document types migration prelude failed; continuing with db push."
  fi

  echo "Applying database schema..."
  NODE_PATH=/opt/ops/node_modules \
    node /opt/ops/node_modules/prisma/build/index.js db push \
    --schema=/app/prisma/schema.prisma \
    --skip-generate \
    --accept-data-loss \
    || echo "WARNING: database schema sync failed; starting app anyway."
fi

if [ "${RESET_ADMIN_ON_START:-false}" = "true" ] && [ -f /opt/ops/ops-reset-admin.sh ]; then
  echo "Resetting admin account..."
  sh /opt/ops/ops-reset-admin.sh \
    || echo "WARNING: admin reset failed; starting app anyway."
fi

exec "$@"
