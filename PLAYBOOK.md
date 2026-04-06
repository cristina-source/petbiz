# PLAYBOOK — PetBiz
> Sistema operacional multi-tenant para negócios pet
> Última actualização: 2026-04-04

---

## 1. VISÃO GERAL

| Campo | Detalhe |
|-------|---------|
| **Produto** | Plataforma operacional SaaS para pet shops, grooming, clínicas vet, hotéis de pets |
| **Fase** | MVP — estrutura completa, módulos em desenvolvimento activo |
| **Modelo** | SaaS multi-tenant por subscrição (FREE / STARTER / PRO / TEAM) |
| **Diferencial** | Multi-tenant real com onboarding wizard + módulos especializados por tipo de negócio pet |

---

## 2. STACK TÉCNICA

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 16.2.2 |
| UI | React | 19.2.4 |
| Styling | Tailwind CSS v4 | 4.x |
| ORM | Prisma | 7.6.0 |
| Base de dados | PostgreSQL (Neon) | — |
| Autenticação | NextAuth v5 beta | 5.0.0-beta.30 |
| Email | Resend | 6.10.0 |
| Pagamentos | Stripe | 22.0.0 |
| Gráficos | Recharts | 3.8.1 |
| Formulários | React Hook Form + Hookform Resolvers | 7.x |
| Fontes | Sistema (não definido explicitamente) | — |

---

## 3. ARQUITECTURA DE BASE DE DADOS

### Hierarquia multi-tenant
```
User
└── Organization[] (via OrgMember)
    ├── OrgMember[] (com roles)
    ├── Subscription (1:1)
    ├── Invite[]
    ├── Client[]
    │   └── Pet[]
    ├── Appointment[]
    ├── Service[]
    ├── Product[]
    ├── Transaction[]
    ├── Resource[]
    └── AuditLog[]
```

### Roles de organização
`OWNER` > `ADMIN` > `MANAGER` > `COLLABORATOR` > `VET`

### Routing multi-tenant
`/dashboard/[orgSlug]/...` — isolamento por organização via slug na URL

### Enums principais
- `BusinessType`: (pet shop, grooming, clínica vet, hotel, etc.)
- `Species`: 9 tipos de espécies
- `Plan`: FREE, STARTER, PRO, TEAM
- `SubscriptionStatus`: FREE, ACTIVE, CANCELED, PAST_DUE, TRIALING

### Padrões aplicados
- ✅ `deletedAt DateTime?` em User e Organization (soft deletes)
- ✅ Multi-tenant via Organization + orgSlug
- ✅ RBAC com 5 roles específicos ao domínio pet
- ✅ AllowedEmail whitelist
- ✅ AuditLog global
- ✅ onboardingStep + onboardingDone no Organization
- ✅ OrgSpecies para configuração por organização
- ⚠️ Falta `deletedAt` nos modelos filhos (Client, Pet, Appointment, etc.)

---

## 4. AUTENTICAÇÃO & SEGURANÇA

### Fluxo
- NextAuth v5 com Prisma Adapter
- Providers: Google OAuth + Resend (magic link)
- Scope Google: restrito (openid, email, profile)
- Middleware protege tudo excepto: `/`, `/login`, `/api/auth`, `/api/webhooks`, assets estáticos
- Redirect com `callbackUrl` preservado após login

### Controlo de acesso
- `AllowedEmail` whitelist activa
- RBAC por organização via OrgMember.role
- Onboarding obrigatório antes de aceder ao dashboard

### Segurança — Estado
- ✅ Whitelist de emails
- ✅ Middleware de auth global
- ✅ AuditLog
- ✅ callbackUrl preservado
- ✅ Assets estáticos excluídos do matcher (SVG, PNG, JPG, etc.)
- ⚠️ Sem security headers (CSP, X-Frame-Options)
- ⚠️ Sem rate limiting em rotas de API sensíveis

---

## 5. DESIGN SYSTEM

### Tokens CSS (globals.css) — melhor sistema dos 4 projectos
```css
/* Brand — Verde Floresta */
--brand-50 até --brand-900   /* escala completa */
--gray-50 até --gray-900     /* cinza quente */

/* App tokens */
--background: #ffffff (light) / #111210 (dark)
--sidebar-bg: var(--brand-600)     /* sidebar verde */
--app-text: var(--gray-900)
--app-text-muted: var(--gray-500)
--border: var(--gray-200)
--card-bg: #ffffff
--radius: 0.625rem
--radius-sm: 0.375rem
--radius-lg: 1rem

/* Status semânticos */
--status-pending: #f59e0b
--status-confirmed: #3b82f6
--status-completed: #10b981
--status-cancelled: #ef4444
--status-inprogress: #8b5cf6
```

### Modo
- ✅ Light mode base + dark mode via `@media (prefers-color-scheme: dark)`
- Sidebar verde floresta em ambos os modos
- Tokens bem definidos para ambos os modos

### Fontes
- ⚠️ Não definida explicitamente no CSS — usa fallback do sistema
- Recomendação: adicionar Inter via `next/font`

---

## 6. ESTRUTURA DE ROTAS

```
app/
├── (auth)/
│   └── login/
├── onboarding/          ← wizard de setup
├── dashboard/
│   └── [orgSlug]/
│       ├── layout.tsx   ← sidebar + topbar org-specific
│       ├── page.tsx     ← dashboard principal
│       ├── clientes/
│       │   ├── page.tsx
│       │   ├── novo/
│       │   └── [clientId]/
│       ├── pets/
│       │   └── [petId]/
│       ├── agenda/
│       ├── catalogo/
│       ├── financeiro/
│       └── definicoes/
└── api/
    ├── auth/
    ├── orgs/
    └── webhooks/
```

---

## 7. AUDITORIA SAAS — SCORE: 8.5/10 (após verificação real)

### 🔴 CRÍTICOS

**C1 — Security headers** — ✅ Já implementados: `next.config.ts` tem CSP completo, X-Frame-Options, Referrer-Policy

**C2 — Soft deletes nos modelos filhos** — ✅ Já implementados: `deletedAt` existe em Client, Pet, Appointment, Transaction, Service, Product, Resource

**C3 — Fonte não definida** — ⚠️ Pendente: sem font stack explícito no layout.tsx (usa fallback do sistema)

### 🟡 IMPORTANTES (próximo sprint)

**I1 — Onboarding wizard — estado desconhecido**
- Impacto: Se não redirecionar automaticamente para onboarding após primeiro login, utilizador fica perdido
- Solução: Verificar se middleware ou layout do dashboard faz redirect quando `onboardingDone === false`

**I2 — Verificação de acesso por orgSlug no layout**
- Impacto: Utilizador pode aceder a `/dashboard/outro-slug/` se souber o URL
- Solução: No layout do `[orgSlug]`, verificar que `session.user` é membro da organização

**I3 — Sem empty states documentados**
- Impacto: Negócio novo não sabe o que fazer no primeiro acesso
- Solução: Empty states em clientes, pets, agenda, catálogo com CTA "Adicionar primeiro X"

**I4 — `prisma generate` só no build**
- Impacto: Developers novos têm erro no dev sem correr build primeiro
- Solução: Adicionar `"postinstall": "prisma generate"` ao package.json

### 🟢 MELHORIAS (versão premium)

**M1 — Dashboard com KPIs de negócio**
- Solução: Cards com total clientes, consultas hoje, receita do mês, pets activos

**M2 — Agenda com vista de calendário**
- Solução: Recharts timeline ou integração Google Calendar

**M3 — Relatórios financeiros**
- Solução: Gráfico de receita mensal + breakdown por tipo de serviço

**M4 — App mobile-first**
- Solução: Bottom navigation para rececionista em tablet/mobile

---

## 8. O QUE ESTÁ BEM

- ✅ **Melhor design system dos 4 projectos** — tokens completos, dark mode, status semânticos
- ✅ Multi-tenant real com orgSlug routing
- ✅ RBAC com roles específicos ao domínio (VET é excelente diferenciador)
- ✅ Onboarding wizard integrado no schema (onboardingStep, onboardingDone)
- ✅ OrgSpecies para configuração personalizada por negócio
- ✅ Callbackurl preservado no login — boa UX
- ✅ Matcher de middleware exclui correctamente assets estáticos
- ✅ React Hook Form para formulários complexos (pets, clientes)

---

## 9. DECISÕES DE ARQUITECTURA

| Decisão | Motivo |
|---------|--------|
| Multi-tenant via orgSlug | Cada negócio pet tem o seu espaço isolado |
| 5 roles (incl. VET) | Clínicas veterinárias têm acesso diferenciado a fichas de saúde |
| Verde Floresta como brand | Natureza, animais, saúde — coerente com sector pet |
| Light mode base | Produto para uso diurno em balcão/recepção |
| Onboarding wizard | Reduz friction no primeiro acesso, define businessType que configura o produto |
| OrgSpecies | Flexibilidade: grooming só precisa de cão/gato; clínica vet trata reptéis |

---

## 10. AMBIENTE

```bash
# Setup
npm install
# prisma generate corre automático no build (adicionar postinstall)

# Variáveis necessárias
DATABASE_URL=
DATABASE_URL_UNPOOLED=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
AUTH_RESEND_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_FROM_EMAIL=

# Dev
npm run dev
npm run db:studio
npm run db:push  # setup inicial
```

---

## 11. ROADMAP SUGERIDO

### Fase 1 — Beta fechado (agora)
- [ ] Security headers em next.config.ts
- [ ] Soft deletes em Client, Pet, Appointment, Transaction
- [ ] Fonte Inter via next/font
- [ ] postinstall: prisma generate
- [ ] Validar redirect onboarding no middleware/layout
- [ ] Validar autorização de orgSlug no layout [orgSlug]

### Fase 2 — Lançamento público
- [ ] Dashboard KPIs (clientes, receita, agenda do dia)
- [ ] Empty states em todos os módulos
- [ ] Notificações de consulta por email (Resend)
- [ ] Relatórios financeiros básicos
- [ ] Exportar dados (PDF/CSV)

### Fase 3 — Crescimento
- [ ] Módulo de saúde pet completo (vacinas, condições, medicação)
- [ ] Agendamento online para clientes finais
- [ ] App mobile (PWA ou React Native)
- [ ] Integrações (Google Calendar, WhatsApp Business)

---

## 12. ERROS RESOLVIDOS / HISTÓRICO

| Data | Problema | Solução |
|------|---------|---------|
| — | — | — |

*(actualizar após cada sessão de trabalho)*
