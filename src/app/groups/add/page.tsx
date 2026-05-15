import DashboardLayout from "@/components/layout/DashboardLayout";
import GroupEditor from "@/components/forms/GroupEditor";

export default function AddGroupPage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl rounded-md border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold">Add Group</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Create a competition team and assign its instructor workflow.
        </p>
        <div className="mt-6">
          <GroupEditor />
        </div>
      </div>
    </DashboardLayout>
  );
}
