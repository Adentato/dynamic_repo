# Documentation Technique - UX Repository

**Date**: 22/12/2025  
**Version**: 1.0  
**Status**: Phase 1 Optimisée - Prêt pour Phase 2

---

## 📋 Table des matières

1. [Stack technologique](#stack-technologique)
2. [Architecture générale](#architecture-générale)
3. [Structure du projet](#structure-du-projet)
4. [Flux d'authentification](#flux-dauthentification)
5. [Système multi-tenant](#système-multi-tenant)
6. [Modèles de données](#modèles-de-données)
7. [Configuration Supabase](#configuration-supabase)
8. [Patterns et conventions](#patterns-et-conventions)
9. [Installation et démarrage](#installation-et-démarrage)
10. [FAQ Développeur](#faq-développeur)

---

## 🛠️ Stack technologique

### Frontend
- **Framework**: Next.js 16.1.0 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: TailwindCSS 3.x
- **Forms**: React Hook Form + Zod (validation)
- **UI Components**: ShadcnUI (composants réutilisables)
- **HTTP Client**: Supabase JS SDK

### Backend
- **Runtime**: Node.js (via Next.js)
- **Server Actions**: Next.js Server Actions (RPC-style)
- **Authentication**: Supabase Auth (JWT-based)
- **Database**: PostgreSQL 15 (via Supabase)
- **Security**: Row Level Security (RLS) policies

### Infrastructure
- **Hosting**: Vercel (ou autre)
- **Database**: Supabase (PostgreSQL managed)
- **Storage**: Supabase Storage (S3-compatible)

---

## 🏗️ Architecture générale

```
┌─────────────────────────────────────────────────────────┐
│                     Browser / Client                     │
│  (Next.js Pages + React Components + TailwindCSS)      │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP/JSON
                   ▼
┌─────────────────────────────────────────────────────────┐
│                Next.js App Router                        │
│  ├─ Server Components (layout.tsx, pages.tsx)          │
│  ├─ Client Components (use client)                      │
│  ├─ Server Actions (app/actions/)                       │
│  └─ API Routes (optionnel)                              │
└──────────────────┬──────────────────────────────────────┘
                   │ SQL Queries
                   ▼
┌─────────────────────────────────────────────────────────┐
│              Supabase PostgreSQL                         │
│  ├─ Tables: profiles, organizations, org_members       │
│  ├─ Auth: email/password authentication                │
│  ├─ RLS: Row Level Security policies                   │
│  └─ Storage: Files (future)                            │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Structure du projet

```
project-root/
├── app/                              # Next.js App Router
│   ├── (app)/                        # Routes protégées
│   │   └── dashboard/
│   │       └── page.tsx             # Dashboard principal
│   ├── (auth)/                       # Routes publiques auth
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── onboarding/page.tsx      # Créer organization
│   ├── actions/
│   │   └── auth.ts                  # Server Actions pour auth
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Home page
│   └── globals.css                   # Styles globaux
│
├── components/                        # Composants React réutilisables
│   ├── Navbar.tsx                    # Navigation (server component)
│   ├── UserMenu.tsx                  # Menu utilisateur (client component)
│   └── ui/                           # Composants ShadcnUI
│       ├── button.tsx
│       ├── form.tsx
│       ├── input.tsx
│       └── [autres...]
│
├── lib/                               # Utilitaires et logique métier
│   ├── supabase/
│   │   ├── server.ts                 # Client Supabase serveur
│   │   ├── auth.ts                   # Fonctions auth (getCurrentUser)
│   │   └── client.ts                 # Client Supabase côté client
│   ├── validations/
│   │   ├── auth.ts                   # Schémas Zod pour signup/login
│   │   └── workspace.ts              # Schémas pour organizations
│   └── utils.ts                       # Utilitaires génériques
│
├── types/
│   └── database.ts                   # Types TypeScript pour DB
│
├── middleware.ts                      # [FUTURE] Middleware Next.js
├── proxy.ts                           # [ACTUEL] Middleware personnalisé
│
├── supabase/                         # Configuration Supabase
│   ├── migrations/
│   │   └── 20251222145400_create_initial_schema.sql
│   └── config.json
│
├── public/                            # Fichiers statiques
├── .env.local                         # Variables d'environnement (local)
├── package.json                       # Dépendances
├── tsconfig.json                      # Config TypeScript
├── tailwind.config.ts                 # Config TailwindCSS
├── next.config.ts                     # Config Next.js
├── .gitignore
└── ARCHITECTURE.md                    # Ce fichier
```

---

## 🔐 Flux d'authentification

### 1. Inscription (Sign Up)

```
User clicks "S'inscrire" (Signup Page)
     ↓
Form validation with Zod
     ↓
signUpAction() called (Server Action)
     ├─ Call supabase.auth.signUp()
     │   └─ Crée utilisateur dans auth.users
     │   └─ Trigger crée profil dans profiles table
     ├─ Poll jusqu'à ce que profil existe (pollUntil)
     ├─ Call supabase.auth.signInWithPassword()
     │   └─ User est maintenant authentifié (JWT en cookies)
     ├─ revalidatePath() - invalide cache Next.js
     └─ redirect('/onboarding') - Server Action redirect
     ↓
Onboarding Page - Créer Organization
     ├─ User remplit: name, slug, description
     ├─ createOrganizationAction() appelée
     │   ├─ Insère dans organizations table
     │   ├─ Insère dans organization_members table
     │   └─ RLS policies vérifient auth.uid() = user_id
     └─ redirect('/dashboard')
     ↓
Dashboard - Utilisateur connecté ✅
```

### 2. Connexion (Sign In)

```
User clicks "Se connecter" (Login Page)
     ↓
Form validation with Zod
     ↓
signInAction() called (Server Action)
     ├─ Call supabase.auth.signInWithPassword()
     │   └─ Valide credentials vs auth.users
     │   └─ Retourne JWT token en cookies
     ├─ revalidatePath() 
     └─ redirect('/dashboard')
     ↓
Middleware/Proxy checks auth
     ├─ Lecture cookies pour JWT
     ├─ Récupère user info
     └─ Autorise accès à /dashboard
     ↓
Dashboard - Utilisateur connecté ✅
```

### 3. État d'authentification actuel

```
getCurrentUser() (lib/supabase/auth.ts)
     ├─ Récupère JWT des cookies
     ├─ Query profiles table (RLS: sees own profile)
     ├─ Query organization_members (RLS: sees own memberships)
     └─ Retourne { profile, organization }
     
Utilisé par:
     ├─ app/page.tsx - Affiche buttons conditionnels
     ├─ components/Navbar.tsx - Affiche user info
     └─ app/(app)/dashboard/page.tsx - Contrôle accès
```

---

## 🏢 Système multi-tenant

### Concepts clés

- **Tenant**: Organisation (workspace)
- **User**: Utilisateur authentifié (auth.users)
- **Membership**: Relation user ↔ organization

### Tables relatives

```sql
organizations
├─ id (UUID, PK)
├─ name (text)
├─ slug (text, UNIQUE)
├─ created_by (UUID, FK → auth.users)
└─ description (text, optional)

organization_members
├─ id (UUID, PK)
├─ organization_id (UUID, FK → organizations)
├─ user_id (UUID, FK → auth.users)
├─ role (text: 'owner', 'member', etc.)
└─ UNIQUE(organization_id, user_id)
```

### Isolation des données

Chaque requête Supabase respecte les RLS policies:

```typescript
// Même si un user essaie de tricher, les RLS policies l'empêchent
const organizations = await supabase
  .from('organizations')
  .select('*')
  // RLS policy: voir organisations où user_id est dans organization_members
  // OU organisations créées par user

// Result: Seulement orgs où user a accès
```

---

## 📊 Modèles de données

### Profile (Utilisateur)

```typescript
interface Profile {
  id: string              // UUID (FK → auth.users)
  email: string           // Unique
  full_name: string
  avatar_url?: string
  created_at: string      // timestamptz
  updated_at: string      // timestamptz
}
```

**Comment créé**: 
- Trigger Supabase lors de `auth.signUp()`
- Données: email, full_name depuis options.data

### Organization (Workspace)

```typescript
interface Organization {
  id: string              // UUID
  name: string
  slug: string            // Unique
  description?: string
  created_by: string      // UUID (FK → auth.users)
  created_at: string
  updated_at: string
}
```

**Comment créé**:
- Utilisateur crée via formul aire onboarding
- `createOrganizationAction()` insère

### OrganizationMember (Membership)

```typescript
interface OrganizationMember {
  id: string              // UUID
  organization_id: string // FK → organizations
  user_id: string         // FK → auth.users
  role: string            // 'owner', 'member', 'viewer'
  created_at: string
}
```

**Comment créé**:
- Automatiquement lors de création organization (role='owner')
- Future: Admin peut ajouter membres

---

## 🔒 Configuration Supabase

### Row Level Security (RLS) Enabled

Toutes les tables ont RLS activée:

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
```

### Policies (Exemples)

**Profiles - Users voient leur profil**
```sql
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO public
  USING ((auth.uid() = id));
```

**Organizations - Users voient orgs où ils sont membres**
```sql
CREATE POLICY "Users can view organizations" ON public.organizations
  FOR SELECT TO public
  USING (
    (auth.uid() = created_by) OR
    (id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );
```

### Migration SQL

Voir: `supabase/migrations/20251222145400_create_initial_schema.sql`

---

## 🎯 Patterns et conventions

### Server Actions vs API Routes

✅ **Utilisé**: Server Actions (app/actions/auth.ts)
- Simples mutations de données
- Pas besoin CORS
- Gestion erreurs facile
- Type-safe avec TypeScript

❌ **Pas utilisé**: API Routes
- Plus complexe pour ce use case
- Surtout pour webhooks futures

### Server Components vs Client Components

**Server Components** (default):
```typescript
// app/page.tsx - Server Component
export default async function Home() {
  const user = await getCurrentUser()
  // Peut directement call DB, pas de state
  return <Navbar currentUser={user} />
}
```

**Client Components** (explicite):
```typescript
// components/UserMenu.tsx - Client Component
'use client'
import { useRouter } from 'next/navigation'

export function UserMenu({ user }) {
  const [open, setOpen] = useState(false)
  // Peut utiliser hooks, événements souris, etc.
}
```

### Type Safety

- **Zod schemas** pour validation
- **TypeScript types** pour données DB
- **Strict mode** activé

```typescript
const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
type LoginInput = z.infer<typeof formSchema>
```

### Error Handling

Try-catch dans Server Actions:
```typescript
export async function signUpAction(data: SignUpInput) {
  try {
    const result = await supabase.auth.signUp(...)
    if (error) return { error: error.message }
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Erreur serveur' }
  }
}
```

---

## 🚀 Installation et démarrage

### Prérequis

- Node.js 18+
- npm ou pnpm
- Compte Supabase
- Variables d'environnement

### Étapes

```bash
# 1. Cloner le repo
git clone <repo>
cd dynamic_repo

# 2. Installer dépendances
npm install

# 3. Configurer variables d'environnement
cp .env.example .env.local
# Remplir avec vos clés Supabase

# 4. Appliquer migrations Supabase
supabase db push

# 5. Démarrer serveur de développement
npm run dev

# Visiter http://localhost:3000
```

### Variables d'environnement (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://yhjqvomwpealiniliaut.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<votre-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<votre-service-role-key>
```

---

## ❓ FAQ Développeur

### Q: Comment ajouter une nouvelle table?

A: 
1. Créer migration SQL dans `supabase/migrations/`
2. Ajouter RLS policies
3. Runner `supabase db push`
4. Créer types dans `types/database.ts`
5. Créer fonctions query dans `lib/supabase/`

### Q: Comment sécuriser une route?

A:
```typescript
// Dans une page Server Component
const user = await getCurrentUser()
if (!user) redirect('/login')
// Page est sécurisée
```

### Q: Où ajouter validation serveur supplémentaire?

A: Dans les Server Actions (`app/actions/`):
```typescript
export async function createOrgAction(data: OrgInput) {
  // Validation 1: Zod (côté client aussi)
  const validated = orgSchema.parse(data)
  
  // Validation 2: Règles métier
  if (slugExists) return { error: 'Slug already taken' }
  
  // Validation 3: Permissions (implicite via RLS)
  const result = await supabase.from('organizations').insert(...)
}
```

### Q: Comment ajouter une permission granulaire?

A: Modifier RLS policy dans Supabase:
```sql
CREATE POLICY "Users can delete own organizations" 
  ON public.organizations
  FOR DELETE TO public
  USING (auth.uid() = created_by);
```

### Q: Comment déboguer les problèmes d'authentification?

A:
1. Vérifier cookies: `Application > Cookies > localhost`
2. Vérifier token JWT: `supabase.auth.getSession()`
3. Logs Supabase: Dashboard > Auth > Logs
4. Logs local: Console du navigateur + serveur

### Q: D'où vient l'affichage du user dans Navbar?

A:
```
app/page.tsx
  ├─ const currentUser = await getCurrentUser()
  └─ <Navbar currentUser={currentUser} />
  
components/Navbar.tsx (server component)
  ├─ Reçoit currentUser en props
  ├─ Conditionnel: currentUser ? <UserMenu /> : <Login />
  
components/UserMenu.tsx (client component)
  ├─ État interactif: dropdown, logout
  └─ onClick={() => signOutAction()}
```

---

## 📝 Prochaines phases

### Phase 2: Tables dynamiques
- Créer tables user_tables, table_columns
- UI pour créer/éditer tables
- Affichage données dynamiques

### Phase 3: Administration avancée
- Intégration MCP Supabase
- Gestion permissions granulaires
- Webhooks Supabase

### Phase 4: Performance & Monitoring
- Caching strategy (Redis?)
- Analytics
- Error tracking (Sentry?)

---

## 📞 Support

Pour questions sur la documentation:
- Consultez ce fichier d'abord
- Vérifiez les commentaires inline du code
- Consultez la migration SQL

---

**Dernière mise à jour**: 22/12/2025  
**Auteur**: Documentation générée  
**Status**: ✅ Actuel et complet pour Phase 1
