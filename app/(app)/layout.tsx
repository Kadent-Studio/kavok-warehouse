import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "17rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        role={session.user.role}
        fullName={session.user.name ?? session.user.username}
        username={session.user.username}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border/70 px-5 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <SidebarTrigger className="-ml-1" data-press />
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.12em] text-ink-faint">
            <span className="font-data text-primary/70">KVK</span>
            <span className="text-ink-faint/40">/</span>
            <span>Warehouse Control</span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
