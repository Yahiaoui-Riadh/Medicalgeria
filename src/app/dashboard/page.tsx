import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardRedirectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role;

  switch (role) {
    case "PHARMACIST":
      redirect("/pharmacy/dashboard");
    case "PATIENT":
      redirect("/patient/dashboard");
    case "WHOLESALER":
      redirect("/wholesaler/dashboard");
    case "ADMIN":
      redirect("/admin/dashboard");
    default:
      redirect("/");
  }
}
