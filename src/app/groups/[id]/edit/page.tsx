import DashboardLayout from "@/components/layout/DashboardLayout";
import GroupEditor from "@/components/forms/GroupEditor";
import { getGroup } from "@/services/groups";

export default async function EditGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { group } = await getGroup(id);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl rounded-md border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold">Edit Group</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Update instructor assignment, schedule, and progress.
        </p>
        <div className="mt-6">
          <GroupEditor group={group} />
        </div>
      </div>
    </DashboardLayout>
  );
}
