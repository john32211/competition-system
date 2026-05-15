import DashboardLayout from "@/components/layout/DashboardLayout";
import SessionEditor from "@/components/forms/SessionEditor";

export default async function AddSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl rounded-md border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold">Add Session</h1>
        <div className="mt-6">
          <SessionEditor groupId={id} />
        </div>
      </div>
    </DashboardLayout>
  );
}
