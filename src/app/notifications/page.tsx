import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { demoGroups, demoInventory, demoProjects } from "@/lib/mockData";
import type { Group, InventoryItem, Project } from "@/types/database";
import { AlertTriangle, Bell, CalendarClock, TrendingUp } from "lucide-react";
import { connection } from "next/server";

async function getRows<T>(table: string, fallback: T[]) {
  const { data, error } = await supabase.from(table).select("*");
  return (error ? fallback : data ?? []) as T[];
}

export default async function NotificationsPage() {
  await connection();

  const [inventory, projects, groups] = await Promise.all([
    getRows<InventoryItem>("inventory_items", demoInventory),
    getRows<Project>("projects", demoProjects),
    getRows<Group>("groups", demoGroups),
  ]);

  const alerts = [
    ...inventory
      .filter((item) => Number(item.missing_quantity ?? 0) > 0)
      .map((item) => ({
        icon: AlertTriangle,
        title: `${item.name} shortage`,
        body: `${item.missing_quantity} missing pieces are blocking project allocations.`,
        tone: "text-red-600 dark:text-red-300",
      })),
    ...inventory
      .filter((item) => Number(item.remaining_stock ?? 0) <= Number(item.low_stock_threshold ?? 0))
      .map((item) => ({
        icon: Bell,
        title: `${item.name} low stock`,
        body: `${item.remaining_stock} remaining. Reorder before the next session.`,
        tone: "text-amber-600 dark:text-amber-300",
      })),
    ...projects
      .filter((project) => project.status !== "Finished")
      .slice(0, 4)
      .map((project) => ({
        icon: TrendingUp,
        title: `${project.title} in ${project.status}`,
        body: "Progress notification for instructor follow-up.",
        tone: "text-cyan-700 dark:text-cyan-300",
      })),
    ...groups.slice(0, 3).map((group) => ({
      icon: CalendarClock,
      title: `${group.name} session reminder`,
      body: group.session ?? "No session time scheduled.",
      tone: "text-slate-600 dark:text-slate-300",
    })),
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Operational alerts for stock, progress, sessions, and deadlines.</p>
        </div>
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {alerts.map((alert, index) => {
            const Icon = alert.icon;
            return (
              <article key={`${alert.title}-${index}`} className="rounded-md border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex gap-3">
                  <Icon className={alert.tone} size={22} />
                  <div>
                    <h2 className="font-semibold">{alert.title}</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{alert.body}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </DashboardLayout>
  );
}
