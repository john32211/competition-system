"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { uploadCompetitionFile } from "@/services/storage";
import { FileUp, Image, Video } from "lucide-react";
import { useState } from "react";

export default function FilesPage() {
  const [folder, setFolder] = useState("reports");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState<string | null>(null);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("file") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    setUploading(true);
    const result = await uploadCompetitionFile(file, folder);
    setUploading(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    setUrl(result.publicUrl);
    setMessage("File uploaded to Supabase Storage.");
    form.reset();
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Files</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Upload project images, demo videos, reports, and competition evidence.</p>
        </div>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
          <form onSubmit={handleUpload} className="rounded-md border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center gap-2">
              <FileUp size={20} />
              <h2 className="text-lg font-semibold">Upload Asset</h2>
            </div>
            <div className="space-y-4">
              <select value={folder} onChange={(event) => setFolder(event.target.value)} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
                <option value="reports">Reports and documents</option>
                <option value="images">Project images</option>
                <option value="videos">Demo videos</option>
              </select>
              <input name="file" type="file" className="w-full rounded-md border border-dashed border-slate-300 p-4 dark:border-slate-700" />
              <button disabled={uploading} className="w-full rounded-md bg-slate-950 py-3 font-semibold text-white dark:bg-cyan-400 dark:text-slate-950">
                {uploading ? "Uploading..." : "Upload to Storage"}
              </button>
            </div>
            {message ? <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{message}</p> : null}
          </form>

          <div className="rounded-md border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">Storage Workflows</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                [Image, "Images", "Robot builds, wiring, and testing photos"],
                [Video, "Videos", "Run attempts and final demos"],
                [FileUp, "Reports", "PDFs, rubrics, and instructor notes"],
              ].map(([Icon, title, body]) => {
                const TypedIcon = Icon as typeof FileUp;
                return (
                  <div key={title as string} className="rounded-md bg-slate-50 p-4 dark:bg-slate-950">
                    <TypedIcon size={20} />
                    <p className="mt-3 font-semibold">{title as string}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{body as string}</p>
                  </div>
                );
              })}
            </div>
            {url ? (
              <a href={url} className="mt-6 inline-block text-sm font-semibold text-cyan-700 dark:text-cyan-300">
                Open uploaded file
              </a>
            ) : null}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
