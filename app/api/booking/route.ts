import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { addMinutes } from "date-fns";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orgSlug, name, email, phone, petName, serviceId, date, notes } = body;

    if (!orgSlug || !name || !date) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({
      where: { slug: orgSlug, deletedAt: null },
    });
    if (!org) return NextResponse.json({ error: "Negócio não encontrado" }, { status: 404 });

    const service = serviceId
      ? await prisma.service.findFirst({ where: { id: serviceId, organizationId: org.id, deletedAt: null } })
      : null;

    // Find or create client
    let client = email
      ? await prisma.client.findFirst({ where: { organizationId: org.id, email, deletedAt: null } })
      : null;

    if (!client) {
      client = await prisma.client.create({
        data: {
          name,
          email: email || null,
          phone: phone || null,
          organizationId: org.id,
        },
      });
    }

    // Create pet if name provided and no existing pet
    let pet = petName
      ? await prisma.pet.findFirst({ where: { clientId: client.id, name: petName, deletedAt: null } })
      : null;

    if (petName && !pet) {
      pet = await prisma.pet.create({
        data: {
          name: petName,
          species: "OTHER",
          clientId: client.id,
          organizationId: org.id,
        },
      });
    }

    const apptDate = new Date(date);
    const duration = service?.duration ?? 60;
    const appointment = await prisma.appointment.create({
      data: {
        date: apptDate,
        endDate: addMinutes(apptDate, duration),
        status: "PENDING",
        notes: notes || null,
        price: service?.price ?? null,
        clientId: client.id,
        petId: pet?.id ?? null,
        serviceId: service?.id ?? null,
        organizationId: org.id,
      },
    });

    // Send confirmation email
    if (email) {
      const dateStr = apptDate.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      const timeStr = apptDate.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "PetBiz <no-reply@petbiz.pt>",
        to: email,
        subject: `Marcação recebida — ${org.businessName ?? org.name}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-flex; align-items: center; gap: 8px; background: #1d4ed8; color: white; padding: 8px 16px; border-radius: 100px; font-weight: 700; font-size: 16px;">
                🐾 PetBiz
              </div>
            </div>
            <h1 style="font-size: 22px; font-weight: 800; color: #1f1d18; margin-bottom: 8px;">Marcação recebida!</h1>
            <p style="color: #6e6b63; margin-bottom: 24px;">
              Olá ${name.split(" ")[0]}! A tua marcação em <strong>${org.businessName ?? org.name}</strong> foi registada com sucesso. Aguarda confirmação.
            </p>
            <div style="background: #f0faf5; border: 1px solid #b0e0c9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #6e6b63; width: 120px;">Data</td>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #1f1d18; text-transform: capitalize;">${dateStr}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #6e6b63;">Hora</td>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #1f1d18;">${timeStr}</td>
                </tr>
                ${petName ? `<tr><td style="padding: 4px 0; font-size: 13px; color: #6e6b63;">Pet</td><td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #1f1d18;">${petName}</td></tr>` : ""}
                ${service ? `<tr><td style="padding: 4px 0; font-size: 13px; color: #6e6b63;">Serviço</td><td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #1f1d18;">${service.name}</td></tr>` : ""}
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #6e6b63;">Local</td>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #1f1d18;">${org.businessName ?? org.name}</td>
                </tr>
              </table>
            </div>
            <p style="font-size: 13px; color: #8c8880; text-align: center;">
              Receberás uma confirmação assim que a marcação for aceite.
            </p>
          </div>
        `,
      }).catch(() => {}); // Don't fail if email fails
    }

    return NextResponse.json({ ok: true, appointmentId: appointment.id });
  } catch (err) {
    console.error("[booking]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
