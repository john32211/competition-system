"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { supabase } from "@/lib/supabase";
import { createStudentAssignmentsForGroups } from "@/services/studentTasks";
import { uploadCompetitionFile } from "@/services/storage";
import { createGroupTasksForGroups } from "@/services/workPlan";
import type { Group, StudentAssignment, WorkPlanTask } from "@/types/database";
import { ClipboardList, FileUp, ListChecks } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function TasksPage() {
  const { loading: profileLoading, isAdmin } = useCurrentProfile();
  const [groups, setGroups] = useState<Group[]>([]);
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [workPlanItems, setWorkPlanItems] = useState<WorkPlanTask[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [workflowGroupIds, setWorkflowGroupIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [workflowTitle, setWorkflowTitle] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [workflowPhase, setWorkflowPhase] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingWorkflow, setSavingWorkflow] = useState(false);
  const [message, setMessage] = useState("");
  const [workflowMessage, setWorkflowMessage] = useState("");

  async function loadData() {
    const [
      { data: groupRows, error: groupError },
      { data: assignmentRows, error: assignmentError },
      { data: workPlanRows, error: workPlanError },
    ] =
      await Promise.all([
        supabase.from("groups").select("*").order("name", { ascending: true }),
        supabase
          .from("student_assignments")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(12),
        supabase
          .from("work_plan_tasks")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(12),
      ]);

    setGroups((groupRows ?? []) as Group[]);
    setAssignments((assignmentRows ?? []) as StudentAssignment[]);
    setWorkPlanItems((workPlanRows ?? []) as WorkPlanTask[]);
    setMessage(groupError?.message ?? assignmentError?.message ?? workPlanError?.message ?? "");
  }

  useEffect(() => {
    if (profileLoading || !isAdmin) {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [profileLoading, isAdmin]);

  const selectedGroups = useMemo(
    () => groups.filter((group) => selectedGroupIds.includes(String(group.id))),
    [groups, selectedGroupIds]
  );
  const selectedWorkflowGroups = useMemo(
    () => groups.filter((group) => workflowGroupIds.includes(String(group.id))),
    [groups, workflowGroupIds]
  );

  function toggleGroup(groupId: string) {
    setSelectedGroupIds((current) =>
      current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId]
    );
  }

  function toggleWorkflowGroup(groupId: string) {
    setWorkflowGroupIds((current) =>
      current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId]
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAdmin) {
      setMessage("Only admins can assign one task to multiple groups.");
      return;
    }

    if (!title.trim() || selectedGroupIds.length === 0) {
      setMessage("Add a task title and choose at least one group.");
      return;
    }

    setSaving(true);
    setMessage("");

    const rows = [];

    for (const groupId of selectedGroupIds) {
      let attachmentUrl: string | null = null;
      let attachmentType: string | null = null;

      if (file) {
        const upload = await uploadCompetitionFile(file, "tasks", groupId);

        if (upload.error) {
          setSaving(false);
          setMessage(upload.error.message);
          return;
        }

        attachmentUrl = upload.publicUrl;
        attachmentType = file.type || "file";
      }

      rows.push({
        groupId,
        title: title.trim(),
        description: description.trim(),
        assignedTo: "Whole team",
        dueDate,
        attachmentUrl,
        attachmentType,
      });
    }

    const { error } = await createStudentAssignmentsForGroups(rows);
    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setTitle("");
    setDescription("");
    setDueDate("");
    setFile(null);
    setSelectedGroupIds([]);
    setMessage(`Task assigned to ${rows.length} group${rows.length === 1 ? "" : "s"}.`);
    await loadData();
  }

  async function handleWorkflowSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAdmin) {
      setWorkflowMessage("Only admins can assign one workflow item to multiple groups.");
      return;
    }

    if (!workflowTitle.trim() || workflowGroupIds.length === 0) {
      setWorkflowMessage("Add a workflow title and choose at least one group.");
      return;
    }

    setSavingWorkflow(true);
    setWorkflowMessage("");

    const { data: existingRows, error: countError } = await supabase
      .from("work_plan_tasks")
      .select("group_id, task_order")
      .in("group_id", workflowGroupIds);

    if (countError) {
      setSavingWorkflow(false);
      setWorkflowMessage(countError.message);
      return;
    }

    const nextOrderByGroup = new Map<string, number>();
    for (const groupId of workflowGroupIds) {
      const maxOrder = ((existingRows ?? []) as Pick<WorkPlanTask, "group_id" | "task_order">[])
        .filter((task) => String(task.group_id) === groupId)
        .reduce((max, task) => Math.max(max, Number(task.task_order ?? 0)), 0);
      nextOrderByGroup.set(groupId, maxOrder + 1);
    }

    const { error } = await createGroupTasksForGroups(
      workflowGroupIds.map((groupId) => ({
        groupId,
        title: workflowTitle.trim(),
        description: workflowDescription.trim(),
        phase: workflowPhase.trim(),
        taskOrder: nextOrderByGroup.get(groupId) ?? 1,
      }))
    );

    setSavingWorkflow(false);

    if (error) {
      setWorkflowMessage(error.message);
      return;
    }

    setWorkflowTitle("");
    setWorkflowDescription("");
    setWorkflowPhase("");
    setWorkflowGroupIds([]);
    setWorkflowMessage(
      `Workflow item added to ${nextOrderByGroup.size} group${nextOrderByGroup.size === 1 ? "" : "s"}.`
    );
    await loadData();
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Admin workspace for assigning shared student tasks and shared work-plan items to multiple teams.
          </p>
        </div>

        {profileLoading ? (
          <div className="rounded-md border border-slate-200 bg-white p-6 text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            Loading tasks...
          </div>
        ) : !isAdmin ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            Instructor accounts can view tasks inside their assigned groups, but only admins can assign one task to many groups.
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
              <form onSubmit={handleSubmit} className="rounded-md border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-5 flex items-center gap-2">
                  <ClipboardList size={20} />
                  <h2 className="text-lg font-semibold">Bulk Task Assignment</h2>
                </div>

                <div className="space-y-4">
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Task title"
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                  />
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Task details for students"
                    rows={4}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                  />
                  <input
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    type="date"
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                  />
                  <label className="block rounded-md border border-dashed border-slate-300 p-4 text-sm dark:border-slate-700">
                    <span className="mb-2 flex items-center gap-2 font-semibold">
                      <FileUp size={16} /> Optional document or photo
                    </span>
                    <input
                      type="file"
                      onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                      className="w-full text-sm"
                    />
                  </label>

                  <button
                    disabled={saving}
                    className="w-full rounded-md bg-slate-950 py-3 font-semibold text-white disabled:opacity-50 dark:bg-cyan-400 dark:text-slate-950"
                  >
                    {saving ? "Assigning..." : "Assign to Selected Groups"}
                  </button>
                </div>

                {message ? <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{message}</p> : null}
              </form>

              <div className="rounded-md border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-lg font-semibold">Choose Groups</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {selectedGroups.length} selected
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedGroupIds(
                        selectedGroupIds.length === groups.length
                          ? []
                          : groups.map((group) => String(group.id))
                      )
                    }
                    className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-700"
                  >
                    {selectedGroupIds.length === groups.length ? "Clear All" : "Select All"}
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {groups.map((group) => (
                    <label
                      key={group.id}
                      className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 p-4 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950"
                    >
                      <input
                        type="checkbox"
                        checked={selectedGroupIds.includes(String(group.id))}
                        onChange={() => toggleGroup(String(group.id))}
                        className="mt-1 h-4 w-4"
                      />
                      <span>
                        <span className="block font-semibold">{group.name}</span>
                        <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                          {group.instructor ?? "Unassigned"} / {group.competition_type === "coding" ? "Coding only" : "Robotics"}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
              <form onSubmit={handleWorkflowSubmit} className="rounded-md border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-5 flex items-center gap-2">
                  <ListChecks size={20} />
                  <h2 className="text-lg font-semibold">Bulk Workflow Item</h2>
                </div>

                <div className="space-y-4">
                  <input
                    value={workflowTitle}
                    onChange={(event) => setWorkflowTitle(event.target.value)}
                    placeholder="Workflow item title"
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                  />
                  <input
                    value={workflowPhase}
                    onChange={(event) => setWorkflowPhase(event.target.value)}
                    placeholder="Phase, for example Wiring or Sprint 1"
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                  />
                  <textarea
                    value={workflowDescription}
                    onChange={(event) => setWorkflowDescription(event.target.value)}
                    placeholder="Workflow notes"
                    rows={4}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                  />

                  <button
                    disabled={savingWorkflow}
                    className="w-full rounded-md bg-slate-950 py-3 font-semibold text-white disabled:opacity-50 dark:bg-cyan-400 dark:text-slate-950"
                  >
                    {savingWorkflow ? "Adding..." : "Add Workflow to Selected Groups"}
                  </button>
                </div>

                {workflowMessage ? <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{workflowMessage}</p> : null}
              </form>

              <div className="rounded-md border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-lg font-semibold">Choose Workflow Groups</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {selectedWorkflowGroups.length} selected
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setWorkflowGroupIds(
                        workflowGroupIds.length === groups.length
                          ? []
                          : groups.map((group) => String(group.id))
                      )
                    }
                    className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-700"
                  >
                    {workflowGroupIds.length === groups.length ? "Clear All" : "Select All"}
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {groups.map((group) => (
                    <label
                      key={group.id}
                      className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 p-4 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950"
                    >
                      <input
                        type="checkbox"
                        checked={workflowGroupIds.includes(String(group.id))}
                        onChange={() => toggleWorkflowGroup(String(group.id))}
                        className="mt-1 h-4 w-4"
                      />
                      <span>
                        <span className="block font-semibold">{group.name}</span>
                        <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                          {group.instructor ?? "Unassigned"} / {group.competition_type === "coding" ? "Coding only" : "Robotics"}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div>
                  <h2 className="text-lg font-semibold">Recent Assigned Tasks</h2>
                  <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                    {assignments.length === 0 ? (
                      <p className="py-5 text-sm text-slate-500 dark:text-slate-400">No tasks assigned yet.</p>
                    ) : (
                      assignments.map((assignment) => (
                        <div key={assignment.id} className="grid grid-cols-1 gap-2 py-4 text-sm md:grid-cols-[1fr_120px] md:items-center">
                          <div>
                            <p className="font-semibold">{assignment.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {groups.find((group) => String(group.id) === String(assignment.group_id))?.name ?? "Team task"}
                            </p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-center text-xs font-semibold capitalize dark:bg-slate-800">
                            {assignment.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold">Recent Workflow Items</h2>
                  <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                    {workPlanItems.length === 0 ? (
                      <p className="py-5 text-sm text-slate-500 dark:text-slate-400">No workflow items added yet.</p>
                    ) : (
                      workPlanItems.map((item) => (
                        <div key={item.id} className="grid grid-cols-1 gap-2 py-4 text-sm md:grid-cols-[1fr_100px] md:items-center">
                          <div>
                            <p className="font-semibold">{item.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {groups.find((group) => String(group.id) === String(item.group_id))?.name ?? "Team workflow"}
                            </p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-center text-xs font-semibold dark:bg-slate-800">
                            #{item.task_order}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
