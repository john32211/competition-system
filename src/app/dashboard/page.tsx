import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { connection } from "next/server";
import {
  demoComponents,
  demoGroups,
  demoInventory,
  demoProjects,
  demoStudents,
} from "@/lib/mockData";
import type { ComponentRequirement, Group, InventoryItem, Project, Student } from "@/types/database";

async function getTable<T>(table: string, fallback: T[]) {
  const { data, error } = await supabase.from(table).select("*");
  return (error ? fallback : data ?? []) as T[];
}

export default async function DashboardPage() {
  await connection();

  const [groups, students, projects, components, inventory] = await Promise.all([
    getTable<Group>("groups", demoGroups),
    getTable<Student>("students", demoStudents),
    getTable<Project>("projects", demoProjects),
    getTable<ComponentRequirement>("components", demoComponents),
    getTable<InventoryItem>("inventory_items", demoInventory),
  ]);

  const inventoryShortages = inventory.filter((item) => Number(item.missing_quantity ?? 0) > 0);
  const componentShortages = components.filter(
    (component) => Number(component.needed ?? 0) > Number(component.available ?? 0)
  );
  const shortageAlertCount = inventoryShortages.length + componentShortages.length;
  const lowStock = inventory.filter(
    (item) =>
      Number(item.remaining_stock ?? 0) <= Number(item.low_stock_threshold ?? 0) ||
      Number(item.missing_quantity ?? 0) > 0
  );
  const averageProgress = Math.round(
    groups.reduce((sum, group) => sum + Number(group.progress ?? 0), 0) / Math.max(groups.length, 1)
  );
  const finishedProjects = projects.filter((project) => project.status === "Finished").length;
  const missingRequirements = components.reduce(
    (sum, component) => sum + Math.max(Number(component.needed ?? 0) - Number(component.available ?? 0), 0),
    0
  );

  const statusOrder = ["Planning", "Wiring", "Coding", "Testing", "Finished"];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">
              Robotics ERP
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Operations Dashboard</h1>
            <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
              Live competition health across teams, project delivery, attendance readiness, and robotics inventory.
            </p>
          </div>
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
            {shortageAlertCount} shortage alerts and {lowStock.length} low stock warnings
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Total Groups", groups.length, "Teams in season"],
            ["Students", students.length, "Registered competitors"],
            ["Projects", projects.length, `${finishedProjects} finished`],
            ["Avg Progress", `${averageProgress}%`, "Across active teams"],
            ["Missing Parts", missingRequirements, "Unallocated requests"],
          ].map(([label, value, detail]) => (
            <div
              key={label}
              className="rounded-md border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
              <h2 className="mt-3 text-3xl font-bold">{value}</h2>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Team Comparison</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Progress by robotics group</p>
              </div>
              <Link href="/groups" className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">
                Manage teams
              </Link>
            </div>
            <div className="space-y-4">
              {groups.slice(0, 6).map((group) => (
                <div key={group.id}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">{group.name}</span>
                    <span>{Number(group.progress ?? 0)}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-cyan-500"
                      style={{ width: `${Math.min(Number(group.progress ?? 0), 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-semibold">Project Pipeline</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Completion analytics by status</p>
            <div className="mt-6 space-y-3">
              {statusOrder.map((status) => {
                const count = projects.filter((project) => project.status === status).length;
                return (
                  <div key={status} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-950">
                    <span className="text-sm font-medium">{status}</span>
                    <span className="rounded-full bg-slate-900 px-2 py-1 text-xs font-semibold text-white dark:bg-cyan-400 dark:text-slate-950">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Inventory Risk Board</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Central stock warnings plus project component shortages
              </p>
            </div>
            <Link href="/inventory" className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">
              Open inventory
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {componentShortages.slice(0, 3).map((component) => (
              <div key={component.id} className="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/30">
                <p className="font-semibold">{component.name}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Project needs {component.needed}, available {component.available}
                </p>
                <p className="mt-3 text-sm font-semibold text-red-600 dark:text-red-300">
                  Missing {Math.max(Number(component.needed ?? 0) - Number(component.available ?? 0), 0)}
                </p>
              </div>
            ))}
            {lowStock.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-md border border-slate-200 p-4 dark:border-slate-800">
                <p className="font-semibold">{item.name}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Remaining {item.remaining_stock} of {item.total_stock}
                </p>
                <p className="mt-3 text-sm font-semibold text-red-600 dark:text-red-300">
                  Missing {item.missing_quantity ?? 0}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
