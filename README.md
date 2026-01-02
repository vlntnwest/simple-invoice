# Invoicing for Friends 📱

SaaS de facturation B2B conçu avec une approche **Mobile-First**.
L'objectif est de permettre aux freelances de gérer leurs devis et factures aussi facilement sur smartphone que sur desktop.

## 🛠 Stack Technique (Strict)

- **Framework** : Next.js 16 (App Router, Server Actions)
- **Langage** : TypeScript
- **Database** : PostgreSQL (via Supabase)
- **ORM** : Prisma
- **Auth** : Supabase Auth
- **UI** : Tailwind CSS + shadcn/ui + Phosphor Icons
- **PDF** : @react-pdf/renderer

## 🚀 Getting Started

### 1. Installation

```bash
npm install
```

### 2. Variables d'environnement

Renommer `.env.example` en `.env.local` (si applicable) ou créer un fichier `.env.local` avec les clés Supabase :

```bash
DATABASE_URL="postgres://..."
DIRECT_URL="postgres://..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
```

### 3. Lancer le serveur de développement

```bash
npm run dev
```
