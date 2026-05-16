import { supabase } from "@/lib/supabase";

const BUCKET = "competition-files";
const FOLDERS = ["reports", "images", "videos"] as const;

export type CompetitionFile = {
  name: string;
  folder: string;
  path: string;
  publicUrl: string;
  size: number;
  updatedAt: string | null;
};

export async function uploadCompetitionFile(file: File, folder: string) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${folder}/${Date.now()}-${safeName}`;

  const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
  });

  if (error) {
    const setupMessage =
      error.message === "Bucket not found"
        ? `Storage bucket "${BUCKET}" was not found. Run the storage section in supabase-schema.sql or create this bucket in Supabase Storage.`
        : error.message;

    return {
      path: null,
      publicUrl: null,
      error: { ...error, message: setupMessage },
    };
  }

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(data.path);

  return { path: data.path, publicUrl: publicUrl.publicUrl, error: null };
}

export async function listCompetitionFiles() {
  const results = await Promise.all(
    FOLDERS.map(async (folder) => {
      const { data, error } = await supabase.storage.from(BUCKET).list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      });

      if (error) {
        return { files: [] as CompetitionFile[], error };
      }

      const files = (data ?? [])
        .filter((file) => file.name !== ".emptyFolderPlaceholder")
        .map((file) => {
          const path = `${folder}/${file.name}`;
          const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path);

          return {
            name: file.name,
            folder,
            path,
            publicUrl: publicUrl.publicUrl,
            size: Number(file.metadata?.size ?? 0),
            updatedAt: file.updated_at ?? file.created_at ?? null,
          };
        });

      return { files, error: null };
    })
  );

  const error = results.find((result) => result.error)?.error ?? null;
  const files = results
    .flatMap((result) => result.files)
    .sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });

  return { files, error };
}
