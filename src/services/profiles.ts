import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";

export async function getInstructorProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,role")
    .eq("role", "instructor")
    .order("full_name", { ascending: true });

  return { profiles: (data ?? []) as Profile[], error };
}

export function profileDisplayName(profile: Profile) {
  return profile.full_name || profile.email || "Instructor";
}
