import { config } from "dotenv"
config({ path: ".env.local" })

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding PetBiz demo data...")

  const user = await prisma.user.upsert({
    where: { email: "dev@petbiz.local" },
    update: {},
    create: {
      id: "dev-preview",
      email: "dev@petbiz.local",
      name: "Dev Preview",
      emailVerified: new Date(),
    },
  })

  await prisma.allowedEmail.upsert({
    where: { email: "dev@petbiz.local" },
    update: {},
    create: { email: "dev@petbiz.local" },
  })

  const org = await prisma.organization.upsert({
    where: { slug: "dev-org" },
    update: {},
    create: {
      name: "Dev Preview",
      businessName: "PetBiz Demo — Grooming Lisboa",
      slug: "dev-org",
      ownerId: user.id,
      businessType: "GROOMING",
      city: "Lisboa",
      phone: "912 000 001",
      onboardingStep: 5,
    },
  })

  await prisma.orgMember.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
    update: {},
    create: { userId: user.id, organizationId: org.id, role: "OWNER" },
  })

  // 4 Clientes
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { id: "client-seed-1" },
      update: {},
      create: {
        id: "client-seed-1",
        organizationId: org.id,
        name: "Maria Santos",
        email: "maria.santos@gmail.com",
        phone: "910 123 456",
        city: "Lisboa",
        tags: ["regular", "golden-retriever"],
      },
    }),
    prisma.client.upsert({
      where: { id: "client-seed-2" },
      update: {},
      create: {
        id: "client-seed-2",
        organizationId: org.id,
        name: "João Pereira",
        email: "joao.pereira@outlook.com",
        phone: "966 234 567",
        city: "Sintra",
        tags: ["novo"],
      },
    }),
    prisma.client.upsert({
      where: { id: "client-seed-3" },
      update: {},
      create: {
        id: "client-seed-3",
        organizationId: org.id,
        name: "Ana Rodrigues",
        email: "ana.rodrigues@icloud.com",
        phone: "932 345 678",
        city: "Cascais",
        tags: ["vip", "poodle"],
      },
    }),
    prisma.client.upsert({
      where: { id: "client-seed-4" },
      update: {},
      create: {
        id: "client-seed-4",
        organizationId: org.id,
        name: "Carlos Neves",
        phone: "915 456 789",
        city: "Oeiras",
        tags: ["inativo"],
      },
    }),
  ])

  // 3 Pets
  const now = new Date()
  const pet1 = await prisma.pet.upsert({
    where: { id: "pet-seed-1" },
    update: {},
    create: {
      id: "pet-seed-1",
      organizationId: org.id,
      clientId: clients[0].id,
      name: "Mel",
      species: "DOG",
      breed: "Golden Retriever",
      birthDate: new Date("2020-03-15"),
      weight: 28.5,
      color: "Dourado",
    },
  })
  const pet2 = await prisma.pet.upsert({
    where: { id: "pet-seed-2" },
    update: {},
    create: {
      id: "pet-seed-2",
      organizationId: org.id,
      clientId: clients[2].id,
      name: "Coco",
      species: "DOG",
      breed: "Poodle Toy",
      birthDate: new Date("2021-07-22"),
      weight: 4.2,
      color: "Branco",
    },
  })

  // 2 Serviços
  const svc1 = await prisma.service.upsert({
    where: { id: "svc-seed-1" },
    update: {},
    create: {
      id: "svc-seed-1",
      organizationId: org.id,
      name: "Banho e Tosquia Completa",
      price: 45.00,
      duration: 90,
      description: "Banho, secagem, tosquia e limpeza de ouvidos",
      category: "grooming",
    },
  })
  const svc2 = await prisma.service.upsert({
    where: { id: "svc-seed-2" },
    update: {},
    create: {
      id: "svc-seed-2",
      organizationId: org.id,
      name: "Banho Simples",
      price: 25.00,
      duration: 45,
      description: "Banho e secagem",
      category: "grooming",
    },
  })

  // 2 Agendamentos
  const appt1Date = new Date(now)
  appt1Date.setHours(10, 0, 0, 0)
  const appt1End = new Date(appt1Date.getTime() + 90 * 60000)
  await prisma.appointment.upsert({
    where: { id: "appt-seed-1" },
    update: {},
    create: {
      id: "appt-seed-1",
      organizationId: org.id,
      clientId: clients[0].id,
      petId: pet1.id,
      serviceId: svc1.id,
      date: appt1Date,
      endDate: appt1End,
      status: "CONFIRMED",
      price: svc1.price,
      notes: "Mel está um pouco nervosa com barulhos. Cuidado.",
    },
  })

  const appt2Date = new Date(now)
  appt2Date.setDate(appt2Date.getDate() + 3)
  appt2Date.setHours(14, 30, 0, 0)
  const appt2End = new Date(appt2Date.getTime() + 45 * 60000)
  await prisma.appointment.upsert({
    where: { id: "appt-seed-2" },
    update: {},
    create: {
      id: "appt-seed-2",
      organizationId: org.id,
      clientId: clients[2].id,
      petId: pet2.id,
      serviceId: svc2.id,
      date: appt2Date,
      endDate: appt2End,
      status: "CONFIRMED",
      price: svc2.price,
    },
  })

  // 1 Transacção
  await prisma.transaction.upsert({
    where: { id: "tx-seed-1" },
    update: {},
    create: {
      id: "tx-seed-1",
      organizationId: org.id,
      clientId: clients[2].id,
      amount: 45.00,
      type: "INCOME",
      description: "Banho e Tosquia — Coco",
      date: new Date(now.getTime() - 7 * 86400000),
      status: "PAID",
    },
  })

  console.log("Seed completo!")
  console.log(`Org: ${org.slug}`)
  console.log(`Clientes: ${clients.length}`)
  console.log(`Pets: 2`)
  console.log(`Serviços: 2`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
