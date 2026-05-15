"use client";

import { supabase } from "@/lib/supabase";
import type { Session } from "@/types/database";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SessionEditor({
  groupId,
  session,
}: {
  groupId: string;
  session?: Session | null;
}) {
  const router = useRouter();
  const [sessionDate, setSessionDate] = useState(session?.session_date ?? "");
  const [planned, setPlanned] = useState(session?.planned ?? "");
  const [finished, setFinished] = useState(session?.finished ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    const payload = {
      group_id: groupId,
      session_date: sessionDate,
      planned,
      finished,
    };

    const result = session?.id
      ? await supabase.from("sessions").update(payload).eq("id", session.id)
      : await supabase.from("sessions").insert(payload);

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
      <label className="block text-sm font-medium">
        Planned Work
        <textarea value={planned ?? ""} onChange={(event) => setPlanned(event.target.value)} className="mt-2 min-h-28 w-full rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" required />
      </label>
      <label className="block text-sm font-medium">
        Finished Work
        <textarea value={finished ?? ""} onChange={(event) => setFinished(event.target.value)} className="mt-2 min-h-28 w-full rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" required />
      </label>
      <button disabled={saving} className="w-full rounded-md bg-slate-950 py-3 font-semibold text-white dark:bg-cyan-400 dark:text-slate-950">
        {saving ? "Saving..." : "Save Session"}
      </button>
    </form>
  );
}
