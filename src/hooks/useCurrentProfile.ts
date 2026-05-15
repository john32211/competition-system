"use client";

import { supabase } from "@/lib/supabase";
import type { Profile, UserRole } from "@/types/database";
import { useEffect, useMemo, useState } from "react";

type ProfileState = {
  loading: boolean;
  profile: Profile | null;
  role: UserRole | null;
  isAdmin: boolean;
};

export function useCurrentProfile(): ProfileState {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!active) return;

      setProfile(
        (data as Profile | null) ?? {
          id: user.id,
          full_name: user.email ?? "Instructor",
          role: "instructor",
        }
      );
      setLoading(false);
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  return useMemo(
    () => ({
      loading,
      profile,
      role: profile?.role ?? null,
      isAdmin: profile?.role === "admin",
    }),
    [loading, profile]
  );
}
