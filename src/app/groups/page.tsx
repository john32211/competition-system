"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import DeleteGroupButton from "@/components/DeleteGroupButton";
import { supabase } from "@/lib/supabase";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import type { Group } from "@/types/database";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function GroupsPage() {
  const { loading: profileLoading, profile, isAdmin } = useCurrentProfile();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [instructor, setInstructor] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (profileLoading) return;

    let active = true;

    async function loadGroups() {
      setLoading(true);

      let query = supabase.from("groups").select("*").order("name", { ascending: true });

      if (!isAdmin && profile?.id) {
        query = query.eq("instructor_id", profile.id);
      }

      const { data, error } = await query;

      if (!active) return;

      setGroups((data ?? []) as Group[]);
      setMessage(error?.message ?? "");
      setLoading(false);
    }

    loadGroups();

    return () => {
      active = false;
    };
  }, [profileLoading, profile?.id, isAdmin]);

  const instructors = useMemo(
    () => Array.from(new Set(groups.map((group) => group.instructor).filter(Boolean))),
    [groups]
  );

  const filteredGroups = groups.filter((group) => {
    const matchesSearch = group.name.toLowerCase().includes(q.toLowerCase());
    const matchesInstructor = !instructor || group.instructor === instructor;
    return matchesSearch && matchesInstructor;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold">Groups</h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              {isAdmin
                ? "Admin view: all competition teams."
                : "Instructor view: only teams assigned to your account."}
            </p>
          </div>
          {isAdmin ? (
            <Link href="/groups/add" className="rounded-md bg-slate-950 px-5 py-3 text-center font-semibold text-white transition hover:bg-slate-800 dark:bg-cyan-400 dark:text-slate-950">
              Add Group
            </Link>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1fr_240px]">
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search groups"
            className="rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
          />
          <select
            value={instructor}
            onChange={(event) => setInstructor(event.target.value)}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="">All instructors</option>
            {instructors.map((name) => (
              <option key={name ?? ""} value={name ?? ""}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {message ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            {message}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-md border border-slate-200 bg-white p-6 text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            Loading groups...
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="rounded-md border border-slate-200 bg-white p-6 text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            No assigned groups found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredGroups.map((group) => (
              <article key={group.id} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">{group.name}</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Instructor: {group.instructor ?? "Unassigned"}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase text-cyan-700 dark:text-cyan-300">
                      {group.competition_type === "coding" ? "Coding only" : "Robotics"}
                    </p>
                  </div>
                  <span className="rounded-full bg-cyan-100 px-3 py-1 text-sm font-semibold text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200">
                    {group.progress ?? 0}%
                  </span>
                </div>

                <div className="mt-5 text-sm text-slate-600 dark:text-slate-300">
                  Session: <span className="font-semibold">{group.session ?? "Not scheduled"}</span>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${group.progress ?? 0}%` }} />
                </div>

                <div className={`mt-5 grid gap-2 ${isAdmin ? "grid-cols-3" : "grid-cols-1"}`}>
                  <Link href={`/groups/${group.id}`} className="rounded-md border border-slate-200 py-2 text-center text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                    View
                  </Link>
                  {isAdmin ? (
                    <>
                      <Link href={`/groups/${group.id}/edit`} className="rounded-md border border-slate-200 py-2 text-center text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                        Edit
                      </Link>
                      <DeleteGroupButton groupId={group.id} />
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
