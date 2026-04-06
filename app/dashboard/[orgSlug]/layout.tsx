import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardLayoutClient } from "./layout-client";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const org = await prisma.organization.findFirst({
    where: { slug: orgSlug, deletedAt: null, members: { some: { userId: session.user.id } } },
    select: { name: true, businessName: true },
  });
  if (!org) redirect("/onboarding");

  return (
    <DashboardLayoutClient
      orgSlug={orgSlug}
      orgName={org.businessName ?? org.name}
      plan="FREE"
      userName={session.user.name ?? undefined}
    >
      {children}
    </DashboardLayoutClient>
  );
}
