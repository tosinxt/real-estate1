"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, FileText, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/hooks/useAuthState";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", shortcut: "G D" },
  { href: "/review", icon: FileText, label: "Net Sheets", shortcut: "G S" },
  { href: "/settings", icon: Settings, label: "Settings", shortcut: "G ," },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthState();

  async function handleSignOut() {
    await signOut(auth);
    router.push("/");
  }

  return (
    <nav
      aria-label="Main navigation"
      className="flex flex-col w-52 shrink-0 bg-white border-r border-slate-200 h-screen sticky top-0"
    >
      {/* Logo */}
      <div className="px-4 py-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-md bg-amber-500 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-[10px] tracking-tight">TS</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-sm tracking-tight leading-none">TitleSnap</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono tracking-widest uppercase">AI Net Sheets</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <div className="flex flex-col px-2 py-3 flex-1">
        {NAV.map(({ href, icon: Icon, label, shortcut }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-2 py-1.5 pl-2 pr-2.5 rounded text-[13px] transition-colors duration-[80ms] active:opacity-70",
                active
                  ? "bg-amber-50 text-amber-700 border-l-2 border-amber-500"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-l-2 border-transparent"
              )}
            >
              <Icon size={14} strokeWidth={1.8} className="shrink-0" />
              <span className="flex-1">{label}</span>
              <kbd className="invisible group-hover:visible text-[10px] text-slate-400 font-mono leading-none">
                {shortcut}
              </kbd>
            </Link>
          );
        })}
      </div>

      {/* Theme toggle */}
      <div className="px-4 py-2.5 flex items-center justify-between border-t border-slate-200">
        <span className="text-[11px] text-slate-400 font-medium">Theme</span>
        <ThemeSwitch />
      </div>

      {/* User + sign out */}
      <div className="flex flex-col px-2 py-3 border-t border-slate-200">
        {user?.email && (
          <div className="px-2 py-1 mb-1">
            <p className="text-[11px] text-slate-400 truncate font-mono">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 py-1.5 pl-2 pr-2.5 rounded text-[13px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors duration-[80ms] active:opacity-70 w-full border-l-2 border-transparent"
        >
          <LogOut size={14} strokeWidth={1.8} className="shrink-0" />
          Sign out
        </button>
      </div>
    </nav>
  );
}
