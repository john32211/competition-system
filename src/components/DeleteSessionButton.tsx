"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function DeleteSessionButton({
  sessionId,
}: {
  sessionId: string;
}) {
  const router = useRouter();

  async function handleDelete() {
    const confirmed = confirm(
      "Delete this session?"
    );

    if (!confirmed) return;

    await supabase
      .from("sessions")
      .delete()
      .eq("id", sessionId);

    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
    >
      Delete
    </button>
  );
}
