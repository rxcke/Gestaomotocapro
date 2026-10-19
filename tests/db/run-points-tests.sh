#!/usr/bin/env bash
set -euo pipefail
# Dedicated local disposable PostgreSQL only; never uses the connected Cloud DB.
root="$(pwd)"
tmp="$(mktemp -d /tmp/gmp-points-tests.XXXXXX)"
chmod 777 "$tmp"
run_pg() { if [ "$(id -u)" = 0 ]; then runuser -u nobody -- "$@"; else "$@"; fi; }
cleanup() { run_pg pg_ctl -D "$tmp/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$tmp"; }
trap cleanup EXIT
pg_home="$(dirname "$(dirname "$(readlink -f "$(command -v initdb)")")")"
pg_lib="$pg_home/lib"
if [ -f "$pg_lib/plpgsql.so" ] && [ -d /nix/store ]; then
  # Patch only a temporary executable: sandbox Nix paths split modules from the compiled libdir.
  mkdir -p "$tmp/bin"
  cp -R "$pg_home/bin/." "$tmp/bin/"
  chmod u+w "$tmp/bin/postgres"
  python3 - "$tmp/bin/postgres" "$pg_lib" <<'PY'
import pathlib, re, sys
path = pathlib.Path(sys.argv[1])
data = path.read_bytes()
replacement = sys.argv[2].encode()
for old in re.findall(rb'/nix/store/[^\x00]+-postgresql-[^/\x00]+-lib/lib(?=\x00)', data):
    if len(replacement) <= len(old):
        data = data.replace(old + b'\x00', replacement + b'\x00' * (len(old) - len(replacement) + 1))
path.write_bytes(data)
PY
  export PATH="$tmp/bin:$PATH"
fi
run_pg initdb -L "$pg_home/share/postgresql" -D "$tmp/data" -A trust -U points_test >/dev/null
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