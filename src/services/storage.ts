import { supabase } from "@/lib/supabase";

const BUCKET = "competition-files";

export async function uploadCompetitionFile(file: File, folder: string) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${folder}/${Date.now()}-${safeName}`;

  const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
  });

  if (error) {
    return { path: null, publicUrl: null, error };
  }

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(data.path);

  return { path: data.path, publicUrl: publicUrl.publicUrl, error: null };
}
