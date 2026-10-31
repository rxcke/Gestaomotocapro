#!/usr/bin/env bash
set -euo pipefail
# Dedicated local disposable PostgreSQL only; never uses the connected Cloud DB.
root="$(pwd)"
tmp="$(mktemp -d /tmp/gmp-rewards-tests.XXXXXX)"
chmod 777 "$tmp"
run_pg() { if [ "$(id -u)" = 0 ]; then runuser -u nobody -- "$@"; else "$@"; fi; }
cleanup() { run_pg pg_ctl -D "$tmp/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$tmp"; }
trap cleanup EXIT
pg_home="$(dirname "$(dirname "$(readlink -f "$(command -v initdb)")")")"
pg_lib="$pg_home/lib"
if [ -f "$pg_lib/plpgsql.so" ] && [ -d /nix/store ]; then
  # Relocate temporary binaries with matching lib/share folders for sandbox Nix paths.
  mkdir -p "$tmp/bin"
  ln -s "$pg_home/share" "$tmp/share"
  ln -s "$pg_lib" "$tmp/lib"
  cp -R "$pg_home/bin/." "$tmp/bin/"
  export PATH="$tmp/bin:$PATH"
fi
run_pg initdb -L "$pg_home/share/postgresql" -D "$tmp/data" -A trust -U points_test >/dev/null
run_pg pg_ctl -D "$tmp/data" -l "$tmp/server.log" -o "-k $tmp -p 55440 -c listen_addresses=''" start >/dev/null
export PGHOST="$tmp" PGPORT=55440 PGUSER=points_test PGDATABASE=postgres PGSSLMODE=disable
unset PGPASSWORD
psql -X -v ON_ERROR_STOP=1 -f "$root/tests/db/points-bootstrap.sql" >/dev/null
psql -X -v ON_ERROR_STOP=1 -f "$root/drizzle/migrations/0040_usage_points_ledger.sql" >/dev/null
psql -X -v ON_ERROR_STOP=1 -f "$root/tests/db/rewards-integrity.sql" >/dev/null
psql -X -v ON_ERROR_STOP=1 -f "$root/drizzle/migrations/0041_rewards_club.sql" >/dev/null
psql -X -v ON_ERROR_STOP=1 -f "$root/tests/db/rewards-scenarios.sql" >"$tmp/results.log" 2>&1 || { cat "$tmp/results.log"; exit 1; }
pids=()
for i in $(seq 1 10); do
  psql -X -v ON_ERROR_STOP=1 -c "SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false); SELECT request_reward('10000000-0000-0000-0000-000000000001',gen_random_uuid(),4)" >"$tmp/concurrent-$i.log" 2>&1 &
  pids+=("$!")
done
for pid in "${pids[@]}"; do wait "$pid" || true; done
psql -X -v ON_ERROR_STOP=1 -c "SELECT reward_assert((SELECT count(*) FROM reward_redemptions WHERE status='pending')=1,'ten parallel different keys cannot overspend'); SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false); SELECT reward_assert((SELECT available=1 AND reserved=4 FROM get_reward_wallet()),'concurrent wallet invariant');" >>"$tmp/results.log" 2>&1
pids=()
for user in 1 2; do
 psql -X -v ON_ERROR_STOP=1 -c "SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000$user',false); SELECT request_reward('10000000-0000-0000-0000-000000000003',gen_random_uuid(),1)" >"$tmp/stock-$user.log" 2>&1 &
 pids+=("$!")
done
for pid in "${pids[@]}"; do wait "$pid" || true; done
psql -X -v ON_ERROR_STOP=1 -c "SELECT reward_assert((SELECT count(*) FROM reward_redemptions WHERE reward_id='10000000-0000-0000-0000-000000000003')=1,'two owners last stock only one request');" >>"$tmp/results.log" 2>&1
# Approval/cancellation race on the same pending request.
rid="$(psql -AtX -c "SELECT id FROM reward_redemptions WHERE reward_id='10000000-0000-0000-0000-000000000001' AND status='pending' LIMIT 1")"
pids=()
for status in approved canceled; do
 psql -X -v ON_ERROR_STOP=1 -c "SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false); SELECT process_reward('$rid','$status')" >"$tmp/race-$status.log" 2>&1 &
 pids+=("$!")
done
for pid in "${pids[@]}"; do wait "$pid" || true; done
psql -X -v ON_ERROR_STOP=1 -c "SELECT reward_assert((SELECT count(*) FROM reward_wallet_entries WHERE redemption_id='$rid' AND kind IN ('spend','release'))=1,'approval cancel race resolves once'); SELECT reward_assert((SELECT sum(points) FROM points_events WHERE user_id='00000000-0000-0000-0000-000000000001')=10,'ranking earned unchanged across concurrency');" >>"$tmp/results.log" 2>&1
grep 'PASS:' "$tmp/results.log"
printf 'Rewards tests passed in disposable PostgreSQL.\n'
