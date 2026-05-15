import DashboardLayout from "@/components/layout/DashboardLayout";
import StudentEditor from "@/components/forms/StudentEditor";
import { supabase } from "@/lib/supabase";
import { demoGroups, demoStudents } from "@/lib/mockData";
import type { Group, Student } from "@/types/database";

async function getRows<T>(table: string, fallback: T[]) {
  const { data, error } = await supabase.from(table).select("*");
  return (error ? fallback : data ?? []) as T[];
}

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [students, groups] = await Promise.all([
    getRows<Student>("students", demoStudents),
    getRows<Group>("groups", demoGroups),
  ]);
  const student = students.find((item) => item.id === id) ?? null;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-xl rounded-md border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold">Edit Student</h1>
        <div className="mt-6">
          <StudentEditor student={student} groups={groups} />
        </div>
      </div>
    </DashboardLayout>
  );
}
