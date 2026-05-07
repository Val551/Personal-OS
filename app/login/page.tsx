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
            Microsoft for calendar &amp; identity. GitHub linked for pull-request
            metadata. Tokens stay on your machine.
          </p>
        </div>

        {/* Provider buttons */}
        <div className="flex flex-col gap-2.5">
          <form
            action={async () => {
              "use server";
              await signIn("microsoft-entra-id", { redirectTo: callbackUrl });
            }}
          >
            <button
              type="submit"
              className="group flex w-full items-center justify-between rounded-md border border-edge bg-elevated px-4 py-3 transition-all duration-150 ease-spring hover:-translate-y-px hover:border-amber/40 hover:shadow-glow active:translate-y-0"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-base">
                  <MicrosoftLogo />
                </span>
                <span className="text-[13.5px] text-ink">Continue with Microsoft</span>
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

function MicrosoftLogo() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
      <rect x="1" y="1" width="6" height="6" fill="#F25022" />
      <rect x="9" y="1" width="6" height="6" fill="#7FBA00" />
      <rect x="1" y="9" width="6" height="6" fill="#00A4EF" />
      <rect x="9" y="9" width="6" height="6" fill="#FFB900" />
    </svg>
  );
}
