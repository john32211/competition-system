"use client";

import { supabase } from "@/lib/supabase";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { useRouter } from "next/navigation";

export default function DeleteGroupButton({
  groupId,
}: {
  groupId: string;
}) {
  const router = useRouter();
  const { loading, isAdmin } = useCurrentProfile();

  async function handleDelete() {
    if (!isAdmin) {
      alert("Only admins can delete groups.");
      return;
    }

    const confirmed = confirm(
      "Delete this entire group?"
    );

    if (!confirmed) return;

    await supabase
      .from("groups")
      .delete()
      .eq("id", groupId);

    router.refresh();
  }

  if (loading || !isAdmin) {
    return null;
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded-md border border-red-200 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
    >
      Delete
    </button>
  );
}
