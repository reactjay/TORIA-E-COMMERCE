import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { adminHasAny, bootstrapAdmin } from "@/lib/server/admin";

export const Route = createFileRoute("/admin/")({
  loader: async () => adminHasAny(),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const { hasAdmin } = Route.useLoaderData();
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "create">(hasAdmin ? "signin" : "create");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isPending || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const boot = await bootstrapAdmin();
        if (!cancelled && boot.ok) {
          await navigate({ to: "/admin/dashboard" });
        }
      } catch {
        /* stay on login */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isPending, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "create") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: "Elite Admin",
        });
        if (err) throw new Error(err.message ?? "Could not create account.");
      } else {
        const { error: err } = await authClient.signIn.email({ email, password });
        if (err) throw new Error(err.message ?? "Invalid email or password.");
      }
      const boot = await bootstrapAdmin();
      if (!boot.ok) throw new Error("This account is not authorized for the atelier.");
      await navigate({ to: "/admin/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden bg-charcoal lg:block">
        <img src="/images/hero.jpg" alt="" className="h-full w-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/20 to-charcoal/55" />
      </div>
      <div className="flex items-center justify-center bg-[#1a1614] px-4 py-10">
        <div className="w-full max-w-md rounded-[22px] border border-line bg-cream px-8 py-10 shadow-lift sm:px-10">
          <p className="text-center font-display text-4xl tracking-[0.2em] text-espresso">ELITE</p>
          <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-beige">
            Admin Portal
          </p>
          <h1 className="mt-8 text-center font-display text-4xl text-espresso">Welcome back</h1>
          <p className="mt-2 text-center text-sm text-muted">Sign in to manage your store.</p>

          <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Email Address</span>
              <input
                className="field"
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Password</span>
              <span className="relative block">
                <input
                  className="field pr-12"
                  type={show ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "create" ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </span>
            </label>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <button
                type="button"
                className="text-espresso/70 underline-offset-2 hover:underline"
                onClick={() => setError("Password resets are issued by the studio director.")}
              >
                Forgot password?
              </button>
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <button type="submit" className="btn-primary w-full" disabled={busy || !authEnabled}>
              {busy ? "Please wait…" : mode === "create" ? "Create admin" : "Sign In"}
            </button>
          </form>

          {!hasAdmin ? (
            <p className="mt-4 text-center text-xs text-muted">
              First sign-in creates the atelier administrator.
            </p>
          ) : mode === "signin" ? (
            <button
              type="button"
              className="mt-4 w-full text-center text-xs text-muted hover:underline"
              onClick={() => setMode("create")}
            >
              Need an account? Create one — access is granted only if no admin exists yet.
            </button>
          ) : (
            <button
              type="button"
              className="mt-4 w-full text-center text-xs text-muted hover:underline"
              onClick={() => setMode("signin")}
            >
              Already have access? Sign in
            </button>
          )}

          {authEnabled ? (
            <div className="mt-6 space-y-2">
              {GROK_PROVIDERS.map((p) => (
                <button
                  key={p.providerId}
                  type="button"
                  className="btn-secondary w-full"
                  onClick={() => signIn(p.providerId, { callbackURL: "/admin" })}
                >
                  Continue with {p.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-center text-sm text-muted">Sign-in is disabled.</p>
          )}

          <p className="mt-8 text-center text-xs tracking-wide text-muted">Authorized staff only</p>
        </div>
      </div>
    </div>
  );
}
