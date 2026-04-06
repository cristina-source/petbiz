import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { AcceptInviteForm } from "./accept-form";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params;

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { organization: { select: { name: true, businessName: true, slug: true } } },
  });

  if (!invite || invite.acceptedAt) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)" }}>
        <div style={{ maxWidth: "400px", textAlign: "center", padding: "40px 24px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <span style={{ fontSize: "24px" }}>!</span>
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--app-text)", marginBottom: "8px" }}>
            Convite inválido
          </h1>
          <p style={{ fontSize: "14px", color: "var(--app-text-muted)", marginBottom: "24px" }}>
            {invite?.acceptedAt
              ? "Este convite já foi aceite."
              : "Este convite não existe ou expirou. Pede ao administrador para enviar um novo."}
          </p>
          <a
            href="/login"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              height: "38px", padding: "0 20px", borderRadius: "8px",
              background: "var(--brand-600)", color: "white",
              fontSize: "14px", fontWeight: 600, textDecoration: "none",
            }}
          >
            Ir para login
          </a>
        </div>
      </div>
    );
  }

  if (new Date(invite.expiresAt) < new Date()) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)" }}>
        <div style={{ maxWidth: "400px", textAlign: "center", padding: "40px 24px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <span style={{ fontSize: "24px" }}>⏱</span>
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--app-text)", marginBottom: "8px" }}>
            Convite expirado
          </h1>
          <p style={{ fontSize: "14px", color: "var(--app-text-muted)", marginBottom: "24px" }}>
            Este convite expirou. Pede ao administrador da organização para enviar um novo.
          </p>
          <a
            href="/login"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              height: "38px", padding: "0 20px", borderRadius: "8px",
              background: "var(--brand-600)", color: "white",
              fontSize: "14px", fontWeight: 600, textDecoration: "none",
            }}
          >
            Ir para login
          </a>
        </div>
      </div>
    );
  }

  const session = await getSession();
  const orgName = invite.organization.businessName ?? invite.organization.name;
  const orgSlug = invite.organization.slug;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)" }}>
      <div
        style={{
          width: "100%", maxWidth: "420px", padding: "40px 32px",
          background: "var(--card-bg)", borderRadius: "16px",
          border: "1px solid var(--border)", boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "56px", height: "56px", borderRadius: "14px",
              background: "var(--brand-50)", display: "flex",
              alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", fontSize: "24px",
            }}
          >
            🐾
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--app-text)", marginBottom: "6px" }}>
            Convite para {orgName}
          </h1>
          <p style={{ fontSize: "14px", color: "var(--app-text-muted)" }}>
            Foste convidado para juntar-te à equipa como <strong>{invite.role}</strong>.
          </p>
        </div>

        <div
          style={{
            padding: "14px 16px", borderRadius: "10px",
            background: "var(--gray-50)", border: "1px solid var(--border)",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
            <span style={{ color: "var(--app-text-muted)" }}>Organização</span>
            <span style={{ fontWeight: 600, color: "var(--app-text)" }}>{orgName}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
            <span style={{ color: "var(--app-text-muted)" }}>Papel</span>
            <span style={{ fontWeight: 600, color: "var(--app-text)" }}>{invite.role}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
            <span style={{ color: "var(--app-text-muted)" }}>Email</span>
            <span style={{ fontWeight: 500, color: "var(--app-text)" }}>{invite.email}</span>
          </div>
        </div>

        <AcceptInviteForm
          token={token}
          orgSlug={orgSlug}
          isLoggedIn={!!session?.user?.id}
          userEmail={session?.user?.email ?? undefined}
          inviteEmail={invite.email}
        />
      </div>
    </div>
  );
}
