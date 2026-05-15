import DashboardLayout from "@/components/layout/DashboardLayout";
import DeleteGroupButton from "@/components/DeleteGroupButton";
import { getGroups } from "@/services/groups";
import Link from "next/link";

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; instructor?: string }>;
}) {
  const { q = "", instructor = "" } = await searchParams;
  const { groups } = await getGroups();

  const instructors = Array.from(new Set(groups.map((group) => group.instructor).filter(Boolean)));
  const filteredGroups = groups.filter((group) => {
    const matchesSearch = group.name.toLowerCase().includes(q.toLowerCase());
    const matchesInstructor = !instructor || group.instructor === instructor;
    return matchesSearch && matchesInstructor;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold">Groups</h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Manage teams, instructors, schedules, and project progress.
            </p>
          </div>
          <Link href="/groups/add" className="rounded-md bg-slate-950 px-5 py-3 text-center font-semibold text-white transition hover:bg-slate-800 dark:bg-cyan-400 dark:text-slate-950">
            Add Group
          </Link>
        </div>

        <form className="grid grid-cols-1 gap-3 rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1fr_240px_auto]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search groups"
            className="rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
          />
          <select
            name="instructor"
            defaultValue={instructor}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="">All instructors</option>
            {instructors.map((name) => (
              <option key={name ?? ""} value={name ?? ""}>
                {name}
              </option>
            ))}
          </select>
          <button className="rounded-md bg-cyan-500 px-4 py-2 font-semibold text-slate-950">Filter</button>
        </form>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredGroups.map((group) => (
            <article key={group.id} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{group.name}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Instructor: {group.instructor ?? "Unassigned"}
                  </p>
                </div>
                <span className="rounded-full bg-cyan-100 px-3 py-1 text-sm font-semibold text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200">
                  {group.progress ?? 0}%
                </span>
              </div>

              <div className="mt-5 text-sm text-slate-600 dark:text-slate-300">
                Session: <span className="font-semibold">{group.session ?? "Not scheduled"}</span>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${group.progress ?? 0}%` }} />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <a href={`/groups/${group.id}`} className="rounded-md border border-slate-200 py-2 text-center text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                  View
                </a>
                <a href={`/groups/${group.id}/edit`} className="rounded-md border border-slate-200 py-2 text-center text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                  Edit
                </a>
                <DeleteGroupButton groupId={group.id} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
