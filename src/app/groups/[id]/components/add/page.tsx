"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { allocateInventory, getInventoryItems } from "@/services/inventory";
import { supabase } from "@/lib/supabase";
import type { InventoryItem } from "@/types/database";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";

export default function AddComponentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: groupId } = use(params);
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryId, setInventoryId] = useState("");
  const [needed, setNeeded] = useState(1);
  const [customName, setCustomName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadInventory() {
      const { items } = await getInventoryItems();
      setInventory(items);
      setInventoryId(items[0]?.id ?? "");
    }

    loadInventory();
  }, []);

  const selectedItem = useMemo(
    () => inventory.find((item) => item.id === inventoryId),
    [inventory, inventoryId]
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    let allocated = 0;
    let shortage = needed;
    let name = customName.trim();

    if (selectedItem) {
      name = selectedItem.name;
      const allocation = await allocateInventory(selectedItem.id, needed);
      allocated = allocation.allocated;
      shortage = allocation.shortage;
    }

    const { error } = await supabase.from("components").insert({
      group_id: groupId,
      name,
      needed,
      available: allocated,
    });

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (shortage > 0) {
      setMessage(`${name} saved. Shortage recorded: ${shortage}.`);
      return;
    }

    router.push(`/groups/${groupId}`);
    router.refresh();
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl rounded-md border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold">Add Project Component</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Requests deduct from central inventory and record shortages automatically.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <label className="block text-sm font-medium">
            Component from inventory
            <select
              value={inventoryId}
              onChange={(event) => setInventoryId(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
            >
              {inventory.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} - remaining {item.remaining_stock}
                </option>
              ))}
              <option value="">Custom item</option>
            </select>
          </label>

          {!selectedItem ? (
            <label className="block text-sm font-medium">
              Custom Component Name
              <input
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                required
              />
            </label>
          ) : (
            <div className="rounded-md bg-slate-50 p-4 text-sm dark:bg-slate-950">
              Remaining stock: <span className="font-semibold">{selectedItem.remaining_stock}</span>
              <br />
              Project shortage if submitted now:{" "}
              <span className="font-semibold text-red-600 dark:text-red-300">
                {Math.max(needed - Number(selectedItem.remaining_stock), 0)}
              </span>
            </div>
          )}

          <label className="block text-sm font-medium">
            Required Quantity
            <input
              type="number"
              min={1}
              value={needed}
              onChange={(event) => setNeeded(Number(event.target.value))}
              className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>

          {message ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              {message}
            </div>
          ) : null}

          <button disabled={saving} className="w-full rounded-md bg-slate-950 py-3 font-semibold text-white dark:bg-cyan-400 dark:text-slate-950">
            {saving ? "Allocating..." : "Save Component Requirement"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
