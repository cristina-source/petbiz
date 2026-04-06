"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PawPrint, Mail } from "lucide-react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const verify = searchParams.get("verify");
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const res = await signIn("resend", {
        email,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError("Ocorreu um erro. Tenta novamente.");
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl });
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Lado esquerdo — Brand */}
      <div
        className="hidden md:flex md:w-2/5 flex-col justify-between p-10"
        style={{ background: "var(--brand-600)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
            <PawPrint size={20} color="white" />
          </div>
          <span className="text-xl font-bold text-white">PetBiz</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-white leading-tight">
            O sistema operacional para o teu negócio pet
          </h1>
          <p className="text-white/75 text-base">
            Gere clientes, agenda, financeiro e muito mais — tudo num só lugar.
          </p>
          <div className="space-y-3">
            {[
              "Onboarding guiado em 5 minutos",
              "Ficha completa por pet e tutor",
              "Agenda online partilhável",
              "Dashboard financeiro em tempo real",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
                <span className="text-white/80 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/40 text-xs">
          © {new Date().getFullYear()} PetBiz. Todos os direitos reservados.
        </p>
      </div>

      {/* Lado direito — Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[var(--background)]">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "var(--brand-600)" }}
            >
              <PawPrint size={20} color="white" />
            </div>
            <span className="text-xl font-bold text-[var(--app-text)]">
              PetBiz
            </span>
          </div>

          {verify ? (
            <div className="text-center">
              <div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: "var(--brand-50)" }}
              >
                <Mail size={24} style={{ color: "var(--brand-600)" }} />
              </div>
              <h2 className="text-xl font-bold text-[var(--app-text)] mb-2">
                Verifica o teu email
              </h2>
              <p className="text-sm text-[var(--app-text-muted)]">
                Enviámos um link de acesso para o teu email. Clica no link para
                entrares na plataforma.
              </p>
            </div>
          ) : sent ? (
            <div className="text-center">
              <div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: "var(--brand-50)" }}
              >
                <Mail size={24} style={{ color: "var(--brand-600)" }} />
              </div>
              <h2 className="text-xl font-bold text-[var(--app-text)] mb-2">
                Email enviado!
              </h2>
              <p className="text-sm text-[var(--app-text-muted)]">
                Enviámos um link de acesso para{" "}
                <strong className="text-[var(--app-text)]">{email}</strong>.
                Verifica a tua caixa de entrada.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[var(--app-text)]">
                  Entrar na plataforma
                </h2>
                <p className="text-sm text-[var(--app-text-muted)] mt-1">
                  Sem palavra-passe. Seguro e simples.
                </p>
              </div>

              <div className="space-y-4">
                {/* Google */}
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleGoogle}
                  loading={googleLoading}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continuar com Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--border)]" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[var(--background)] px-3 text-[var(--app-text-muted)]">
                      ou por email
                    </span>
                  </div>
                </div>

                <form onSubmit={handleMagicLink} className="space-y-3">
                  <Input
                    type="email"
                    label="Email"
                    placeholder="nome@empresa.pt"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    error={error}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    loading={loading}
                  >
                    <Mail size={16} />
                    Enviar link de acesso
                  </Button>
                </form>
              </div>

              <p className="mt-6 text-center text-xs text-[var(--app-text-muted)]">
                Ao entrares, aceitas os nossos{" "}
                <a
                  href="/termos"
                  className="text-[var(--brand-600)] hover:underline"
                >
                  Termos de Serviço
                </a>{" "}
                e{" "}
                <a
                  href="/privacidade"
                  className="text-[var(--brand-600)] hover:underline"
                >
                  Política de Privacidade
                </a>
                .
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
