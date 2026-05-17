"use client";

import { supabase } from "@/lib/supabase";
import { createGroupTask } from "@/services/workPlan";
import type { Session, SessionTaskUpdate, WorkPlanTask } from "@/types/database";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SessionEditor({
  groupId,
  session,
  tasks = [],
  taskUpdates = [],
}: {
  groupId: string;
  session?: Session | null;
  tasks?: WorkPlanTask[];
  taskUpdates?: SessionTaskUpdate[];
}) {
  const router = useRouter();
  const [workPlanItems, setWorkPlanItems] = useState(tasks);
  const [newWorkPlanTitle, setNewWorkPlanTitle] = useState("");
  const [newWorkPlanDescription, setNewWorkPlanDescription] = useState("");
  const [message, setMessage] = useState("");
  const [sessionDate, setSessionDate] = useState(session?.session_date ?? "");
  const [taskState, setTaskState] = useState(
    Object.fromEntries(
      workPlanItems.map((task) => {
        const update = taskUpdates.find((item) => String(item.task_id) === String(task.id));
        return [
          String(task.id),
          {
            planned: update?.planned ?? false,
            status: update?.status ?? "not_started",
            completion_percent: update?.completion_percent ?? 0,
            comment: update?.comment ?? "",
            assigned_to: update?.assigned_to ?? "",
          },
        ];
      })
    ) as Record<
      string,
      {
        planned: boolean;
        status: "not_started" | "in_progress" | "finished";
        completion_percent: number;
        comment: string;
        assigned_to: string;
      }
    >
  );
  const [saving, setSaving] = useState(false);
  const plannedTasks = workPlanItems.filter((task) => taskState[String(task.id)]?.planned);

  async function addWorkPlanItem() {
    if (!newWorkPlanTitle.trim()) return;

    setSaving(true);
    setMessage("");

    const result = await createGroupTask({
      groupId,
      title: newWorkPlanTitle.trim(),
      description: newWorkPlanDescription.trim(),
      taskOrder: workPlanItems.length + 1,
    });

    setSaving(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (result.data) {
      const nextItem = result.data as WorkPlanTask;
      setWorkPlanItems((current) => [...current, nextItem]);
      setTaskState((current) => ({
        ...current,
        [String(nextItem.id)]: {
          planned: true,
          status: "not_started",
          completion_percent: 0,
          comment: "",
          assigned_to: "",
        },
      }));
    }

    setNewWorkPlanTitle("");
    setNewWorkPlanDescription("");
    setMessage("Work-plan item added and selected for this session.");
    router.refresh();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    const payload = {
      group_id: groupId,
      session_date: sessionDate,
      planned: workPlanItems
        .filter((task) => taskState[String(task.id)]?.planned)
        .map((task) => task.title)
        .join(", "),
      finished: workPlanItems
        .filter((task) => (taskState[String(task.id)]?.completion_percent ?? 0) > 0)
        .map((task) => {
          const state = taskState[String(task.id)];
          return `${task.title}: ${state.completion_percent}%`;
        })
        .join(", "),
    };

    const result = session?.id
      ? await supabase.from("sessions").update(payload).eq("id", session.id).select("id").single()
      : await supabase.from("sessions").insert(payload).select("id").single();

    const savedSessionId = session?.id ?? result.data?.id;

    if (!result.error && savedSessionId && workPlanItems.length > 0) {
      const rows = workPlanItems.map((task) => {
        const state = taskState[String(task.id)] ?? {
          planned: false,
          status: "not_started",
          completion_percent: 0,
          comment: "",
          assigned_to: "",
        };

        return {
          session_id: savedSessionId,
          task_id: task.id,
          planned: state.planned,
          status: state.status,
          completion_percent: state.completion_percent,
          comment: state.comment || null,
          assigned_to: state.assigned_to || null,
        };
      });

      await supabase.from("session_task_updates").upsert(rows, {
        onConflict: "session_id,task_id",
      });
    }

    setSaving(false);
    if (!result.error) {
      router.push(`/groups/${groupId}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block text-sm font-medium">
        Session Date
        <input type="date" value={sessionDate} onChange={(event) => setSessionDate(event.target.value)} className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" required />
      </label>

      <div className="space-y-6">
        <section className="space-y-3">
          <div>
            <h2 className="font-semibold">Planned Work</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Choose from the group work plan, or add a new work-plan item here.
            </p>
          </div>

          <div className="rounded-md border border-slate-200 p-4 dark:border-slate-800">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
              <input
                value={newWorkPlanTitle}
                onChange={(event) => setNewWorkPlanTitle(event.target.value)}
                placeholder="Add planned work item"
                className="rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              />
              <button
                type="button"
                onClick={addWorkPlanItem}
                disabled={saving}
                className="rounded-md bg-slate-950 px-4 py-2 font-semibold text-white disabled:opacity-60 dark:bg-cyan-400 dark:text-slate-950"
              >
                Add to workflow
              </button>
              <textarea
                value={newWorkPlanDescription}
                onChange={(event) => setNewWorkPlanDescription(event.target.value)}
                placeholder="Optional details"
                className="min-h-20 rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950 md:col-span-2"
              />
            </div>
          </div>

          {workPlanItems.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-3">
                {workPlanItems.map((task) => {
                  const state = taskState[String(task.id)] ?? {
                    planned: false,
                    status: "not_started",
                    completion_percent: 0,
                    comment: "",
                    assigned_to: "",
                  };

                  return (
                    <label
                      key={task.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 transition ${
                        state.planned
                          ? "border-cyan-300 bg-cyan-50 dark:border-cyan-800 dark:bg-cyan-950/30"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={state.planned}
                        onChange={(event) =>
                          setTaskState((value) => ({
                            ...value,
                            [String(task.id)]: {
                              ...state,
                              planned: event.target.checked,
                              status: event.target.checked ? state.status : "not_started",
                              completion_percent: event.target.checked ? state.completion_percent : 0,
                              comment: event.target.checked ? state.comment : "",
                            },
                          }))
                        }
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-semibold">{task.title}</span>
                        {task.description ? (
                          <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">
                            {task.description}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
              No work-plan items yet. Add the first planned-work item above.
            </div>
          )}
        </section>

        <section className="space-y-3">
            <div>
              <h2 className="font-semibold">Finished Work</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                For the planned items, mark whether each one was finished or partially completed.
              </p>
            </div>

            {plannedTasks.length === 0 ? (
              <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                Select planned work above to record finished work.
              </div>
            ) : null}

            {plannedTasks.map((task) => {
              const state = taskState[String(task.id)] ?? {
                planned: true,
                status: "not_started",
                completion_percent: 0,
                comment: "",
                assigned_to: "",
              };

              return (
                <div key={task.id} className="rounded-md border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <p className="font-semibold">{task.title}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {state.completion_percent >= 100
                          ? "Finished"
                          : state.completion_percent > 0
                            ? "Partially finished"
                            : "Not finished yet"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setTaskState((value) => ({
                          ...value,
                          [String(task.id)]: {
                            ...state,
                            completion_percent: 100,
                            status: "finished",
                          },
                        }))
                      }
                      className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700"
                    >
                      Mark 100%
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3">
                    <label className="text-sm font-medium">
                      Finished percentage: {state.completion_percent}%
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={state.completion_percent}
                        onChange={(event) => {
                          const percent = Number(event.target.value);
                          setTaskState((value) => ({
                            ...value,
                            [String(task.id)]: {
                              ...state,
                              planned: true,
                              completion_percent: percent,
                              status:
                                percent >= 100
                                  ? "finished"
                                  : percent > 0
                                    ? "in_progress"
                                    : "not_started",
                            },
                          }));
                        }}
                        className="mt-2 w-full"
                      />
                    </label>

                    {state.completion_percent < 100 ? (
                      <input
                        value={state.comment}
                        onChange={(event) =>
                          setTaskState((value) => ({
                            ...value,
                            [String(task.id)]: { ...state, comment: event.target.value },
                          }))
                        }
                        placeholder="What did you finish from it?"
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
        </section>
      </div>
      {message ? <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p> : null}
      <button disabled={saving} className="w-full rounded-md bg-slate-950 py-3 font-semibold text-white dark:bg-cyan-400 dark:text-slate-950">
        {saving ? "Saving..." : "Save Session"}
      </button>
    </form>
  );
}
