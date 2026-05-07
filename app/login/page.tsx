import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
import { ArrowRight, Github, Sparkles } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  const session = await auth();
  if (session) redirect(searchParams.from ?? "/");

  const callbackUrl = searchParams.from ?? "/";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-base px-6 py-16">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 30% 0%, rgba(244,184,96,0.10), transparent 60%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(91,163,168,0.08), transparent 60%)",
        }}
      />

      <div className="relative z-10 flex w-full max-w-[460px] flex-col gap-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-elevated shadow-elevated">
            <span className="font-mono text-[13px] tracking-tighter text-amber">{"//"}</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-[20px] italic tracking-tight text-ink">
              engineering<span className="text-amber">.os</span>
            </span>
            <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-dim">
              v0.1 · personal
            </span>
          </div>
        </div>

        {/* Headline */}
        <div className="flex flex-col gap-3">
          <p className="comment-label">authenticate</p>
          <h1 className="font-display text-[44px] leading-[0.98] tracking-tightest-display text-ink">
            Sign in<span className="text-amber">.</span>
          </h1>
          <p className="font-mono text-[12.5px] leading-relaxed text-ink-muted">
            Google for identity &amp; calendar. GitHub linked for pull-request
            metadata. Tokens stay on your machine.
          </p>
        </div>

        {/* Provider buttons */}
        <div className="flex flex-col gap-2.5">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: callbackUrl });
            }}
          >
            <button
              type="submit"
              className="group flex w-full items-center justify-between rounded-md border border-edge bg-elevated px-4 py-3 transition-all duration-150 ease-spring hover:-translate-y-px hover:border-amber/40 hover:shadow-glow active:translate-y-0"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-base">
                  <GoogleLogo />
                </span>
                <span className="text-[13.5px] text-ink">Continue with Google</span>
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-ink-dim transition-all group-hover:translate-x-0.5 group-hover:text-amber" />
            </button>
          </form>

          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: callbackUrl });
            }}
          >
            <button
              type="submit"
              className="group flex w-full items-center justify-between rounded-md border border-hairline bg-panel px-4 py-3 transition-all duration-150 ease-spring hover:-translate-y-px hover:border-edge active:translate-y-0"
            >
              <span className="flex items-center gap-3">
                <Github className="h-5 w-5 text-ink-muted" />
                <span className="text-[13.5px] text-ink">Continue with GitHub</span>
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-ink-dim transition-all group-hover:translate-x-0.5 group-hover:text-amber" />
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-2 rounded-md border border-hairline bg-elevated/40 p-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-amber" />
            <span className="comment-label">first-time setup</span>
          </div>
          <p className="font-mono text-[11px] leading-relaxed text-ink-dim">
            Sign in once with each provider to grant calendar + PR access. You can
            link both accounts to the same identity from settings later.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
          <span>{"// localhost · dev"}</span>
          <span className="caret">{"$"}</span>
        </div>
      </div>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 18 18" className="h-3.5 w-3.5">
      <path
        d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
