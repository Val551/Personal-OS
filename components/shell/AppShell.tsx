"use client";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandMenu } from "./CommandMenu";
import { useEffect, useState } from "react";
import type { Session } from "next-auth";

export function AppShell({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session;
}) {
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar session={session} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenCmd={() => setCmdOpen(true)} />
        <main className="relative flex-1 px-8 pb-20 pt-6">{children}</main>
      </div>
      <CommandMenu open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  );
}
