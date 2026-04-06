# PetBiz

Multi-tenant SaaS platform for pet businesses (grooming, vet clinics, pet shops, hotels, training, and more). Built with Next.js 16, Prisma 7, Stripe billing, NextAuth v5, and Resend for transactional email.

## Features

- Multi-tenant organizations with role-based access (Owner, Admin, Manager, Collaborator, Vet)
- Client and pet management with health records and vaccine tracking
- Appointment scheduling with status workflow
- Services and product catalog with inventory
- Financial transactions and reporting
- Stripe-based subscription billing (Free, Starter, Pro, Team)
- Google OAuth and magic-link (Resend) authentication
- Onboarding wizard per organization
- Cron-based appointment reminders
- Public booking page per organization
- Audit logging

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL via Prisma 7 (with `@prisma/adapter-pg`)
- **Auth:** NextAuth v5 (beta)
- **Billing:** Stripe (subscriptions + webhooks)
- **Email:** Resend
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript 5

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

See `.env.example` for all required variables and descriptions.

### 3. Set up the database

```bash
npx prisma db push
```

To seed demo data (development only):

```bash
npm run db:seed
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) to view the app.

## Deploying to Vercel

1. Push the repository to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Add all environment variables from `.env.example` in the Vercel project settings.
   - `NEXTAUTH_URL` can be omitted on Vercel; it auto-detects via `VERCEL_URL`.
   - Set `NEXT_PUBLIC_APP_URL` to your production domain.
4. Vercel will run `prisma generate && next build` automatically (configured in `package.json`).
5. Set up the Stripe webhook to point to `https://yourdomain.com/api/webhooks/stripe`.
6. The cron job for appointment reminders is configured in `vercel.json` (daily at 08:00 UTC).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port 3002 |
| `npm run build` | Generate Prisma client and build for production |
| `npm run start` | Start production server |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:push` | Push schema to database (no migration) |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed database with demo data |
