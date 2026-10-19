#!/usr/bin/env bash
set -euo pipefail
# Dedicated local disposable PostgreSQL only; never uses the connected Cloud DB.
root="$(pwd)"
tmp="$(mktemp -d /tmp/gmp-points-tests.XXXXXX)"
chmod 777 "$tmp"
run_pg() { if [ "$(id -u)" = 0 ]; then runuser -u nobody -- "$@"; else "$@"; fi; }
cleanup() { run_pg pg_ctl -D "$tmp/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$tmp"; }
trap cleanup EXIT
pg_lib="$(dirname "$(dirname "$(readlink -f "$(command -v initdb)")")")/lib"
pg_share="$(dirname "$pg_lib")/share/postgresql"
cp -R "$pg_share" "$tmp/share"
# Nix sandbox binaries report an unavailable compiled $libdir; fix only copied bootstrap inputs.
for file in "$tmp/share/postgres.bki" "$tmp/share/system_functions.sql" "$tmp/share/snowball_create.sql"; do
  test ! -f "$file" || sed -i "s|\$libdir|$pg_lib|g" "$file"
done
run_pg initdb -L "$tmp/share" -D "$tmp/data" -A trust -U points_test -c "dynamic_library_path=$pg_lib" >/dev/null
run_pg pg_ctl -D "$tmp/data" -l "$tmp/server.log" -o "-k $tmp -p 55439 -c listen_addresses=''" start >/dev/null
export PGHOST="$tmp" PGPORT=55439 PGUSER=points_test PGDATABASE=postgres PGSSLMODE=disable
unset PGPASSWORD
psql -X -v ON_ERROR_STOP=1 -f "$root/tests/db/points-bootstrap.sql" >/dev/null
psql -X -v ON_ERROR_STOP=1 -f "$root/drizzle/migrations/0040_usage_points_ledger.sql" >/dev/null
psql -X -v ON_ERROR_STOP=1 -f "$root/tests/db/points-integrity.sql" >"$tmp/results.log" 2>&1 || { cat "$tmp/results.log"; exit 1; }
for i in $(seq 1 10); do
  psql -X -v ON_ERROR_STOP=1 -c "SELECT * FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000004','2026-10-23 12:00:00+00')" >"$tmp/concurrent-$i.log" 2>&1 &
done
wait
psql -X -v ON_ERROR_STOP=1 -c "SELECT points_assert((SELECT sum(points) FROM points_events WHERE user_id='00000000-0000-0000-0000-000000000004')=10 AND (SELECT count(*) FROM points_events WHERE user_id='00000000-0000-0000-0000-000000000004')=6, 'dez chamadas simultâneas no quinto dia: só um diário e um bônus')" >>"$tmp/results.log" 2>&1
grep 'PASS:' "$tmp/results.log"
printf 'All SQL points tests passed in disposable PostgreSQL.\n'