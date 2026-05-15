import DashboardLayout from "@/components/layout/DashboardLayout";
import DeleteStudentButton from "@/components/DeleteStudentButton";
import { supabase } from "@/lib/supabase";
import { demoGroups, demoStudents } from "@/lib/mockData";
import type { Group, Student } from "@/types/database";

async function getRows<T>(table: string, fallback: T[]) {
  const { data, error } = await supabase.from(table).select("*");
  return (error ? fallback : data ?? []) as T[];
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; group?: string }>;
}) {
  const { q = "", group = "" } = await searchParams;
  const [students, groups] = await Promise.all([
    getRows<Student>("students", demoStudents),
    getRows<Group>("groups", demoGroups),
  ]);

  const groupById = new Map(groups.map((item) => [item.id, item]));
  const filtered = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(q.toLowerCase());
    const matchesGroup = !group || student.group_id === group;
    return matchesSearch && matchesGroup;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Search competitors and manage their team assignments.</p>
        </div>
        <form className="grid grid-cols-1 gap-3 rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1fr_240px_auto]">
          <input name="q" defaultValue={q} placeholder="Search students" className="rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
          <select name="group" defaultValue={group} className="rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
            <option value="">All groups</option>
            {groups.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <button className="rounded-md bg-cyan-500 px-4 py-2 font-semibold text-slate-950">Filter</button>
        </form>
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {filtered.map((student) => (
            <div key={student.id} className="grid grid-cols-1 items-center gap-3 border-b border-slate-100 p-4 last:border-0 dark:border-slate-800 md:grid-cols-[1fr_1fr_120px_auto]">
              <div>
                <p className="font-semibold">{student.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Age {student.age ?? "N/A"}</p>
              </div>
              <p className="text-sm">{groupById.get(student.group_id)?.name ?? "Unassigned"}</p>
              <a href={`/students/${student.id}/edit`} className="rounded-md border border-slate-200 px-3 py-2 text-center text-sm font-semibold dark:border-slate-700">Edit</a>
              <DeleteStudentButton studentId={student.id} />
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
