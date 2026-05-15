
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";
import DeleteStudentButton from "@/components/DeleteStudentButton";
import AuthGuard from "@/components/AuthGuard";
import DeleteComponentButton from "@/components/DeleteComponentButton";
import DeleteSessionButton from "@/components/DeleteSessionButton";

export default async function GroupDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: groupId } = await params;

  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  const { data: students } = await supabase
    .from("students")
    .select("*")
    .eq("group_id", groupId);
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("group_id", groupId)
    .single();
  const { data: components } = await supabase
    .from("components")
    .select("*")
    .eq("group_id", groupId);
  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("group_id", groupId);

  if (!group) {
    return (
      <DashboardLayout>
        <div>Group not found</div>
      </DashboardLayout>
    );
  }

  return (
<AuthGuard>
<DashboardLayout>
  <div className="space-y-6">
    <div className="bg-white rounded-3xl shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            {group.name}
          </h1>

          <p className="text-slate-500 mt-2">
            Instructor: {group.instructor}
          </p>

          <p className="text-slate-500">
            Session: {group.session}
          </p>
        </div>

        <div className="text-right">
          <p className="text-slate-500">
            Overall Progress
          </p>

          <h2 className="text-4xl font-bold text-green-500">
            {group.progress}%
          </h2>
        </div>
      </div>

      <div className="mt-6 w-full bg-slate-200 rounded-full h-4 overflow-hidden">
        <div
          className="bg-green-500 h-full rounded-full"
          style={{
            width: `${group.progress}%`,
          }}
        />
      </div>
    </div>

    {/* STUDENTS SECTION */}

    <div className="bg-white rounded-3xl shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          Students
        </h2>

        <a
          href={`/groups/${groupId}/students/add`}
          className="bg-slate-900 text-white px-4 py-2 rounded-xl"
        >
          + Add Student
        </a>
      </div>

      <div className="space-y-4">
        {students?.map((student) => (
          <div
            key={student.id}
            className="border border-slate-200 rounded-2xl p-4 flex items-center justify-between"
          >
            <div>
              <h3 className="font-semibold text-lg">
                {student.name}
              </h3>

              <p className="text-slate-500">
                Age: {student.age}
              </p>
            </div>

            
                <DeleteStudentButton
                  studentId={student.id}
                  />
            
          </div>
        ))}
      </div>
    </div>

    {/* PROJECT SECTION */}

    <div className="bg-white rounded-3xl shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          Project
        </h2>

        <a
          href={`/groups/${groupId}/project`}
          className="bg-slate-900 text-white px-4 py-2 rounded-xl"
        >
          Manage Project
        </a>
      </div>

      {project ? (
        <div className="space-y-4">
          <div>
            <p className="text-slate-500 text-sm">
              Title
            </p>

            <h3 className="text-2xl font-semibold">
              {project.title}
            </h3>
          </div>

          <div>
            <p className="text-slate-500 text-sm">
              Description
            </p>

            <p className="mt-1">
              {project.description}
            </p>
          </div>

          <div>
            <p className="text-slate-500 text-sm">
              Status
            </p>

            <div className="inline-block mt-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full">
              {project.status}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-slate-500">
          No project assigned yet.
        </p>
      )}
    </div>
  </div>
  <div className="bg-white rounded-3xl shadow p-6">
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-2xl font-bold">
      Components
    </h2>

    <a
      href={`/groups/${groupId}/components/add`}
      className="bg-slate-900 text-white px-4 py-2 rounded-xl"
    >
      + Add Component
    </a>
  </div>

  <div className="space-y-4">
    {components?.map((component) => {
      const missing =
        component.needed - component.available;

      return (
        <div
          key={component.id}
          className="border border-slate-200 rounded-2xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">
                {component.name}
              </h3>

              <p className="text-slate-500 mt-1">
                Needed: {component.needed}
              </p>

              <p className="text-slate-500">
                Available: {component.available}
              </p>
            </div>

            {missing > 0 ? (
              <div className="bg-red-100 text-red-600 px-4 py-2 rounded-full">
                Missing {missing}
              </div>
            ) : (
              <div className="bg-green-100 text-green-600 px-4 py-2 rounded-full">
                Available
              </div>
            )}
            <div className="mt-4">
  <DeleteComponentButton
    componentId={component.id}
  />
</div>
          </div>
        </div>
        
      );
    })}
  </div>
</div>

<div className="bg-white rounded-3xl shadow p-6">
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-2xl font-bold">
      Session Tracking
    </h2>

    <a
      href={`/groups/${groupId}/sessions/add`}
      className="bg-slate-900 text-white px-4 py-2 rounded-xl"
    >
      + Add Session
    </a>
  </div>

  <div className="space-y-5">
    {sessions?.map((session) => (
      <div
        key={session.id}
        className="border border-slate-200 rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">
            {session.session_date}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-slate-500 text-sm mb-2">
              Planned Work
            </p>

            <div className="bg-blue-50 rounded-xl p-4">
              {session.planned}
            </div>
          </div>
          <div className="mt-4">
  <DeleteSessionButton
    sessionId={session.id}
  />
</div>

          <div>
            <p className="text-slate-500 text-sm mb-2">
              Finished Work
            </p>

            <div className="bg-green-50 rounded-xl p-4">
              {session.finished}
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
</DashboardLayout>
</AuthGuard>
   
  );
}