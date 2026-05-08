import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  const session = await auth();
  if (session?.user?.id) {
    const stillExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });
    if (stillExists) {
      redirect(searchParams.from ?? "/");
    }
    // Stale cookie — bounce through the route handler that can actually
    // clear it, then come back to /login fresh.
    redirect("/api/clear-session");
  }

  const callbackUrl = searchParams.from ?? "/";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="flex w-full max-w-md flex-col gap-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-foreground text-background">
            <span className="text-sm font-semibold tracking-tighter">eo</span>
          </div>
          <span className="text-base font-semibold tracking-tight">
            engineering.os
          </span>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl tracking-tight">Sign in</CardTitle>
            <CardDescription>
              Google handles identity and calendar access.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: callbackUrl });
              }}
            >
              <Button
                type="submit"
                variant="outline"
                className="w-full justify-start gap-3"
              >
                <GoogleLogo />
                Continue with Google
              </Button>
            </form>

            <p className="pt-1 text-xs text-muted-foreground">
              You can connect GitHub from{" "}
              <span className="font-medium text-foreground">Settings</span>{" "}
              after signing in.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 18 18" className="h-4 w-4">
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
