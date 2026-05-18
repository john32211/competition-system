"use client";

import Link from "next/link";
import {
  Bell,
  Boxes,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FileUp,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Groups", href: "/groups", icon: Users },
  { name: "Students", href: "/students", icon: GraduationCap },
  { name: "Tasks", href: "/tasks", icon: ClipboardList },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Sessions", href: "/sessions", icon: CalendarDays },
  { name: "Attendance", href: "/attendance", icon: CalendarCheck },
  { name: "Inventory", href: "/inventory", icon: Boxes },
  { name: "Files", href: "/files", icon: FileUp },
  { name: "Alerts", href: "/notifications", icon: Bell },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await supabase.auth.signOut();
    document.cookie = "sb-access-token=; path=/; max-age=0; SameSite=Lax";
    router.push("/login");
  }

  return (
    <aside className="sticky top-0 z-30 flex max-h-screen flex-col border-r border-slate-800 bg-slate-950 text-white lg:h-screen lg:w-72">
      <div className="border-b border-slate-800 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
          Competition OS
        </p>
        <h1 className="mt-2 text-xl font-bold">Robotics Control</h1>
      </div>

      <nav className="flex flex-1 gap-2 overflow-x-auto p-3 lg:block lg:space-y-1 lg:overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-cyan-400 text-slate-950"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Icon size={18} />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md p-3 text-slate-300 transition hover:bg-slate-900 hover:text-white"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
