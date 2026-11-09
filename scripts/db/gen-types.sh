#!/usr/bin/env bash
# Generate TypeScript types for the database into src/types/database.ts.
#
#   npm run db:types                      # from the local test database (no Docker)
#   DB_URL=postgresql://... npm run db:types
#   npx supabase gen types typescript --local > src/types/database.ts   # with Docker
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DB_URL="${DB_URL:-postgresql://${PGUSER:-$(whoami)}:${PGPASSWORD:-localtest}@localhost:5432/${CLEVORA_TEST_DB:-clevora_test}}"
OUT="$ROOT/src/types/database.ts"

mkdir -p "$(dirname "$OUT")"
npx supabase gen types typescript --remote="$DB_URL" --schema public > "$OUT"
npx --yes oxfmt "$OUT" > /dev/null
echo "✔ Types written to src/types/database.ts"
