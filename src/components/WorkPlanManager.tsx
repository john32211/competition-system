"use client";

import {
  createGroupTask,
  deleteGroupTask,
  seedDefaultTasks,
} from "@/services/workPlan";
import type { CompetitionType, WorkPlanTask } from "@/types/database";
import { ListChecks, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WorkPlanManager({
  groupId,
  competitionType,
  initialTasks,
}: {
  groupId: string;
  competitionType: CompetitionType;
  initialTasks: WorkPlanTask[];
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function addTask(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    const result = await createGroupTask({
      groupId,
      title: title.trim(),
      description: description.trim(),
      phase: phase.trim(),
      taskOrder: tasks.length + 1,
    });
    setSaving(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (result.data) {
      setTasks((current) => [...current, result.data as WorkPlanTask]);
    }

    setTitle("");
    setDescription("");
    setPhase("");
    setMessage("Work-plan item added.");
    router.refresh();
  }

  async function seedTasks() {
    setSaving(true);
    const { data, error } = await seedDefaultTasks(groupId, competitionType);
    setSaving(false);

    if (data) {
      setTasks((current) => [...current, ...((data ?? []) as WorkPlanTask[])]);
    }

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Default plan created.");
    router.refresh();
  }

  async function removeTask(taskId: string) {
    const confirmed = confirm("Delete this work-plan task?");
    if (!confirmed) return;
    const { error } = await deleteGroupTask(taskId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setTasks((current) => current.filter((task) => String(task.id) !== String(taskId)));
    router.refresh();
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <div className="flex items-center gap-2">
            <ListChecks size={20} />
            <h2 className="text-xl font-semibold">Competition Work Plan</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {competitionType === "coding"
              ? "Roadmap items the team should complete across the coding competition."
              : "Roadmap items the team should complete across the robotics competition."}
          </p>
        </div>

        <button
          type="button"
          onClick={seedTasks}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-700"
        >
          <Sparkles size={16} />
          Add Default Plan
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {tasks.length === 0 ? (
          <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            No work plan assigned yet. Add roadmap items manually or start from the default {competitionType} plan.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="grid grid-cols-1 gap-3 rounded-md border border-slate-200 p-4 dark:border-slate-800 md:grid-cols-[auto_1fr_auto]"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200">
                {task.task_order}
              </span>
              <div>
                <p className="font-semibold">{task.title}</p>
                {task.phase ? (
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {task.phase}
                  </p>
                ) : null}
                {task.description ? (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {task.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => removeTask(task.id)}
                className="inline-flex size-9 items-center justify-center rounded-md border border-red-200 text-red-600 dark:border-red-900"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={addTask} className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_auto]">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add work-plan item"
          className="rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
          required
        />
        <input
          value={phase}
          onChange={(event) => setPhase(event.target.value)}
          placeholder="Phase"
          className="rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
        />
        <button
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 font-semibold text-white dark:bg-cyan-400 dark:text-slate-950"
        >
          <Plus size={16} />
          Add
        </button>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional task notes"
          className="min-h-20 rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950 md:col-span-3"
        />
      </form>

      {message ? <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{message}</p> : null}
    </section>
  );
}
