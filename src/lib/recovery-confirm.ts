// One explicit verification per token: repeated mounts (StrictMode, re-renders)
// reuse the same in-flight result instead of spending the token twice.
export type ConfirmResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "invalid_type" | "missing_token" | "expired" | "failed" };

type VerifyFn = (args: { token_hash: string; type: "recovery" }) => Promise<{
  data: { session: { user?: { id?: string } } | null; user?: { id?: string } | null };
  error: { code?: string; status?: number; message?: string } | null;
}>;

const inflight = new Map<string, Promise<ConfirmResult>>();

export function readConfirmParams(search: string) {
  const p = new URLSearchParams(search.replace(/^\?/, ""));
  return { tokenHash: p.get("token_hash"), type: p.get("type") };
}

export function confirmRecovery(
  params: { tokenHash: string | null; type: string | null },
  verify: VerifyFn,
): Promise<ConfirmResult> {
  if (params.type !== "recovery") return Promise.resolve({ ok: false, reason: "invalid_type" });
  if (!params.tokenHash) return Promise.resolve({ ok: false, reason: "missing_token" });
  const key = params.tokenHash;
  const existing = inflight.get(key);
  if (existing) return existing;
  const run = verify({ token_hash: key, type: "recovery" }).then(({ data, error }): ConfirmResult => {
    if (error) {
      const expired = error.code === "otp_expired" || error.status === 403 || /expired|invalid/i.test(error.message ?? "");
      return { ok: false, reason: expired ? "expired" : "failed" };
    }
    const userId = data.session?.user?.id ?? data.user?.id;
    return userId && data.session ? { ok: true, userId } : { ok: false, reason: "failed" };
  }, (): ConfirmResult => ({ ok: false, reason: "failed" }));
  inflight.set(key, run);
  return run;
}

export const __resetConfirmForTests = () => inflight.clear();
