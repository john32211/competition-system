import { supabase } from "@/lib/supabase";
import type { Profile, UserRole } from "@/types/database";

export async function getCurrentProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    (data as Profile | null) ?? {
      id: user.id,
      full_name: user.email ?? "Instructor",
      role: ((user.user_metadata?.role as UserRole | undefined) ?? "instructor"),
    }
  );
}

export function canManageInventory(role?: UserRole) {
  return role === "admin";
}
