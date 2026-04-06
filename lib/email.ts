import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

const FROM = process.env.EMAIL_FROM ?? "PetBiz <no-reply@petbiz.pt>";

export async function sendInviteEmail(params: {
  to: string;
  inviteUrl: string;
  orgName: string;
  inviterName: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Convite para ${params.orgName} no PetBiz`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1d4ed8;">Convite para o PetBiz</h2>
        <p>${params.inviterName} convidou-te para juntar a <strong>${params.orgName}</strong>.</p>
        <a href="${params.inviteUrl}" style="display:inline-block;background:#1d4ed8;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Aceitar convite
        </a>
        <p style="color:#888;font-size:12px;margin-top:24px;">
          Este convite expira em 7 dias. Se não reconheces este email, podes ignorá-lo.
        </p>
      </div>
    `,
  });
}

export async function sendAppointmentConfirmation(params: {
  to: string;
  clientName: string;
  petName: string;
  serviceName: string;
  date: string;
  orgName: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Agendamento confirmado — ${params.orgName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1d4ed8;">Agendamento confirmado!</h2>
        <p>Olá ${params.clientName},</p>
        <p>O agendamento de <strong>${params.serviceName}</strong> para <strong>${params.petName}</strong> foi confirmado.</p>
        <div style="background:#f0faf5;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;"><strong>Data:</strong> ${params.date}</p>
          <p style="margin:8px 0 0;"><strong>Serviço:</strong> ${params.serviceName}</p>
        </div>
        <p>Até breve!<br><strong>${params.orgName}</strong></p>
      </div>
    `,
  });
}
