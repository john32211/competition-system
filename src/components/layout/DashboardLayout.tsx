import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import AuthGuard from "@/components/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-slate-100 xl:flex">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <Navbar />

          <main className="p-4 sm:p-6 xl:p-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
