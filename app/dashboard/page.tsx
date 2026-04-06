import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardRedirect() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const membership = await prisma.orgMember.findFirst({
    where: { userId: session.user.id, organization: { deletedAt: null } },
    include: { organization: true },
    orderBy: { joinedAt: "asc" },
  });

  if (membership?.organization) {
    redirect(`/dashboard/${membership.organization.slug}`);
  }

  // Em modo dev sem org, criar automaticamente dados demo
  if (process.env.DEV_PREVIEW === "true" && process.env.NODE_ENV !== "production") {
    redirect("/api/dev/seed");
  }

  redirect("/onboarding");
}
