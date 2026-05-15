"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function DeleteComponentButton({
  componentId,
}: {
  componentId: string;
}) {
  const router = useRouter();

  async function handleDelete() {
    const confirmed = confirm(
      "Delete this component?"
    );

    if (!confirmed) return;

    await supabase
      .from("components")
      .delete()
      .eq("id", componentId);

    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
    >
      Remove
    </button>
  );
}
