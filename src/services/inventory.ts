import { supabase } from "@/lib/supabase";
import type { ComponentRequirement, InventoryItem } from "@/types/database";

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
  category?: string;
}) {
  return supabase.from(INVENTORY_TABLE).insert({
    name: input.name,
    total_stock: input.total_stock,
    remaining_stock: input.total_stock,
    missing_quantity: 0,
    low_stock_threshold: 1,
    category: input.category || null,
  });
}

export async function restockInventoryItem(item: InventoryItem, addedQuantity: number) {
  const totalStock = Number(item.total_stock ?? 0) + addedQuantity;
  const missingQuantity = Math.max(Number(item.missing_quantity ?? 0) - addedQuantity, 0);
  const remainingStock = Number(item.remaining_stock ?? 0) + Math.max(
    addedQuantity - Number(item.missing_quantity ?? 0),
    0
  );

  return supabase
    .from(INVENTORY_TABLE)
    .update({
      total_stock: totalStock,
      remaining_stock: remainingStock,
      missing_quantity: missingQuantity,
      low_stock_threshold: 1,
    })
    .eq("id", item.id);
}

export async function recordMissingInventory(name: string, missingQuantity: number) {
  const { data: existing } = await supabase
    .from(INVENTORY_TABLE)
    .select("*")
    .ilike("name", name)
    .maybeSingle();

  if (existing) {
    return supabase
      .from(INVENTORY_TABLE)
      .update({
        missing_quantity: Number(existing.missing_quantity ?? 0) + missingQuantity,
        low_stock_threshold: 1,
      })
      .eq("id", existing.id)
      .select()
      .single();
  }

  return supabase.from(INVENTORY_TABLE).insert({
    name,
    category: "Unstocked request",
    total_stock: 0,
    remaining_stock: 0,
    missing_quantity: missingQuantity,
    low_stock_threshold: 1,
  }).select().single();
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

export async function releaseComponentAllocation(component: ComponentRequirement) {
  const allocated = Number(component.available ?? 0);
  const shortage = Number(
    component.shortage ?? Math.max(Number(component.needed ?? 0) - allocated, 0)
  );

  const query = component.inventory_item_id
    ? supabase.from(INVENTORY_TABLE).select("*").eq("id", component.inventory_item_id)
    : supabase.from(INVENTORY_TABLE).select("*").ilike("name", component.name);

  const { data: item, error } = await query.maybeSingle();

  if (error || !item) {
    return { error };
  }

  return supabase
    .from(INVENTORY_TABLE)
    .update({
      remaining_stock: Number(item.remaining_stock ?? 0) + allocated,
      missing_quantity: Math.max(Number(item.missing_quantity ?? 0) - shortage, 0),
      low_stock_threshold: 1,
    })
    .eq("id", item.id);
}
