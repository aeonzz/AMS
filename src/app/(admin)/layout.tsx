import { currentUser } from "@/lib/actions/users";
import { checkAuth } from "@/lib/auth/utils";
import CommandLayout from "@/components/layouts/command-layout";
import SessionProvider from "@/components/providers/session-provider";
import { redirect } from "next/navigation";
import AdminDashboardLayout from "@/app/(admin)/_components/admin-dashboard-layout";
import Error from "@/components/error";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await checkAuth();
  const [data] = await currentUser();

  if (!data) {
    return <Error />;
  }

  // if (data.role !== "SYSTEMADMIN") {
  //   return redirect("/dashboard");
  // }

  return (
    <SessionProvider user={data}>
      <AdminDashboardLayout>
        <CommandLayout>{children}</CommandLayout>
      </AdminDashboardLayout>
    </SessionProvider>
  );
}
