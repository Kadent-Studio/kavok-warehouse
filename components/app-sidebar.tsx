"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  History,
  BookMarked,
  Users2,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeToggle, ThemeToggleCompact } from "@/components/theme-toggle";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Stock", href: "/stock", icon: Boxes },
  { label: "Movimientos", href: "/movements", icon: History },
  { label: "Catálogo", href: "/parts", icon: BookMarked },
  { label: "Usuarios", href: "/users", icon: Users2, adminOnly: true },
];

export function AppSidebar({
  role,
  fullName,
  username,
}: {
  role: "operator" | "admin";
  fullName: string;
  username: string;
}) {
  const pathname = usePathname();
  const items = NAV.filter((i) => !i.adminOnly || role === "admin");

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 px-1 py-1.5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-2.5 overflow-hidden group-data-[collapsible=icon]:gap-0">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-display font-bold text-[18px]">
              K
            </span>
            <div className="leading-none group-data-[collapsible=icon]:hidden">
              <p className="font-display font-semibold text-[15.5px] tracking-tight text-ink">
                Kavok
              </p>
              <p className="text-[10.5px] uppercase tracking-[0.14em] text-ink-faint mt-0.5">
                Warehouse · YV
              </p>
            </div>
          </div>
          <SidebarTrigger
            data-press
            className="hidden md:flex text-ink-faint hover:text-ink group-data-[collapsible=icon]:hidden"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      className="h-11 gap-3 rounded-lg px-3 text-[14.5px] font-medium text-sidebar-foreground data-active:bg-card data-active:text-ink data-active:shadow-sm data-active:font-semibold data-active:[&_svg]:text-primary [&_svg]:text-ink-faint [&_svg]:size-5"
                      render={
                        <Link href={item.href} data-press>
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2">
        {/* Expanded footer */}
        <div className="space-y-3 group-data-[collapsible=icon]:hidden">
          <ThemeToggle />
          <div className="flex items-center gap-2.5 rounded-lg border border-sidebar-border bg-card/60 px-2.5 py-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-display font-semibold text-[13px]">
              {initials(fullName)}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[13px] font-medium text-ink truncate">
                {fullName}
              </p>
              <p className="text-[11px] text-ink-faint truncate">
                <span className="font-data">@{username}</span>
                <span className="mx-1 text-ink-faint/50">·</span>
                {role === "admin" ? "Admin" : "Operador"}
              </p>
            </div>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                data-press
                aria-label="Cerrar sesión"
                className="flex size-7 items-center justify-center rounded-md text-ink-faint hover:bg-sidebar-accent hover:text-ink transition-colors"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Collapsed footer */}
        <div className="hidden flex-col items-center gap-1.5 group-data-[collapsible=icon]:flex">
          <ThemeToggleCompact />
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              data-press
              aria-label="Cerrar sesión"
              className="flex size-8 items-center justify-center rounded-lg text-ink-faint hover:bg-sidebar-accent hover:text-ink transition-colors"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "K";
}
