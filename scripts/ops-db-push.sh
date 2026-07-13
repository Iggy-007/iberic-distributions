#!/bin/sh
set -e

if [ -f /app/prisma/migrate-shipping-services.sql ]; then
  NODE_PATH=/opt/ops/node_modules \
    node /opt/ops/node_modules/prisma/build/index.js db execute \
    --file=/app/prisma/migrate-shipping-services.sql \
    --schema=/app/prisma/schema.prisma
fi

NODE_PATH=/opt/ops/node_modules \
  node /opt/ops/node_modules/prisma/build/index.js db push \
  --schema=/app/prisma/schema.prisma \
  --skip-generate \
  --accept-data-loss
