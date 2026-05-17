"use client";

import { supabase } from "@/lib/supabase";
import { releaseComponentAllocation } from "@/services/inventory";
import type { ComponentRequirement } from "@/types/database";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteComponentButton({
  componentId,
}: {
  componentId: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function handleDelete() {
    const confirmed = confirm(
      "Delete this component?"
    );

    if (!confirmed) return;

    const { data: component, error: componentError } = await supabase
      .from("components")
      .select("*")
      .eq("id", componentId)
      .single();

    if (componentError || !component) {
      setMessage(componentError?.message ?? "Component was not found.");
      return;
    }

    const release = await releaseComponentAllocation(component as ComponentRequirement);

    if (release.error) {
      setMessage(release.error.message);
      return;
    }

    const { error } = await supabase
      .from("components")
      .delete()
      .eq("id", componentId);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <button
        onClick={handleDelete}
        className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
      >
        Remove
      </button>
      {message ? <p className="mt-2 text-xs text-red-600">{message}</p> : null}
    </div>
  );
}
