"use client";

import { supabase } from "@/lib/supabase";
import type { Group, Student } from "@/types/database";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StudentEditor({
  student,
  groups,
}: {
  student?: Student | null;
  groups: Group[];
}) {
  const router = useRouter();
  const [name, setName] = useState(student?.name ?? "");
  const [age, setAge] = useState(Number(student?.age ?? 10));
  const [groupId, setGroupId] = useState(student?.group_id ?? groups[0]?.id ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    const payload = { name: name.trim(), age, group_id: groupId };
    const result = student?.id
      ? await supabase.from("students").update(payload).eq("id", student.id)
      : await supabase.from("students").insert(payload);

    setSaving(false);
    if (!result.error) {
      router.push(student?.id ? "/students" : `/groups/${groupId}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium">Student Name</label>
        <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" required />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">
          Age
          <input type="number" min={4} value={age} onChange={(event) => setAge(Number(event.target.value))} className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
        </label>
        <label className="text-sm font-medium">
          Group
          <select value={groupId} onChange={(event) => setGroupId(event.target.value)} className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
            {groups.map((group) => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
        </label>
      </div>
      <button disabled={saving} className="w-full rounded-md bg-slate-950 py-3 font-semibold text-white dark:bg-cyan-400 dark:text-slate-950">
        {saving ? "Saving..." : "Save Student"}
      </button>
    </form>
  );
}
