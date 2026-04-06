import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const DEV_USER_ID = "dev-preview"

const DEV_SESSION = {
  user: {
    id: DEV_USER_ID,
    name: "Dev Preview",
    email: "dev@petbiz.local",
    image: null as string | null,
  },
  expires: new Date(Date.now() + 86400000).toISOString(),
}

let devUserEnsured = false

async function ensureDevUser() {
  if (devUserEnsured) return
  await prisma.user.upsert({
    where: { id: DEV_USER_ID },
    create: { id: DEV_USER_ID, email: "dev@petbiz.local", name: "Dev Preview" },
    update: {},
  })
  const org = await prisma.organization.upsert({
    where: { slug: "dev-org" },
    create: {
      name: "Dev Preview",
      businessName: "PetBiz Demo",
      slug: "dev-org",
      ownerId: DEV_USER_ID,
      members: { create: { userId: DEV_USER_ID, role: "OWNER" } },
    },
    update: {},
  })
  await prisma.orgMember.upsert({
    where: { userId_organizationId: { userId: DEV_USER_ID, organizationId: org.id } },
    create: { userId: DEV_USER_ID, organizationId: org.id, role: "OWNER" },
    update: {},
  })
  devUserEnsured = true
}

export async function getSession() {
  if (process.env.DEV_PREVIEW === "true" && process.env.NODE_ENV !== "production") {
    await ensureDevUser()
    return DEV_SESSION
  }
  return auth()
}
