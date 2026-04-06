import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays, subDays, addHours } from "date-fns";

// Dev-only: creates demo org + data for the dev-preview user
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const DEV_USER_ID = "dev-preview";

  // Ensure dev user exists
  await prisma.user.upsert({
    where: { id: DEV_USER_ID },
    create: { id: DEV_USER_ID, email: "dev@petbiz.local", name: "Cristina Pena" },
    update: { name: "Cristina Pena" },
  });

  // Check if org already exists
  const existing = await prisma.orgMember.findFirst({
    where: { userId: DEV_USER_ID },
    include: { organization: true },
  });

  if (existing?.organization) {
    return NextResponse.redirect(
      new URL(`/dashboard/${existing.organization.slug}`, "http://localhost:3002")
    );
  }

  const now = new Date();

  // Create org
  const org = await prisma.organization.create({
    data: {
      name: "Patas & Amor",
      slug: "patas-e-amor",
      businessName: "Patas & Amor",
      businessType: "GROOMING",
      city: "Lisboa",
      phone: "912 345 678",
      country: "PT",
      timezone: "Europe/Lisbon",
      currency: "EUR",
      onboardingStep: 5,
      onboardingDone: true,
      openingHours: {
        mon: { open: "09:00", close: "18:00" },
        tue: { open: "09:00", close: "18:00" },
        wed: { open: "09:00", close: "18:00" },
        thu: { open: "09:00", close: "18:00" },
        fri: { open: "09:00", close: "18:00" },
        sat: { open: "10:00", close: "14:00" },
        sun: { open: null, close: null },
      },
      ownerId: DEV_USER_ID,
      members: {
        create: { userId: DEV_USER_ID, role: "OWNER" },
      },
      subscription: {
        create: { plan: "PRO", status: "ACTIVE" },
      },
      speciesServed: {
        create: [
          { species: "DOG" },
          { species: "CAT" },
          { species: "RABBIT" },
        ],
      },
    },
  });

  // Services
  const [serviceBanho, serviceTosa, serviceConsulta, serviceHotel] = await Promise.all([
    prisma.service.create({ data: { name: "Banho & Secagem", duration: 60, price: 25, color: "#1d4ed8", organizationId: org.id, isActive: true } }),
    prisma.service.create({ data: { name: "Tosa Completa", duration: 90, price: 45, color: "#52b788", organizationId: org.id, isActive: true } }),
    prisma.service.create({ data: { name: "Consulta de Bem-Estar", duration: 30, price: 35, color: "#74c69d", organizationId: org.id, isActive: true } }),
    prisma.service.create({ data: { name: "Hotel (por noite)", duration: 1440, price: 30, color: "#95d5b2", organizationId: org.id, isActive: true } }),
  ]);

  // Clients + pets
  const [client1, client2, client3, client4, client5] = await Promise.all([
    prisma.client.create({ data: { name: "Maria Ferreira", email: "maria@example.com", phone: "912 111 222", city: "Lisboa", organizationId: org.id } }),
    prisma.client.create({ data: { name: "João Santos", email: "joao@example.com", phone: "913 222 333", city: "Cascais", organizationId: org.id } }),
    prisma.client.create({ data: { name: "Ana Costa", email: "ana@example.com", phone: "914 333 444", city: "Sintra", organizationId: org.id } }),
    prisma.client.create({ data: { name: "Pedro Oliveira", email: "pedro@example.com", phone: "915 444 555", city: "Oeiras", organizationId: org.id } }),
    prisma.client.create({ data: { name: "Sofia Rodrigues", email: "sofia@example.com", phone: "916 555 666", city: "Almada", organizationId: org.id } }),
  ]);

  const [pet1, pet2, pet3, pet4, pet5] = await Promise.all([
    prisma.pet.create({ data: { name: "Bolinha", species: "DOG", breed: "Golden Retriever", color: "Dourado", weight: 28, birthDate: new Date("2019-03-15"), gender: "MALE", isNeutered: true, healthConditions: "Displasia da anca ligeira", allergies: "Frango", medications: "Anti-inflamatório semanal", clientId: client1.id, organizationId: org.id, vaccines: { create: [{ name: "Raiva", date: subDays(now, 180), nextDueDate: addDays(now, 185), lotNumber: "RV2024-001" }, { name: "DHPP", date: subDays(now, 90), nextDueDate: addDays(now, 275), lotNumber: "DH2024-003" }] } } }),
    prisma.pet.create({ data: { name: "Mimi", species: "CAT", breed: "Persa", color: "Branco", weight: 4.2, birthDate: new Date("2020-07-01"), gender: "FEMALE", isNeutered: true, allergies: "Látex", clientId: client2.id, organizationId: org.id, vaccines: { create: [{ name: "Tríplice Felina", date: subDays(now, 60), nextDueDate: addDays(now, 305), lotNumber: "TF2024-007" }] } } }),
    prisma.pet.create({ data: { name: "Rex", species: "DOG", breed: "Pastor Alemão", color: "Preto e castanho", weight: 32, birthDate: new Date("2018-11-20"), gender: "MALE", healthConditions: "Epilepsia controlada", medications: "Fenobarbital 30mg diário", clientId: client3.id, organizationId: org.id, vetName: "Dr. Carlos Silva", vetClinic: "Clínica Vet Lisboa", vetPhone: "211 000 111", vaccines: { create: [{ name: "Raiva", date: subDays(now, 20), nextDueDate: addDays(now, 345), lotNumber: "RV2024-012" }] } } }),
    prisma.pet.create({ data: { name: "Pipoca", species: "RABBIT", breed: "Anão Holandês", color: "Branco e cinza", weight: 1.8, birthDate: new Date("2022-02-14"), gender: "FEMALE", feedingNotes: "Feno Timothy + pellets sem açúcar", clientId: client4.id, organizationId: org.id } }),
    prisma.pet.create({ data: { name: "Luna", species: "DOG", breed: "Labrador", color: "Creme", weight: 24, birthDate: new Date("2021-05-10"), gender: "FEMALE", isNeutered: true, clientId: client5.id, organizationId: org.id, vaccines: { create: [{ name: "Raiva", date: subDays(now, 400), nextDueDate: subDays(now, 35), lotNumber: "RV2023-045" }, { name: "DHPP", date: subDays(now, 400), nextDueDate: subDays(now, 35), lotNumber: "DH2023-021" }] } } }),
  ]);

  // Appointments
  const appts = await Promise.all([
    // Today
    prisma.appointment.create({ data: { date: addHours(new Date(now.setHours(9, 0, 0, 0)), 0), endDate: addHours(new Date(now.setHours(9, 0, 0, 0)), 1), status: "CONFIRMED", clientId: client1.id, petId: pet1.id, serviceId: serviceBanho.id, price: 25, organizationId: org.id } }),
    prisma.appointment.create({ data: { date: addHours(new Date(now.setHours(10, 30, 0, 0)), 0), endDate: addHours(new Date(now.setHours(10, 30, 0, 0)), 1.5), status: "PENDING", clientId: client2.id, petId: pet2.id, serviceId: serviceTosa.id, price: 45, organizationId: org.id } }),
    prisma.appointment.create({ data: { date: addHours(new Date(now.setHours(14, 0, 0, 0)), 0), endDate: addHours(new Date(now.setHours(14, 0, 0, 0)), 1), status: "CONFIRMED", clientId: client3.id, petId: pet3.id, serviceId: serviceBanho.id, price: 25, organizationId: org.id } }),
    prisma.appointment.create({ data: { date: addHours(new Date(now.setHours(15, 30, 0, 0)), 0), endDate: addHours(new Date(now.setHours(15, 30, 0, 0)), 0.5), status: "PENDING", clientId: client5.id, petId: pet5.id, serviceId: serviceConsulta.id, price: 35, organizationId: org.id } }),
    // Tomorrow
    prisma.appointment.create({ data: { date: addDays(addHours(new Date(now.setHours(9, 0, 0, 0)), 0), 1), endDate: addDays(addHours(new Date(now.setHours(9, 0, 0, 0)), 1.5), 1), status: "CONFIRMED", clientId: client4.id, petId: pet4.id, serviceId: serviceTosa.id, price: 45, organizationId: org.id } }),
    prisma.appointment.create({ data: { date: addDays(addHours(new Date(now.setHours(11, 0, 0, 0)), 0), 1), endDate: addDays(addHours(new Date(now.setHours(11, 0, 0, 0)), 1), 1), status: "CONFIRMED", clientId: client1.id, petId: pet1.id, serviceId: serviceConsulta.id, price: 35, organizationId: org.id } }),
    // Past appointments
    prisma.appointment.create({ data: { date: subDays(addHours(new Date(now.setHours(10, 0, 0, 0)), 0), 7), endDate: subDays(addHours(new Date(now.setHours(10, 0, 0, 0)), 1), 7), status: "COMPLETED", clientId: client2.id, petId: pet2.id, serviceId: serviceBanho.id, price: 25, isPaid: true, organizationId: org.id } }),
    prisma.appointment.create({ data: { date: subDays(addHours(new Date(now.setHours(14, 0, 0, 0)), 0), 14), endDate: subDays(addHours(new Date(now.setHours(14, 0, 0, 0)), 1.5), 14), status: "COMPLETED", clientId: client3.id, petId: pet3.id, serviceId: serviceTosa.id, price: 45, isPaid: true, organizationId: org.id } }),
    prisma.appointment.create({ data: { date: subDays(addHours(new Date(now.setHours(9, 0, 0, 0)), 0), 3), endDate: subDays(addHours(new Date(now.setHours(9, 0, 0, 0)), 1), 3), status: "COMPLETED", clientId: client5.id, petId: pet5.id, serviceId: serviceBanho.id, price: 25, isPaid: true, organizationId: org.id } }),
  ]);

  // Transactions (last 6 months)
  const txDates = [-150, -120, -90, -60, -30, -15, -7, -3, -1].map(d => subDays(now, Math.abs(d)));
  await Promise.all([
    ...txDates.map((date, i) => prisma.transaction.create({ data: { type: "INCOME", amount: 150 + i * 40, description: "Serviços do dia", date, status: "PAID", method: "CARD", clientId: client1.id, organizationId: org.id } })),
    prisma.transaction.create({ data: { type: "EXPENSE", amount: 120, description: "Produtos de higiene", date: subDays(now, 45), status: "PAID", method: "TRANSFER", organizationId: org.id } }),
    prisma.transaction.create({ data: { type: "EXPENSE", amount: 80, description: "Renda equipamentos", date: subDays(now, 15), status: "PAID", method: "TRANSFER", organizationId: org.id } }),
    prisma.transaction.create({ data: { type: "INCOME", amount: 450, description: "Serviços semana", date: subDays(now, 10), status: "PAID", method: "CARD", clientId: client2.id, organizationId: org.id } }),
    prisma.transaction.create({ data: { type: "INCOME", amount: 25, description: "Banho Bolinha", date: subDays(now, 3), status: "PAID", method: "CASH", clientId: client1.id, organizationId: org.id } }),
  ]);

  // Products
  await Promise.all([
    prisma.product.create({ data: { name: "Champô Premium Cães", price: 12.90, costPrice: 6, stock: 24, minStock: 5, category: "Higiene", organizationId: org.id } }),
    prisma.product.create({ data: { name: "Champô Gatos Sensíveis", price: 11.50, costPrice: 5.5, stock: 15, minStock: 5, category: "Higiene", organizationId: org.id } }),
    prisma.product.create({ data: { name: "Tesoura de Tosa Profissional", price: 89, costPrice: 45, stock: 3, minStock: 1, category: "Equipamento", organizationId: org.id } }),
    prisma.product.create({ data: { name: "Perfume Pós-Banho", price: 8.90, costPrice: 3.5, stock: 2, minStock: 5, category: "Higiene", organizationId: org.id } }),
    prisma.product.create({ data: { name: "Secador Profissional", price: 195, costPrice: 110, stock: 1, minStock: 1, category: "Equipamento", organizationId: org.id } }),
  ]);

  return NextResponse.redirect(
    new URL(`/dashboard/${org.slug}`, "http://localhost:3002")
  );
}
