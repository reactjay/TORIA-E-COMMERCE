import { useEffect, useState } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { bootstrapAdmin, getAdminMe } from "@/lib/server/admin";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const [state, setState] = useState<"pending" | "ok" | "denied">("pending");

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setState("denied");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const boot = await bootstrapAdmin();
        if (cancelled) return;
        if (boot.ok) {
          setState("ok");
          return;
        }
        const me = await getAdminMe();
        if (!cancelled) setState(me.isAdmin ? "ok" : "denied");
      } catch {
        if (!cancelled) setState("denied");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isPending]);

  if (isPending || state === "pending") {
    return (
      <div className="grid min-h-dvh place-items-center bg-cream text-sm text-muted">Loading atelier…</div>
    );
  }
  if (!user) return <RedirectToSignIn to="/admin" />;
  if (state === "denied") {
    return (
      <div className="grid min-h-dvh place-items-center bg-cream px-6 text-center">
        <div>
          <p className="font-display text-3xl">Authorized staff only</p>
          <p className="mt-2 text-sm text-muted">This account does not have admin access.</p>
          <a href="/admin" className="btn-primary mt-6 inline-flex">
            Return
          </a>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
