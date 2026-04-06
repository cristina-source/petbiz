"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MoreVertical, Trash2, UserPlus, X } from "lucide-react";
import Link from "next/link";

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
}

interface MembersSectionProps {
  orgSlug: string;
  initialMembers: Member[];
  currentUserId: string;
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Dono",
  ADMIN: "Admin",
  MANAGER: "Manager",
  COLLABORATOR: "Colaborador",
  VET: "Veterinário",
};

const EDITABLE_ROLES = ["ADMIN", "MANAGER", "COLLABORATOR", "VET"];

export function MembersSection({ orgSlug, initialMembers, currentUserId }: MembersSectionProps) {
  const [members, setMembers] = useState(initialMembers);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [roleMenu, setRoleMenu] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/orgs/${orgSlug}/invites`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setInvites)
      .catch(() => {});
  }, [orgSlug]);

  async function changeRole(memberId: string, newRole: string) {
    setRoleMenu(null);
    setOpenMenu(null);
    const res = await fetch(`/api/orgs/${orgSlug}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
    }
  }

  async function removeMember(memberId: string) {
    if (!confirm("Tens a certeza que queres remover este membro?")) return;
    setRemoving(memberId);
    const res = await fetch(`/api/orgs/${orgSlug}/members/${memberId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    }
    setRemoving(null);
    setOpenMenu(null);
  }

  async function cancelInvite(inviteId: string) {
    const res = await fetch(`/api/orgs/${orgSlug}/invites/${inviteId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    }
  }

  const currentMember = members.find((m) => m.user.id === currentUserId);
  const isOwnerOrAdmin = currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";

  return (
    <div
      style={{
        background: "var(--card-bg)",
        borderRadius: "12px",
        border: "1px solid var(--border)",
        boxShadow: "var(--card-shadow)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--app-text)", margin: 0 }}>
          Membros da equipa
          <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--app-text-muted)", marginLeft: "8px" }}>
            ({members.length})
          </span>
        </p>
        {isOwnerOrAdmin && (
          <Link
            href={`/dashboard/${orgSlug}/definicoes/convidar`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              color: "var(--brand-600)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            <UserPlus size={13} />
            Convidar
          </Link>
        )}
      </div>

      {/* Members list */}
      {members.map((member) => {
        const isCurrentUser = member.user.id === currentUserId;
        const canManage = isOwnerOrAdmin && !isCurrentUser && member.role !== "OWNER";

        return (
          <div
            key={member.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "14px 24px",
              borderBottom: "1px solid var(--border)",
              position: "relative",
            }}
          >
            <div
              style={{
                height: "36px",
                width: "36px",
                borderRadius: "50%",
                background: "var(--brand-100)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--brand-700)",
                flexShrink: 0,
              }}
            >
              {member.user.name?.[0]?.toUpperCase() ?? member.user.email?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--app-text)",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {member.user.name ?? member.user.email}
                {isCurrentUser && (
                  <span style={{ fontSize: "11px", color: "var(--app-text-muted)", marginLeft: "6px" }}>(tu)</span>
                )}
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--app-text-muted)",
                  margin: "2px 0 0",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {member.user.email}
              </p>
            </div>
            <Badge variant="brand">{ROLE_LABELS[member.role] ?? member.role}</Badge>

            {canManage && (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setOpenMenu(openMenu === member.id ? null : member.id)}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    border: "none",
                    background: openMenu === member.id ? "var(--gray-100)" : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--app-text-muted)",
                  }}
                >
                  <MoreVertical size={14} />
                </button>

                {openMenu === member.id && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "32px",
                      width: "180px",
                      background: "var(--card-bg)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      zIndex: 50,
                      overflow: "hidden",
                    }}
                  >
                    <button
                      onClick={() => setRoleMenu(roleMenu === member.id ? null : member.id)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        fontSize: "13px",
                        color: "var(--app-text)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      Alterar papel
                    </button>

                    {roleMenu === member.id && (
                      <div style={{ borderTop: "1px solid var(--border)", padding: "4px" }}>
                        {EDITABLE_ROLES.map((r) => (
                          <button
                            key={r}
                            onClick={() => changeRole(member.id, r)}
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              fontSize: "12px",
                              color: member.role === r ? "var(--brand-600)" : "var(--app-text)",
                              fontWeight: member.role === r ? 600 : 400,
                              background: member.role === r ? "var(--brand-50)" : "none",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              textAlign: "left",
                            }}
                          >
                            {ROLE_LABELS[r]}
                          </button>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => removeMember(member.id)}
                      disabled={removing === member.id}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        fontSize: "13px",
                        color: "#dc2626",
                        background: "none",
                        border: "none",
                        borderTop: "1px solid var(--border)",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Trash2 size={12} />
                      Remover membro
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Pending invites */}
      {invites.length > 0 && (
        <>
          <div
            style={{
              padding: "12px 24px",
              background: "var(--gray-50)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--app-text-muted)", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Convites pendentes ({invites.length})
            </p>
          </div>
          {invites.map((invite) => (
            <div
              key={invite.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "14px 24px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  height: "36px",
                  width: "36px",
                  borderRadius: "50%",
                  background: "var(--gray-100)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Clock size={14} style={{ color: "var(--app-text-muted)" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--app-text)",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {invite.email}
                </p>
                <p style={{ fontSize: "11px", color: "var(--app-text-muted)", margin: "2px 0 0" }}>
                  Expira em {Math.ceil((new Date(invite.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dias
                </p>
              </div>
              <Badge variant="default">{ROLE_LABELS[invite.role] ?? invite.role}</Badge>
              {isOwnerOrAdmin && (
                <button
                  onClick={() => cancelInvite(invite.id)}
                  title="Cancelar convite"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--app-text-muted)",
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
