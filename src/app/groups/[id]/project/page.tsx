"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  const [groupId, setGroupId] = useState("");

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [status, setStatus] =
    useState("Planning");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadProject() {
      const resolvedParams = await params;

      setGroupId(resolvedParams.id);

      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("group_id", resolvedParams.id)
        .single();

      if (data) {
        setTitle(data.title || "");
        setDescription(
          data.description || ""
        );
        setStatus(data.status || "Planning");
      }

      setLoading(false);
    }

    loadProject();
  }, [params]);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const { data: existingProject } =
      await supabase
        .from("projects")
        .select("*")
        .eq("group_id", groupId)
        .single();

    if (existingProject) {
      await supabase
        .from("projects")
        .update({
          title,
          description,
          status,
        })
        .eq("group_id", groupId);
    } else {
      await supabase
        .from("projects")
        .insert({
          group_id: groupId,
          title,
          description,
          status,
        });
    }

    router.push(`/groups/${groupId}`);
    router.refresh();
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div>Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow p-8">
          <h1 className="text-3xl font-bold mb-8">
            Manage Project
          </h1>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div>
              <label className="block mb-2 font-medium">
                Project Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                className="w-full border border-slate-300 rounded-xl px-4 py-3"
                placeholder="Smart Parking System"
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                className="w-full border border-slate-300 rounded-xl px-4 py-3 min-h-[150px]"
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Status
              </label>

              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value)
                }
                className="w-full border border-slate-300 rounded-xl px-4 py-3"
              >
                <option>
                  Planning
                </option>

                <option>
                  Wiring
                </option>

                <option>
                  Coding
                </option>

                <option>
                  Testing
                </option>

                <option>
                  Finished
                </option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 text-white py-4 rounded-xl"
            >
              Save Project
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}