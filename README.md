# PropVault — Property Management SaaS

A world-class multi-tenant property management platform built with Next.js 14 and Supabase.

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: PostgreSQL via Supabase (with Row Level Security)
- **Auth**: Supabase Auth (email/password + OAuth ready)
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime (WebSockets)
- **State**: Zustand + TanStack Query
- **Deployment**: Vercel + Supabase

## 📦 Features

- ✅ Multi-tenant architecture with complete data isolation
- ✅ Role-based access control (RBAC)
- ✅ Property portfolio management
- ✅ Work order lifecycle tracking
- ✅ Tenant/occupant management
- ✅ Service provider directory
- ✅ Invoicing and financial tracking
- ✅ Real-time notifications
- ✅ Document storage
- ✅ Analytics dashboard
- ✅ Audit logging

## 🛠 Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd propvault
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to SQL Editor and run the scripts from:
   - `SUPABASE_SCHEMA.sql` (Database schema)
   - `SUPABASE_RLS_POLICIES.sql` (Row Level Security policies)
   - `SUPABASE_STORAGE.sql` (Storage buckets)

### 3. Configure environment

```bash
cp .env.example .env.local
# Fill in your Supabase credentials
```

### 4. Run development server

```bash
npm run dev
# Open http://localhost:3000
```

## 🚀 Deployment (Vercel)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
2. Add all environment variables from `.env.example`
3. Deploy

### 3. Configure GitHub Secrets (for CI/CD)

In your GitHub repo → Settings → Secrets → Actions, add:
- `VERCEL_TOKEN` — from vercel.com/account/tokens
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `NEXT_PUBLIC_APP_URL` | Your app URL |
| `NEXT_PUBLIC_APP_NAME` | Your app name |
| `RESEND_API_KEY` | Resend email API key (optional) |

## 🏗 Architecture

```
src/
├── app/             Next.js App Router pages + API routes
├── components/      Reusable UI components
├── hooks/           React Query + Zustand hooks
├── lib/             Supabase clients, utilities, validation
├── store/           Zustand stores
└── types/           TypeScript types
```

## 👥 User Roles

| Role | Access |
|------|--------|
| ORG_ADMIN | Full access to everything |
| PROPERTY_MANAGER | Properties, tenants, work orders |
| MAINTENANCE_STAFF | Work orders (view + update) |
| ACCOUNTANT | Invoices and financial data |
| VIEWER | Read-only access |

## 🐳 Docker

Build and run with Docker:

```bash
# Build
docker-compose build

# Run
docker-compose up

# Or use Docker directly
docker build -t propvault .
docker run -p 3000:3000 --env-file .env.local propvault
```

## 📚 Documentation

- [Batch 01](./README_BATCH_01.md) - Project Setup
- [Batch 02](./README_BATCH_02.md) - Authentication & RBAC
- [Batch 03](./README_BATCH_03.md) - Core API Routes
- [Batch 04](./BATCH_04_PROGRESS.md) - Providers, Invoices, Docs
- [Batch 05](./BATCH_05_PROGRESS.md) - Frontend Pages
- [Batch 06](./BATCH_06_PROGRESS.md) - Real-time, Docker, Deployment

## 🧪 Testing

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build
```

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
