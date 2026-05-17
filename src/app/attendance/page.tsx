"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { supabase } from "@/lib/supabase";
import type { Group, Session, Student } from "@/types/database";
import { useEffect, useMemo, useState } from "react";

type AttendanceDraft = Record<string, "present" | "absent">;
type SessionAttendanceRow = {
  session_id: number | string;
  student_id: number | string;
  present: boolean;
};

export default function AttendancePage() {
  const { loading: profileLoading, profile, isAdmin } = useCurrentProfile();
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [groupId, setGroupId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [draft, setDraft] = useState<AttendanceDraft>({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (profileLoading) return;

    let active = true;

    async function load() {
      let groupQuery = supabase.from("groups").select("*").order("name", { ascending: true });
      if (!isAdmin && profile?.id) {
        groupQuery = groupQuery.eq("instructor_id", profile.id);
      }

      const { data: groupRows, error: groupsError } = await groupQuery;
      const nextGroups = (groupRows ?? []) as Group[];
      const groupIds = nextGroups.map((group) => group.id);

      let nextStudents: Student[] = [];
      let nextSessions: Session[] = [];
      let studentsErrorMessage = "";
      let sessionsErrorMessage = "";

      if (groupIds.length > 0) {
        const [{ data: studentRows, error: studentsError }, { data: sessionRows, error: sessionsError }] =
          await Promise.all([
            supabase.from("students").select("*").in("group_id", groupIds),
            supabase.from("sessions").select("*").in("group_id", groupIds),
          ]);

        nextStudents = (studentRows ?? []) as Student[];
        nextSessions = (sessionRows ?? []) as Session[];
        studentsErrorMessage = studentsError?.message ?? "";
        sessionsErrorMessage = sessionsError?.message ?? "";
      }

      if (!active) return;

      setGroups(nextGroups);
      setStudents(nextStudents);
      setSessions(nextSessions);
      setGroupId(String(nextGroups[0]?.id ?? ""));
      setMessage(groupsError?.message ?? studentsErrorMessage ?? sessionsErrorMessage);
    }

    load();

    return () => {
      active = false;
    };
  }, [profileLoading, profile?.id, isAdmin]);

  const groupSessions = useMemo(
    () => sessions.filter((session) => String(session.group_id) === groupId),
    [sessions, groupId]
  );
  const groupStudents = useMemo(
    () => students.filter((student) => String(student.group_id) === groupId),
    [students, groupId]
  );
  const selectedSessionId = sessionId || String(groupSessions[0]?.id ?? "");

  useEffect(() => {
    let active = true;

    async function loadSavedAttendance() {
      if (!selectedSessionId || groupStudents.length === 0) {
        return;
      }

      const { data, error } = await supabase
        .from("session_attendance")
        .select("session_id, student_id, present")
        .eq("session_id", selectedSessionId);

      if (!active) return;

      if (error) {
        setMessage(`Attendance table issue: ${error.message}`);
        setDraft(Object.fromEntries(groupStudents.map((student) => [String(student.id), "present"])));
        return;
      }

      const saved = new Map<string, "present" | "absent">(
        ((data ?? []) as SessionAttendanceRow[]).map((row) => [
          String(row.student_id),
          row.present ? "present" : "absent",
        ])
      );

      setDraft(
        Object.fromEntries(
          groupStudents.map((student) => [
            String(student.id),
            saved.get(String(student.id)) ?? "present",
          ])
        )
      );
    }

    loadSavedAttendance();

    return () => {
      active = false;
    };
  }, [selectedSessionId, groupStudents]);

  const attendanceRate = useMemo(() => {
    const statuses = groupStudents.map((student) => draft[String(student.id)] ?? "present");
    const present = statuses.filter((status) => status === "present").length;
    return Math.round((present / Math.max(statuses.length, 1)) * 100);
  }, [draft, groupStudents]);

  async function saveAttendance() {
    if (!selectedSessionId) {
      setMessage("Select a session before saving attendance.");
      return;
    }

    const rows = groupStudents.map((student) => ({
      session_id: selectedSessionId,
      student_id: student.id,
      present: (draft[String(student.id)] ?? "present") === "present",
    }));

    const { error } = await supabase.from("session_attendance").upsert(rows, {
      onConflict: "session_id,student_id",
    });

    setMessage(error ? error.message : "Attendance saved.");
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Attendance</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {isAdmin ? "Mark attendance for all teams." : "Mark attendance for your assigned teams only."}
          </p>
        </div>

        <section className="grid grid-cols-1 gap-4 rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-3">
          <label className="text-sm font-medium">
            Group
            <select value={groupId} onChange={(event) => {
              setGroupId(event.target.value);
              setSessionId("");
              setMessage("");
            }} className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
              {groups.map((group) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Session
            <select value={selectedSessionId} onChange={(event) => setSessionId(event.target.value)} className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
              {groupSessions.map((session) => (
                <option key={session.id} value={String(session.id)}>{session.session_date}</option>
              ))}
            </select>
          </label>
          <div className="rounded-md bg-cyan-50 p-4 dark:bg-cyan-950/30">
            <p className="text-sm text-slate-500 dark:text-slate-400">Current attendance rate</p>
            <p className="mt-1 text-3xl font-bold">{attendanceRate}%</p>
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {groupStudents.map((student) => (
            <div key={student.id} className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 last:border-0 dark:border-slate-800 md:flex-row md:items-center">
              <div>
                <p className="font-semibold">{student.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Student ID {student.id}</p>
              </div>
              <div className="inline-flex rounded-md border border-slate-200 p-1 dark:border-slate-700">
                {(["present", "absent"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setDraft((value) => ({ ...value, [String(student.id)]: status }))}
                    className={`rounded px-4 py-2 text-sm font-semibold ${
                      (draft[String(student.id)] ?? "present") === status
                        ? "bg-slate-950 text-white dark:bg-cyan-400 dark:text-slate-950"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

        <div className="flex flex-col items-start gap-3 md:flex-row md:items-center">
          <button onClick={saveAttendance} className="rounded-md bg-slate-950 px-5 py-3 font-semibold text-white dark:bg-cyan-400 dark:text-slate-950">
            Save Attendance
          </button>
          {message ? <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p> : null}
        </div>
      </div>
    </DashboardLayout>
  );
}
