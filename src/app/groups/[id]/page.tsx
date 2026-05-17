import DashboardLayout from "@/components/layout/DashboardLayout";
import DeleteComponentButton from "@/components/DeleteComponentButton";
import DeleteSessionButton from "@/components/DeleteSessionButton";
import DeleteStudentButton from "@/components/DeleteStudentButton";
import StudentTasksManager from "@/components/StudentTasksManager";
import WorkPlanManager from "@/components/WorkPlanManager";
import { supabase } from "@/lib/supabase";
import type {
  CompetitionType,
  ComponentRequirement,
  Group,
  Project,
  Session,
  SessionTaskUpdate,
  Student,
  StudentAssignment,
  WorkPlanTask,
} from "@/types/database";
import Link from "next/link";
import { connection } from "next/server";

export default async function GroupDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();

  const { id: groupId } = await params;

  const [
    { data: group },
    { data: students },
    { data: project },
    { data: components },
    { data: sessions },
    { data: tasks },
    { data: assignments },
  ] = await Promise.all([
    supabase.from("groups").select("*").eq("id", groupId).single(),
    supabase.from("students").select("*").eq("group_id", groupId).order("name"),
    supabase.from("projects").select("*").eq("group_id", groupId).maybeSingle(),
    supabase.from("components").select("*").eq("group_id", groupId),
    supabase.from("sessions").select("*").eq("group_id", groupId).order("id", { ascending: false }),
    supabase
      .from("work_plan_tasks")
      .select("*")
      .eq("group_id", groupId)
      .order("task_order", { ascending: true }),
    supabase
      .from("student_assignments")
      .select("*")
      .eq("group_id", groupId)
      .order("id", { ascending: false }),
  ]);

  const sessionIds = ((sessions ?? []) as Session[]).map((session) => session.id);
  const { data: taskUpdates } =
    sessionIds.length > 0
      ? await supabase.from("session_task_updates").select("*").in("session_id", sessionIds)
      : { data: [] };

  if (!group) {
    return (
      <DashboardLayout>
        <div className="rounded-md border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          Group not found
        </div>
      </DashboardLayout>
    );
  }

  const typedGroup = group as Group;
  const competitionType = (typedGroup.competition_type ?? "robotics") as CompetitionType;
  const taskRows = (tasks ?? []) as WorkPlanTask[];
  const updateRows = (taskUpdates ?? []) as SessionTaskUpdate[];
  const taskById = new Map(taskRows.map((task) => [String(task.id), task]));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold">{typedGroup.name}</h1>
                <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold capitalize text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200">
                  {competitionType === "coding" ? "Coding only" : "Robotics"}
                </span>
              </div>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                Instructor: {typedGroup.instructor ?? "Unassigned"}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Session: {typedGroup.session ?? "Not scheduled"}
              </p>
            </div>

            <div className="min-w-44 text-left md:text-right">
              <p className="text-sm text-slate-500 dark:text-slate-400">Overall Progress</p>
              <h2 className="text-4xl font-bold text-emerald-500">{typedGroup.progress ?? 0}%</h2>
            </div>
          </div>

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${Math.min(Number(typedGroup.progress ?? 0), 100)}%` }}
            />
          </div>
        </section>

        <WorkPlanManager
          groupId={groupId}
          competitionType={competitionType}
          initialTasks={taskRows}
        />

        <StudentTasksManager
          groupId={groupId}
          students={(students ?? []) as Student[]}
          initialAssignments={(assignments ?? []) as StudentAssignment[]}
        />

        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Students</h2>
            <Link href={`/groups/${groupId}/students/add`} className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-cyan-400 dark:text-slate-950">
              Add Student
            </Link>
          </div>
          <div className="space-y-3">
            {((students ?? []) as Student[]).map((student) => (
              <div key={student.id} className="flex items-center justify-between rounded-md border border-slate-200 p-4 dark:border-slate-800">
                <div>
                  <p className="font-semibold">{student.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Age: {student.age ?? "N/A"}</p>
                </div>
                <DeleteStudentButton studentId={student.id} />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Project</h2>
            <Link href={`/groups/${groupId}/project`} className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-cyan-400 dark:text-slate-950">
              Manage Project
            </Link>
          </div>

          {project ? (
            <div className="space-y-3">
              <h3 className="text-2xl font-semibold">{(project as Project).title}</h3>
              <p className="text-slate-600 dark:text-slate-300">{(project as Project).description}</p>
              <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                {(project as Project).status}
              </span>
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">No project assigned yet.</p>
          )}
        </section>

        {competitionType === "robotics" ? (
          <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Components</h2>
              <Link href={`/groups/${groupId}/components/add`} className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-cyan-400 dark:text-slate-950">
                Add Component
              </Link>
            </div>

            <div className="space-y-3">
              {((components ?? []) as ComponentRequirement[]).map((component) => {
                const missing = Math.max(Number(component.needed ?? 0) - Number(component.available ?? 0), 0);
                return (
                  <div key={component.id} className="flex flex-col justify-between gap-3 rounded-md border border-slate-200 p-4 dark:border-slate-800 md:flex-row md:items-center">
                    <div>
                      <p className="font-semibold">{component.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Needed: {component.needed} | Available: {component.available}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${missing > 0 ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"}`}>
                        {missing > 0 ? `Missing ${missing}` : "Available"}
                      </span>
                      <DeleteComponentButton componentId={component.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Session Tracking</h2>
            <Link href={`/groups/${groupId}/sessions/add`} className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-cyan-400 dark:text-slate-950">
              Add Session
            </Link>
          </div>

          <div className="space-y-5">
            {((sessions ?? []) as Session[]).map((session) => {
              const updates = updateRows.filter((update) => String(update.session_id) === String(session.id));
              return (
                <article key={session.id} className="rounded-md border border-slate-200 p-5 dark:border-slate-800">
                  <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <h3 className="text-lg font-semibold">{session.session_date}</h3>
                    <div className="flex gap-2">
                      <Link href={`/groups/${groupId}/sessions/${session.id}/edit`} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700">
                        Edit
                      </Link>
                      <DeleteSessionButton sessionId={session.id} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-950/30">
                      <p className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-300">Planned Work</p>
                      <p className="mt-2 text-sm">{session.planned}</p>
                    </div>
                    <div className="rounded-md bg-emerald-50 p-4 dark:bg-emerald-950/30">
                      <p className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300">Finished Work</p>
                      <p className="mt-2 text-sm">{session.finished}</p>
                    </div>
                  </div>

                  {updates.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-semibold">Work-plan progress</p>
                      {updates.map((update) => (
                        <div key={update.id} className="rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-950">
                          <p className="font-medium">
                            {taskById.get(String(update.task_id))?.title ?? "Task"}:{" "}
                            <span className="capitalize">{update.status.replace("_", " ")}</span>
                            {typeof update.completion_percent === "number"
                              ? ` (${update.completion_percent}%)`
                              : ""}
                          </p>
                          {update.planned ? (
                            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
                              Planned in this session
                            </p>
                          ) : null}
                          {update.comment ? <p className="mt-1 text-slate-500 dark:text-slate-400">{update.comment}</p> : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
