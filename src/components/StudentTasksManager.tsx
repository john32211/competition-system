"use client";

import { uploadCompetitionFile } from "@/services/storage";
import {
  createStudentAssignment,
  deleteStudentAssignment,
  updateStudentAssignmentStatus,
} from "@/services/studentTasks";
import type { Student, StudentAssignment } from "@/types/database";
import { ExternalLink, FileUp, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StudentTasksManager({
  groupId,
  students,
  initialAssignments,
}: {
  groupId: string;
  students: Student[];
  initialAssignments: StudentAssignment[];
}) {
  const router = useRouter();
  const [assignments, setAssignments] = useState(initialAssignments);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function addAssignment(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    let attachmentUrl: string | null = null;
    let attachmentType: string | null = null;

    if (attachment) {
      const upload = await uploadCompetitionFile(attachment, "tasks", groupId);

      if (upload.error) {
        setSaving(false);
        setMessage(upload.error.message);
        return;
      }

      attachmentUrl = upload.publicUrl;
      attachmentType = attachment.type || "file";
    }

    const result = await createStudentAssignment({
      groupId,
      title: title.trim(),
      description: description.trim(),
      assignedTo,
      dueDate,
      attachmentUrl,
      attachmentType,
    });

    setSaving(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (result.data) {
      setAssignments((current) => [...current, result.data as StudentAssignment]);
    }

    setTitle("");
    setDescription("");
    setAssignedTo("");
    setDueDate("");
    setAttachment(null);
    setMessage("Student task added.");
    router.refresh();
  }

  async function changeStatus(
    assignmentId: string,
    status: StudentAssignment["status"]
  ) {
    const { data, error } = await updateStudentAssignmentStatus(assignmentId, status);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data) {
      setAssignments((current) =>
        current.map((assignment) =>
          String(assignment.id) === String(assignmentId)
            ? (data as StudentAssignment)
            : assignment
        )
      );
    }
  }

  async function removeAssignment(assignmentId: string) {
    const confirmed = confirm("Delete this student task?");
    if (!confirmed) return;

    const { error } = await deleteStudentAssignment(assignmentId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setAssignments((current) =>
      current.filter((assignment) => String(assignment.id) !== String(assignmentId))
    );
    router.refresh();
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h2 className="text-xl font-semibold">Student Tasks</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Assign homework, documents, photos, or follow-up tasks for students during the competition.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {assignments.length === 0 ? (
          <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            No student tasks yet.
          </div>
        ) : (
          assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="grid grid-cols-1 gap-3 rounded-md border border-slate-200 p-4 dark:border-slate-800 md:grid-cols-[1fr_auto]"
            >
              <div>
                <p className="font-semibold">{assignment.title}</p>
                {assignment.description ? (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {assignment.description}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {assignment.assigned_to ? <span>Assigned: {assignment.assigned_to}</span> : null}
                  {assignment.due_date ? <span>Due: {assignment.due_date}</span> : null}
                  <span className="capitalize">Status: {assignment.status}</span>
                </div>
                {assignment.attachment_url ? (
                  <a
                    href={assignment.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 dark:text-cyan-300"
                  >
                    Open attachment <ExternalLink size={14} />
                  </a>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <select
                  value={assignment.status}
                  onChange={(event) =>
                    changeStatus(
                      assignment.id,
                      event.target.value as StudentAssignment["status"]
                    )
                  }
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="open">Open</option>
                  <option value="submitted">Submitted</option>
                  <option value="reviewed">Reviewed</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeAssignment(assignment.id)}
                  className="inline-flex size-9 items-center justify-center rounded-md border border-red-200 text-red-600 dark:border-red-900"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={addAssignment} className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_160px_auto]">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Task for students"
          className="rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
          required
        />
        <select
          value={assignedTo}
          onChange={(event) => setAssignedTo(event.target.value)}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
        >
          <option value="">Whole team</option>
          {students.map((student) => (
            <option key={student.id} value={student.name}>
              {student.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
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
          placeholder="Task details"
          className="min-h-20 rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950 md:col-span-4"
        />
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300 md:col-span-4">
          <FileUp size={16} />
          <span>{attachment ? attachment.name : "Attach document or photo"}</span>
          <input
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
          />
        </label>
      </form>

      {message ? <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{message}</p> : null}
    </section>
  );
}
