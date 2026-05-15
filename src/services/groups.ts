import { supabase } from "@/lib/supabase";
import { demoGroups } from "@/lib/mockData";
import type { Group } from "@/types/database";

export async function getGroups() {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return { groups: demoGroups, error };
  }

  return { groups: (data ?? []) as Group[], error: null };
}

export async function getGroup(id: string) {
  const { data, error } = await supabase.from("groups").select("*").eq("id", id).single();

  if (error) {
    return { group: demoGroups.find((group) => group.id === id) ?? null, error };
  }

  return { group: data as Group, error: null };
}
