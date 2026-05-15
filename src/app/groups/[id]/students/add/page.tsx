"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
export default function AddStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  const [groupId, setGroupId] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState(10);

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setGroupId(resolvedParams.id);
    }

    loadParams();
  }, [params]);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    await supabase.from("students").insert({
      group_id: groupId,
      name,
      age,
    });

    router.push(`/groups/${groupId}`);
    router.refresh();
  }

  return (
    <AuthGuard>
    <DashboardLayout>
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-3xl shadow p-8">
          <h1 className="text-3xl font-bold mb-8">
            Add Student
          </h1>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div>
              <label className="block mb-2 font-medium">
                Student Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                className="w-full border border-slate-300 rounded-xl px-4 py-3"
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Age
              </label>

              <input
                type="number"
                value={age}
                onChange={(e) =>
                  setAge(Number(e.target.value))
                }
                className="w-full border border-slate-300 rounded-xl px-4 py-3"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 text-white py-4 rounded-xl"
            >
              Add Student
            </button>
          </form>
        </div>
      </div>

    </DashboardLayout>
    </AuthGuard>
  );
}