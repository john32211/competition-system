"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { supabase } from "@/lib/supabase";
import type { Group, Project } from "@/types/database";
import { useEffect, useMemo, useState } from "react";

export default function ProjectsPage() {
  const { loading: profileLoading, profile, isAdmin } = useCurrentProfile();
  const [projects, setProjects] = useState<Project[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (profileLoading) return;

    let active = true;

    async function loadProjects() {
      setLoading(true);

      let groupQuery = supabase.from("groups").select("*").order("name", { ascending: true });
      if (!isAdmin && profile?.id) {
        groupQuery = groupQuery.eq("instructor_id", profile.id);
      }

      const { data: groupRows, error: groupError } = await groupQuery;
      const visibleGroups = (groupRows ?? []) as Group[];
      const groupIds = visibleGroups.map((group) => group.id);

      let projectRows: Project[] = [];
      let projectErrorMessage = "";

      if (groupIds.length > 0) {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .in("group_id", groupIds);
        projectRows = (data ?? []) as Project[];
        projectErrorMessage = error?.message ?? "";
      }

      if (!active) return;

      setGroups(visibleGroups);
      setProjects(projectRows);
      setMessage(groupError?.message ?? projectErrorMessage);
      setLoading(false);
    }

    loadProjects();

    return () => {
      active = false;
    };
  }, [profileLoading, profile?.id, isAdmin]);

  const groupById = useMemo(() => new Map(groups.map((group) => [String(group.id), group])), [groups]);
  const filtered = projects.filter((project) => {
    const matchesStatus = !status || project.status === status;
    const matchesSearch = (project.title ?? "").toLowerCase().includes(q.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {isAdmin ? "All project workflows." : "Projects for your assigned groups only."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1fr_220px]">
          <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search projects" className="rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
            <option value="">All statuses</option>
            {["Planning", "Wiring", "Coding", "Testing", "Finished"].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        {message ? <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">{message}</div> : null}

        {loading ? (
          <div className="rounded-md border border-slate-200 bg-white p-6 text-slate-500 dark:border-slate-800 dark:bg-slate-900">Loading projects...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-md border border-slate-200 bg-white p-6 text-slate-500 dark:border-slate-800 dark:bg-slate-900">No projects found.</div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {filtered.map((project) => (
              <article key={project.id} className="rounded-md border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">{project.title}</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {groupById.get(String(project.group_id))?.name ?? "Unassigned group"}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold dark:bg-slate-800">{project.status}</span>
                </div>
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{project.description}</p>
                <a href={`/groups/${project.group_id}/project`} className="mt-5 inline-block rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-700">
                  Update project
                </a>
              </article>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
