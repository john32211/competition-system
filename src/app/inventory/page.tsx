"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import RoleNotice from "@/components/RoleNotice";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { createInventoryItem, deleteInventoryItem, getInventoryItems, restockInventoryItem } from "@/services/inventory";
import type { InventoryItem } from "@/types/database";
import { AlertTriangle, PackagePlus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function InventoryPage() {
  const { loading: profileLoading, isAdmin } = useCurrentProfile();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [totalStock, setTotalStock] = useState(1);
  const [restockAmounts, setRestockAmounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");

  const setupError =
    loadError.includes("Could not find the table") ||
    loadError.includes("schema cache") ||
    loadError.includes("relation") ||
    loadError.includes("does not exist");
  const connectionError =
    loadError.includes("Failed to fetch") ||
    loadError.includes("NetworkError") ||
    loadError.includes("fetch failed");

  async function loadItems() {
    setLoading(true);
    const { items: inventory, error } = await getInventoryItems();
    setItems(inventory);
    setLoadError(error?.message ?? "");
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    getInventoryItems().then(({ items: inventory, error }) => {
      if (!active) return;
      setItems(inventory);
      setLoadError(error?.message ?? "");
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const missing = items.reduce((sum, item) => sum + Number(item.missing_quantity ?? 0), 0);
    const low = items.filter((item) => Number(item.remaining_stock) <= Number(item.low_stock_threshold)).length;
    const stock = items.reduce((sum, item) => sum + Number(item.remaining_stock ?? 0), 0);
    return { missing, low, stock };
  }, [items]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();

    if (!isAdmin) {
      setMessage("Only admins can add or update central inventory.");
      return;
    }

    const { error } = await createInventoryItem({
      name: name.trim(),
      category: category.trim(),
      total_stock: totalStock,
    });

    if (error) {
      setMessage(`Inventory was not saved: ${error.message}`);
      return;
    }

    setName("");
    setCategory("");
    setTotalStock(1);
    setMessage("Inventory item created.");
    await loadItems();
  }

  async function handleRestock(item: InventoryItem) {
    if (!isAdmin) {
      setMessage("Only admins can edit central inventory.");
      return;
    }

    const quantity = Number(restockAmounts[item.id] ?? 0);
    if (quantity <= 0) {
      setMessage("Enter a restock quantity greater than zero.");
      return;
    }

    const { error } = await restockInventoryItem(item, quantity);

    if (error) {
      setMessage(`Inventory was not updated: ${error.message}`);
      return;
    }

    setRestockAmounts((current) => ({ ...current, [item.id]: 0 }));
    setMessage(`${item.name} restocked by ${quantity}.`);
    await loadItems();
  }

  async function handleDelete(id: string) {
    if (!isAdmin) {
      setMessage("Only admins can delete inventory items.");
      return;
    }

    const confirmed = confirm("Delete this inventory item?");
    if (!confirmed) return;
    const { error } = await deleteInventoryItem(id);
    if (error) {
      setMessage(`Inventory was not deleted: ${error.message}`);
      return;
    }
    setMessage("Inventory item deleted.");
    await loadItems();
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Central Inventory</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Global robotics stock with automatic remaining quantity, shortages, and low stock alerts.
          </p>
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            ["Remaining Stock", metrics.stock],
            ["Low Stock Items", metrics.low],
            ["Missing Quantity", metrics.missing],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
              <p className="mt-2 text-3xl font-bold">{value}</p>
            </div>
          ))}
        </section>

        {loadError ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            {setupError ? (
              <>
                <p className="font-semibold">Inventory database setup is required.</p>
                <p className="mt-1">
                  Supabase returned: {loadError}. Run the inventory schema in{" "}
                  <span className="font-mono">supabase-schema.sql</span>, then refresh this page.
                </p>
              </>
            ) : connectionError ? (
              <>
                <p className="font-semibold">Supabase connection failed.</p>
                <p className="mt-1">
                  The browser could not reach your Supabase project. Check your internet connection,
                  <span className="font-mono"> .env.local </span>
                  values, and whether the Supabase project is paused.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold">Inventory could not load.</p>
                <p className="mt-1">Supabase returned: {loadError}</p>
              </>
            )}
          </div>
        ) : null}

        {!profileLoading && !isAdmin ? (
          <RoleNotice
            title="Read-only inventory"
            body="Your instructor account can view shortages and stock levels, but only admins can add or delete central inventory."
          />
        ) : null}

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
          <form onSubmit={handleCreate} className="rounded-md border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center gap-2">
              <PackagePlus size={20} />
              <h2 className="text-lg font-semibold">Add Stock Item</h2>
            </div>
            <div className="space-y-4">
              <input className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Arduino Uno" value={name} onChange={(event) => setName(event.target.value)} required />
              <input className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Category" value={category} onChange={(event) => setCategory(event.target.value)} />
              <div>
                <label className="text-sm">
                  Total stock
                  <input type="number" min={0} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={totalStock} onChange={(event) => setTotalStock(Number(event.target.value))} />
                </label>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Low stock alert is fixed at 1 remaining item.
                </p>
              </div>
              <button disabled={Boolean(loadError) || profileLoading || !isAdmin} className="w-full rounded-md bg-slate-950 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-cyan-400 dark:text-slate-950">Save Item</button>
              {message ? <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p> : null}
            </div>
          </form>

          <div className="overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="grid grid-cols-6 gap-3 border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800">
              <span className="col-span-2">Component</span>
              <span>Total</span>
              <span>Remaining</span>
              <span>Missing</span>
              <span></span>
            </div>
            {loading ? (
              <div className="p-6 text-slate-500">Loading inventory...</div>
            ) : loadError ? (
              <div className="p-6 text-slate-500 dark:text-slate-400">
                No editable inventory is available until the Supabase table exists.
              </div>
            ) : items.length === 0 ? (
              <div className="p-6 text-slate-500 dark:text-slate-400">
                No inventory items yet. Add your first robotics component stock item.
              </div>
            ) : (
              items.map((item) => {
                const low = Number(item.remaining_stock) <= Number(item.low_stock_threshold);
                return (
                  <div key={item.id} className="grid grid-cols-6 items-center gap-3 border-b border-slate-100 px-4 py-4 text-sm last:border-0 dark:border-slate-800">
                    <div className="col-span-2">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.category ?? "General"}</p>
                    </div>
                    <span>{item.total_stock}</span>
                    <span className={low ? "font-semibold text-amber-600 dark:text-amber-300" : ""}>
                      {item.remaining_stock}
                    </span>
                    <span className={Number(item.missing_quantity) > 0 ? "font-semibold text-red-600 dark:text-red-300" : ""}>
                      {item.missing_quantity ?? 0}
                    </span>
                    {isAdmin ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={restockAmounts[item.id] ?? 0}
                          onChange={(event) =>
                            setRestockAmounts((current) => ({
                              ...current,
                              [item.id]: Number(event.target.value),
                            }))
                          }
                          className="w-20 rounded-md border border-slate-200 bg-white px-2 py-2 dark:border-slate-700 dark:bg-slate-950"
                          aria-label={`Restock ${item.name}`}
                        />
                        <button
                          onClick={() => handleRestock(item)}
                          className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-slate-700"
                        >
                          Add
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="inline-flex size-9 items-center justify-center rounded-md border border-slate-200 text-red-600 dark:border-slate-700">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Read only</span>
                    )}
                    {low || Number(item.missing_quantity) > 0 ? (
                      <div className="col-span-6 flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                        <AlertTriangle size={14} />
                        Reorder recommended before the next build session.
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
