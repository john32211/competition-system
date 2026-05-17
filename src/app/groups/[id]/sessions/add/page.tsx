import DashboardLayout from "@/components/layout/DashboardLayout";
import SessionEditor from "@/components/forms/SessionEditor";
import { supabase } from "@/lib/supabase";
import type { WorkPlanTask } from "@/types/database";

export default async function AddSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: tasks } = await supabase
    .from("work_plan_tasks")
    .select("*")
    .eq("group_id", id)
    .order("task_order", { ascending: true });

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl rounded-md border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold">Add Session</h1>
        <div className="mt-6">
          <SessionEditor groupId={id} tasks={(tasks ?? []) as WorkPlanTask[]} />
        </div>
      </div>
    </DashboardLayout>
  );
}
