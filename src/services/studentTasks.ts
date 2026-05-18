import { supabase } from "@/lib/supabase";
import type { StudentAssignment } from "@/types/database";

export async function createStudentAssignment(input: {
  groupId: string;
  title: string;
  description?: string;
  assignedTo?: string;
  dueDate?: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
}) {
  return supabase
    .from("student_assignments")
    .insert({
      group_id: input.groupId,
      title: input.title,
      description: input.description || null,
      assigned_to: input.assignedTo || null,
      due_date: input.dueDate || null,
      attachment_url: input.attachmentUrl || null,
      attachment_type: input.attachmentType || null,
    })
    .select("*")
    .single();
}

export async function createStudentAssignmentsForGroups(
  assignments: Array<{
    groupId: string;
    title: string;
    description?: string;
    assignedTo?: string;
    dueDate?: string;
    attachmentUrl?: string | null;
    attachmentType?: string | null;
  }>
) {
  return supabase
    .from("student_assignments")
    .insert(
      assignments.map((assignment) => ({
        group_id: assignment.groupId,
        title: assignment.title,
        description: assignment.description || null,
        assigned_to: assignment.assignedTo || null,
        due_date: assignment.dueDate || null,
        attachment_url: assignment.attachmentUrl || null,
        attachment_type: assignment.attachmentType || null,
      }))
    )
    .select("*");
}

export async function updateStudentAssignmentStatus(
  assignmentId: string,
  status: StudentAssignment["status"]
) {
  return supabase
    .from("student_assignments")
    .update({ status })
    .eq("id", assignmentId)
    .select("*")
    .single();
}

export async function deleteStudentAssignment(assignmentId: string) {
  return supabase.from("student_assignments").delete().eq("id", assignmentId);
}
