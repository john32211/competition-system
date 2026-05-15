"use client";

import { supabase } from "@/lib/supabase";
import RoleNotice from "@/components/RoleNotice";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import type { Group } from "@/types/database";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GroupEditor({ group }: { group?: Group | null }) {
  const router = useRouter();
  const { loading: profileLoading, isAdmin } = useCurrentProfile();
  const [name, setName] = useState(group?.name ?? "");
  const [instructor, setInstructor] = useState(group?.instructor ?? "");
  const [session, setSession] = useState(group?.session ?? "");
  const [progress, setProgress] = useState(Number(group?.progress ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!isAdmin) {
      setError("Only admins can create or edit groups.");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      name: name.trim(),
      instructor: instructor.trim(),
      session: session.trim(),
      progress: Math.min(Math.max(progress, 0), 100),
    };

    const result = group?.id
      ? await supabase.from("groups").update(payload).eq("id", group.id)
      : await supabase.from("groups").insert(payload);

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    router.push(group?.id ? `/groups/${group.id}` : "/groups");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!profileLoading && !isAdmin ? (
        <RoleNotice
          title="Admin access required"
          body="Instructors can manage their team work, sessions, projects, and attendance, but group administration is admin-only."
        />
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div>
        <label className="mb-2 block text-sm font-medium">Group Name</label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
          placeholder="Team Alpha"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">Instructor</label>
          <input
            value={instructor}
            onChange={(event) => setInstructor(event.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
            placeholder="Instructor name"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Session Time</label>
          <input
            value={session}
            onChange={(event) => setSession(event.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
            placeholder="Sunday - 5 PM"
            required
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Progress: {progress}%</label>
        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={(event) => setProgress(Number(event.target.value))}
          className="w-full"
        />
      </div>

      <button
        type="submit"
        disabled={saving || profileLoading || !isAdmin}
        className="w-full rounded-md bg-slate-950 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-cyan-400 dark:text-slate-950"
      >
        {saving ? "Saving..." : group?.id ? "Save Group" : "Create Group"}
      </button>
    </form>
  );
}
