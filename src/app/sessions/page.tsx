import DashboardLayout from "@/components/layout/DashboardLayout";
import DeleteSessionButton from "@/components/DeleteSessionButton";
import { supabase } from "@/lib/supabase";
import { demoGroups, demoSessions } from "@/lib/mockData";
import type { Group, Session } from "@/types/database";
import { connection } from "next/server";

async function getRows<T>(table: string, fallback: T[]) {
  const { data, error } = await supabase.from(table).select("*");
  return (error ? fallback : data ?? []) as T[];
}

export default async function SessionsPage() {
  await connection();

  const [sessions, groups] = await Promise.all([
    getRows<Session>("sessions", demoSessions),
    getRows<Group>("groups", demoGroups),
  ]);
  const groupById = new Map(groups.map((group) => [group.id, group]));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sessions</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Session plans, finished work, and instructor development notes.</p>
        </div>
        <div className="space-y-4">
          {sessions.map((session) => (
            <article key={session.id} className="rounded-md border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{groupById.get(session.group_id)?.name ?? "Group"}</p>
                  <h2 className="text-xl font-bold">{session.session_date}</h2>
                </div>
                <a href={`/groups/${session.group_id}/sessions/${session.id}/edit`} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700">Edit</a>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-950/30">
                  <p className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-300">Planned</p>
                  <p className="mt-2 text-sm">{session.planned}</p>
                </div>
                <div className="rounded-md bg-emerald-50 p-4 dark:bg-emerald-950/30">
                  <p className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300">Finished</p>
                  <p className="mt-2 text-sm">{session.finished}</p>
                </div>
              </div>
              <div className="mt-4">
                <DeleteSessionButton sessionId={session.id} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
