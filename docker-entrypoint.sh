#!/bin/sh
set -e

echo "→ Applying database schema (prisma db push)…"
pnpm exec prisma db push --skip-generate --accept-data-loss

if [ "$SEED_ON_START" = "true" ]; then
  echo "→ Seeding database…"
  pnpm exec prisma db seed || echo "⚠ Seed failed or already applied — continuing."
fi

echo "→ Starting application…"
exec "$@"
