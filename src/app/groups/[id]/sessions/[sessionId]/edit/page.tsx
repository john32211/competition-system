import DashboardLayout from "@/components/layout/DashboardLayout";
import SessionEditor from "@/components/forms/SessionEditor";
import { supabase } from "@/lib/supabase";
import type { Session, SessionTaskUpdate, WorkPlanTask } from "@/types/database";

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;
  const [{ data }, { data: tasks }, { data: updates }] = await Promise.all([
    supabase.from("sessions").select("*").eq("id", sessionId).single(),
    supabase
      .from("work_plan_tasks")
      .select("*")
      .eq("group_id", id)
      .order("task_order", { ascending: true }),
    supabase.from("session_task_updates").select("*").eq("session_id", sessionId),
  ]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl rounded-md border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold">Edit Session</h1>
        <div className="mt-6">
          <SessionEditor
            groupId={id}
            session={data as Session | null}
            tasks={(tasks ?? []) as WorkPlanTask[]}
            taskUpdates={(updates ?? []) as SessionTaskUpdate[]}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
