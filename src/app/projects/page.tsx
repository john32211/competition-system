import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { demoGroups, demoProjects } from "@/lib/mockData";
import type { Group, Project } from "@/types/database";

async function getRows<T>(table: string, fallback: T[]) {
  const { data, error } = await supabase.from(table).select("*");
  return (error ? fallback : data ?? []) as T[];
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status = "", q = "" } = await searchParams;
  const [projects, groups] = await Promise.all([
    getRows<Project>("projects", demoProjects),
    getRows<Group>("groups", demoGroups),
  ]);
  const groupById = new Map(groups.map((group) => [group.id, group]));
  const filtered = projects.filter((project) => {
    const matchesStatus = !status || project.status === status;
    const matchesSearch = project.title.toLowerCase().includes(q.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Track robotics deliverables from planning to finished judging readiness.</p>
        </div>
        <form className="grid grid-cols-1 gap-3 rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1fr_220px_auto]">
          <input name="q" defaultValue={q} placeholder="Search projects" className="rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
          <select name="status" defaultValue={status} className="rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
            <option value="">All statuses</option>
            {["Planning", "Wiring", "Coding", "Testing", "Finished"].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <button className="rounded-md bg-cyan-500 px-4 py-2 font-semibold text-slate-950">Filter</button>
        </form>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filtered.map((project) => (
            <article key={project.id} className="rounded-md border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{project.title}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {groupById.get(project.group_id)?.name ?? "Unassigned group"}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold dark:bg-slate-800">{project.status}</span>
              </div>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{project.description}</p>
              <a href={`/groups/${project.group_id}/project`} className="mt-5 inline-block rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-700">
                Update project
              </a>
            </article>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
