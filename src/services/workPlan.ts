import { supabase } from "@/lib/supabase";
import type { CompetitionType, SessionTaskUpdate, WorkPlanTask } from "@/types/database";

export const roboticsDefaultTasks = [
  "Define robot objective and rules",
  "Create wiring plan",
  "Collect components",
  "Build chassis and circuit",
  "Upload Arduino base code",
  "Test sensors and actuators",
  "Final run and presentation",
];

export const codingDefaultTasks = [
  "Understand problem statement",
  "Design algorithm",
  "Implement solution",
  "Test sample cases",
  "Handle edge cases",
  "Refactor and document code",
  "Final submission review",
];

export function defaultTasksForType(type: CompetitionType) {
  return type === "coding" ? codingDefaultTasks : roboticsDefaultTasks;
}

export async function getGroupTasks(groupId: string) {
  const { data, error } = await supabase
    .from("work_plan_tasks")
    .select("*")
    .eq("group_id", groupId)
    .order("task_order", { ascending: true });

  return { tasks: (data ?? []) as WorkPlanTask[], error };
}

export async function createGroupTask(input: {
  groupId: string;
  title: string;
  description?: string;
  phase?: string;
  taskOrder: number;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
}) {
  return supabase.from("work_plan_tasks").insert({
    group_id: input.groupId,
    title: input.title,
    description: input.description || null,
    phase: input.phase || null,
    task_order: input.taskOrder,
    attachment_url: input.attachmentUrl || null,
    attachment_type: input.attachmentType || null,
  }).select("*").single();
}

export async function createGroupTasksForGroups(
  tasks: Array<{
    groupId: string;
    title: string;
    description?: string;
    phase?: string;
    taskOrder: number;
    attachmentUrl?: string | null;
    attachmentType?: string | null;
  }>
) {
  return supabase
    .from("work_plan_tasks")
    .insert(
      tasks.map((task) => ({
        group_id: task.groupId,
        title: task.title,
        description: task.description || null,
        phase: task.phase || null,
        task_order: task.taskOrder,
        attachment_url: task.attachmentUrl || null,
        attachment_type: task.attachmentType || null,
      }))
    )
    .select("*");
}

export async function seedDefaultTasks(groupId: string, type: CompetitionType) {
  const tasks = defaultTasksForType(type).map((title, index) => ({
    group_id: groupId,
    title,
    task_order: index + 1,
    phase: type === "coding" ? "Coding track" : "Robotics track",
  }));

  return supabase.from("work_plan_tasks").insert(tasks).select("*");
}

export async function deleteGroupTask(taskId: string) {
  return supabase.from("work_plan_tasks").delete().eq("id", taskId);
}

export async function getSessionTaskUpdates(sessionId: string) {
  const { data, error } = await supabase
    .from("session_task_updates")
    .select("*")
    .eq("session_id", sessionId);

  return { updates: (data ?? []) as SessionTaskUpdate[], error };
}
