import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { StoreProvider } from "@/lib/store";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <StoreProvider>
      <AppShell session={session}>{children}</AppShell>
    </StoreProvider>
  );
}
