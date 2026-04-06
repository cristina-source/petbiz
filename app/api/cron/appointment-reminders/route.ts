import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { addHours, startOfHour } from "date-fns";

const resend = new Resend(process.env.RESEND_API_KEY!);

// Chamado por cron: GET /api/cron/appointment-reminders
// Configurar em Vercel Cron: "0 8 * * *" (diariamente às 8h)
// Header de autenticação: Authorization: Bearer <CRON_SECRET>

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  // Janela: marcações entre 23h e 25h a partir de agora (aproximadamente 24h)
  const from = addHours(startOfHour(now), 23);
  const to = addHours(startOfHour(now), 25);

  const appointments = await prisma.appointment.findMany({
    where: {
      deletedAt: null,
      status: { in: ["PENDING", "CONFIRMED"] },
      date: { gte: from, lte: to },
      client: { email: { not: null } },
    },
    include: {
      client: true,
      pet: true,
      service: true,
      organization: true,
    },
  });

  let sent = 0;
  let failed = 0;

  for (const appt of appointments) {
    if (!appt.client.email) continue;

    const time = new Date(appt.date).toLocaleTimeString("pt-PT", {
      hour: "2-digit", minute: "2-digit",
    });
    const date = new Date(appt.date).toLocaleDateString("pt-PT", {
      weekday: "long", day: "numeric", month: "long",
    });

    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "PetBiz <no-reply@petbiz.pt>",
        to: appt.client.email,
        subject: `Lembrete: consulta amanhã às ${time}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-flex; align-items: center; gap: 8px; background: #1d4ed8; color: white; padding: 8px 16px; border-radius: 100px; font-weight: 700; font-size: 16px;">
                🐾 PetBiz
              </div>
            </div>

            <h1 style="font-size: 22px; font-weight: 800; color: #1f1d18; margin-bottom: 8px;">
              Lembrete de consulta
            </h1>
            <p style="color: #6e6b63; margin-bottom: 24px;">
              Olá ${appt.client.name?.split(" ")[0] ?? ""}! Tens uma consulta marcada para amanhã.
            </p>

            <div style="background: #f0faf5; border: 1px solid #b0e0c9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #6e6b63; width: 120px;">Data</td>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #1f1d18; text-transform: capitalize;">${date}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #6e6b63;">Hora</td>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #1f1d18;">${time}</td>
                </tr>
                ${appt.pet ? `<tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #6e6b63;">Pet</td>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #1f1d18;">${appt.pet.name}</td>
                </tr>` : ""}
                ${appt.service ? `<tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #6e6b63;">Serviço</td>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #1f1d18;">${appt.service.name}</td>
                </tr>` : ""}
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #6e6b63;">Local</td>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #1f1d18;">${appt.organization.businessName ?? appt.organization.name}</td>
                </tr>
              </table>
            </div>

            <p style="font-size: 13px; color: #8c8880; text-align: center;">
              Se precisares de cancelar ou remarcar, contacta-nos directamente.
            </p>
          </div>
        `,
      });
      sent++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ ok: true, total: appointments.length, sent, failed });
}
