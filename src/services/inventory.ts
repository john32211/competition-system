import { supabase } from "@/lib/supabase";
import type { InventoryItem } from "@/types/database";

const INVENTORY_TABLE = "inventory_items";

export async function getInventoryItems() {
  const { data, error } = await supabase
    .from(INVENTORY_TABLE)
    .select("*")
    .order("name", { ascending: true });

  return { items: (data ?? []) as InventoryItem[], error };
}

export async function createInventoryItem(input: {
  name: string;
  total_stock: number;
  low_stock_threshold: number;
  category?: string;
}) {
  return supabase.from(INVENTORY_TABLE).insert({
    name: input.name,
    total_stock: input.total_stock,
    remaining_stock: input.total_stock,
    missing_quantity: 0,
    low_stock_threshold: input.low_stock_threshold,
    category: input.category || null,
  });
}

export async function deleteInventoryItem(id: string) {
  return supabase.from(INVENTORY_TABLE).delete().eq("id", id);
}

export async function allocateInventory(itemId: string, quantity: number) {
  const { data: item, error } = await supabase
    .from(INVENTORY_TABLE)
    .select("*")
    .eq("id", itemId)
    .single();

  if (error || !item) {
    return { item: null, allocated: 0, shortage: quantity, error };
  }

  const allocated = Math.min(Number(item.remaining_stock ?? 0), quantity);
  const shortage = Math.max(quantity - allocated, 0);

  const { data, error: updateError } = await supabase
    .from(INVENTORY_TABLE)
    .update({
      remaining_stock: Math.max(Number(item.remaining_stock ?? 0) - quantity, 0),
      missing_quantity: Number(item.missing_quantity ?? 0) + shortage,
    })
    .eq("id", itemId)
    .select()
    .single();

  return { item: data as InventoryItem | null, allocated, shortage, error: updateError };
}
