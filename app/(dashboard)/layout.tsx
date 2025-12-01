"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BriefcaseBusiness,
  CalendarClock,
  CheckSquare,
  LayoutDashboard,
  PanelLeft,
  Settings,
  Users,
  Wallet,
  FileText,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col ${
          collapsed ? "md:w-16" : "md:w-64"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
            HR
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">
                HR Workbit
              </span>
              <span className="text-xs text-zinc-400">People & Attendance</span>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4 text-sm">
          {!collapsed && <SidebarSection title="Menu" />}
          <SidebarLink
            href="/dashboard"
            label="Dashboard"
            icon={<LayoutDashboard className="h-4 w-4" />}
            active={pathname === "/dashboard"}
            collapsed={collapsed}
          />
          <SidebarLink
            href="/employees"
            label="Data Karyawan"
            icon={<Users className="h-4 w-4" />}
            active={pathname.startsWith("/employees")}
            collapsed={collapsed}
          />
          <SidebarLink
            href="/jobs"
            label="Jabatan"
            icon={<BriefcaseBusiness className="h-4 w-4" />}
            active={pathname.startsWith("/jobs")}
            collapsed={collapsed}
          />
          <SidebarLink
            href="/schedule"
            label="Jadwal"
            icon={<CalendarClock className="h-4 w-4" />}
            active={pathname.startsWith("/schedule")}
            collapsed={collapsed}
          />
          <SidebarLink
            href="/attendance"
            label="Absensi"
            icon={<CheckSquare className="h-4 w-4" />}
            active={pathname.startsWith("/attendance")}
            collapsed={collapsed}
          />
          <SidebarLink
            href="/requests"
            label="Requests"
            icon={<FileText className="h-4 w-4" />}
            active={pathname.startsWith("/requests")}
            collapsed={collapsed}
          />
          <SidebarLink
            href="/payroll"
            label="Payroll"
            icon={<Wallet className="h-4 w-4" />}
            active={pathname.startsWith("/payroll")}
            collapsed={collapsed}
          />
          <SidebarLink
            href="/settings"
            label="Setting"
            icon={<Settings className="h-4 w-4" />}
            active={pathname.startsWith("/settings")}
            collapsed={collapsed}
          />
        </nav>
        <div className="px-4 py-3 text-xs text-zinc-500">
          <div className="font-medium text-zinc-300">v0.1.0</div>
          <div>HR internal system</div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-h-screen flex-1 flex-col bg-white dark:bg-black">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
           >
              <PanelLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-medium text-zinc-500">Dashboard</div>
          </div>
          <div className="relative text-sm">
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-3 rounded-full border border-zinc-200 bg-white px-2 py-1 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              <span className="hidden text-zinc-600 dark:text-zinc-300 sm:inline">
                Logged in as
                <span className="ml-1 font-semibold text-zinc-800 dark:text-zinc-100">
                  HR Admin
                </span>
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100">
                U
              </div>
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-lg border border-zinc-200 bg-white p-3 text-xs shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-sm font-semibold text-white">
                    U
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      HR Admin
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Akses penuh modul HR & absensi
                    </div>
                  </div>
                </div>
                <div className="mb-2 h-px bg-zinc-200 dark:bg-zinc-700" />
                <button
                  type="button"
                  onClick={async () => {
                    setProfileOpen(false);
                    try {
                      await fetch("/api/logout", { method: "POST" });
                    } catch (e) {
                      // ignore
                    }
                    router.push("/login");
                  }}
                  className="flex w-full items-center justify-center rounded-full bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 bg-white p-4 dark:bg-black md:p-6">
          <div className="mx-auto max-w-6xl space-y-4">{children}</div>
        </main>
      </div>
    </div>
  );
}

function SidebarSection({ title }: { title: string }) {
  return (
    <div className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
      {title}
    </div>
  );
}

function SidebarLink({
  href,
  label,
  icon,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  collapsed?: boolean;
}) {
  const baseClasses =
    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors";
  const activeClasses = active
    ? "bg-sidebar-primary text-sidebar-primary-foreground"
    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

  return (
    <Link
      href={href}
      className={`${baseClasses} ${activeClasses}`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground">
        {icon}
      </span>
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}
