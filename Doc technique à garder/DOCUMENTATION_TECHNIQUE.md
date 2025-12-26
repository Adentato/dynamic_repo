# Documentation Technique - Système de Gestion de Tables Dynamiques

**Version:** 1.0
**Date:** Décembre 2025
**Statut:** Production (Phase 3 complète)

## Table des matières

1. [Aperçu du projet](#aperçu-du-projet)
2. [Architecture générale](#architecture-générale)
3. [Stack technologique](#stack-technologique)
4. [Hiérarchie des données](#hiérarchie-des-données)
5. [Flows métier](#flows-métier)
6. [Structure des répertoires](#structure-des-répertoires)
7. [Base de données](#base-de-données)
8. [Patterns et conventions](#patterns-et-conventions)
9. [Authentification et sécurité](#authentification-et-sécurité)
10. [Guides de développement](#guides-de-développement)

---

## Aperçu du projet

Ce projet est une **plateforme SaaS de gestion de tables dynamiques**, similaire à Airtable ou Grist. Elle permet aux utilisateurs de :

- Créer et gérer des **espaces de travail** (workspaces)
- Organiser les tables dans des **projets**
- Créer des **tables dynamiques** avec champs et enregistrements personnalisés
- **Inviter des collaborateurs** et gérer les droits d'accès
- Accéder à leurs données via une interface intuitive

## Architecture générale

```
┌─────────────────────────────────────────────────────────┐
│                     Utilisateur                         │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌─────────┐     ┌─────────┐     ┌──────────┐
    │ Signup  │     │  Login  │     │Invitation│
    │  Page   │     │  Page   │     │   Link   │
    └────┬────┘     └────┬────┘     └────┬─────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
         ┌───────────────▼───────────────┐
         │   Supabase Auth               │
         │  (email/password)             │
         └───────────────┬───────────────┘
                         │
         ┌───────────────▼───────────────┐
         │   Next.js Server Actions      │
         │  (Logique métier sécurisée)   │
         └───────────────┬───────────────┘
                         │
         ┌───────────────▼───────────────┐
         │  Supabase PostgreSQL          │
         │  avec RLS policies            │
         │  (Sécurité au niveau DB)      │
         └───────────────────────────────┘
```

### Principes architecturaux

1. **Server-First:** Utilise Next.js Server Components et Server Actions
2. **Type-Safe:** TypeScript strict, validation avec Zod
3. **Sécurité multicouche:** Auth + RLS + helpers d'autorisation
4. **Separation of concerns:** Actions, composants, types organisés
5. **Composants réutilisables:** Shadcn/ui pour cohérence UI

---

## Stack technologique

### Frontend
| Technologie | Usage |
|---|---|
| **Next.js 16** | Framework React, App Router, Server Components |
| **React 19** | Library UI |
| **TypeScript** | Language principal, strict mode activé |
| **Tailwind CSS** | Utility-first styling |
| **Shadcn/ui** | Composants UI haute qualité (Radix UI) |
| **React Hook Form** | Gestion des formulaires |
| **Zod** | Validation des schémas |
| **TanStack React Table** | Data table avancée |
| **TanStack React Query** | Cache et gestion requêtes |
| **Lucide React** | Icons SVG |

### Backend & Services
| Technologie | Usage |
|---|---|
| **Supabase** | Backend as a Service (BaaS) |
| **PostgreSQL** | Base de données relationnelle |
| **Supabase Auth** | Authentification email/password |
| **Row Level Security** | Sécurité au niveau base de données |

### Outils
| Outil | Usage |
|---|---|
| **ESLint** | Linting du code |
| **Supabase CLI** | Gestion des migrations DB |

---

## Hiérarchie des données

### Structure logique

```
User (Supabase Auth)
  │
  └─ Organization (Workspace)
      │
      ├─ Projects
      │   │
      │   └─ Entity Tables
      │       │
      │       ├─ Entity Fields (colonnes)
      │       │
      │       └─ Entity Records (données)
      │
      └─ Workspace Invitations
```

### Explications

**User**
- Créé automatiquement lors du signup
- Stocké dans `auth.users` (Supabase Auth)
- Profil dans table `profiles`

**Organization (Workspace)**
- Un espace de travail où collaborer
- Contient projets et tables
- Exemple: "Mon entreprise", "Projet client"

**Projects (Phase 3)**
- Groupes de tables connexes
- Exemple: "Base de données", "Gestion des ventes"
- Permet une meilleure organisation

**Entity Tables**
- Tables dynamiques définies par l'utilisateur
- Exemple: "Clients", "Produits", "Commandes"
- Contiennent colonnes (fields) et données (records)

**Entity Fields**
- Colonnes des tables
- Possèdent un type (text, number, select, date, etc.)
- Configuration spécifique par type

**Entity Records**
- Lignes/enregistrements des tables
- Stockent données en JSON
- Les champs sont identifiés par UUID de field

**Workspace Invitations**
- Liens pour inviter des collaborateurs
- Token unique, expiration 7 jours
- Système de rôles (owner, admin, member)

---

## Flows métier

### 1. Flow d'Inscription

```
┌─────────────────┐
│  Utilisateur    │
│  remplit form   │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────────┐
│ signUpAction (app/actions/auth)  │
│ - Valide input (Zod)             │
│ - Hash password                  │
│ - Crée compte Supabase Auth      │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Supabase Auth Trigger            │
│ - Crée record dans profiles      │
│ - user_id, email, created_at     │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Auto sign-in utilisateur         │
│ - Session créée                  │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Redirect /after-signup           │
│ - Création premier workspace     │
└──────────────────────────────────┘
```

**Fichiers impliqués:**
- `app/(auth)/signup/page.tsx` - UI
- `app/actions/auth.ts` - Logique signup
- Migration: `20251222153520`

### 2. Flow de Connexion

```
┌──────────────────┐
│ User logs in     │
│ email/password   │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────┐
│ signInAction (app/actions/auth)  │
│ - Valide input                   │
│ - Vérifie mdp Supabase Auth      │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Session créée                    │
│ JWT token stocké                 │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Redirect /dashboard              │
│ - Utilisateur authentifié        │
└──────────────────────────────────┘
```

**Fichiers impliqués:**
- `app/(auth)/login/page.tsx` - UI
- `app/actions/auth.ts` - Logique login

### 3. Flow de Création Workspace

```
┌──────────────────────────────┐
│ User clicks "New workspace"  │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ createWorkspaceAction            │
│ - Valide nom workspace (Zod)     │
│ - Récupère user courant          │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Crée organization en DB          │
│ - name, slug, created_by         │
│ - Supabase RLS autorise          │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Ajoute creator en OWNER          │
│ - organization_members           │
│ - user_id, organization_id       │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Retour ActionResult              │
│ - Success avec organization_id   │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Redirect workspace               │
│ - /dashboard/workspace/[id]      │
└──────────────────────────────────┘
```

**Fichiers impliqués:**
- `components/create-workspace-modal.tsx` - UI
- `app/actions/entities/workspace.ts` - Logique métier
- `lib/auth/workspace.ts` - Validations sécurité

### 4. Flow d'Invitation

```
┌──────────────────────────────┐
│ Admin invite developer@ex.com│
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ inviteUserToOrganizationAction   │
│ - Valide email (Zod)             │
│ - Génère token unique            │
│ - Défini expiration (7j)         │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Crée row workspace_invitations   │
│ - token, email, expires_at       │
│ - created_by_user_id             │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Email envoyé (future impl)       │
│ - Lien /invitations/[token]      │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ User clique lien invitation      │
│ - Si connecté: accepte           │
│ - Si non: signup puis accepte    │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ acceptInvitationAction           │
│ - Vérifie token valide           │
│ - Vérifie pas expiré             │
│ - Crée organization_members      │
│ - Mark invitation as accepted    │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Utilisateur devient MEMBER       │
│ - Accès complet au workspace     │
└──────────────────────────────────┘
```

**Fichiers impliqués:**
- `app/actions/entities/invitations.ts` - Logique invitations
- `app/(auth)/invitations/[token]/page.tsx` - Page acceptation
- Table DB: `workspace_invitations`

### 5. Flow Création Table Dynamique

```
┌──────────────────────────────┐
│ User clique "New table"      │
│ dans workspace               │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ CreateTableModal                 │
│ - Demande nom + optionnel projet │
│ - Valide accès workspace         │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ createEntityTableAction          │
│ - Crée row entity_tables         │
│ - workspace_id, project_id, name │
│ - Retourne table_id              │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Redirect vers table              │
│ /dashboard/.../table/[id]        │
│ - Affiche table vide prête       │
└──────────────────────────────────┘
```

**Fichiers impliqués:**
- `components/create-table-modal.tsx` - UI
- `components/create-table-form.tsx` - Form
- `app/actions/entities/tables.ts` - Logique
- Table DB: `entity_tables`

### 6. Flow Ajout Champ à Table

```
┌──────────────────────────┐
│ User clique "Add column" │
└────────┬────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ createEntityFieldAction          │
│ - Valide type champ (Zod)        │
│ - Génère UUID unique pour field  │
│ - Crée row entity_fields         │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Field créé avec UUID             │
│ - Table: entity_fields           │
│ - Columns: name, type, options   │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ UI mise à jour                   │
│ - Nouvelle colonne visible       │
│ - Prête pour données             │
└──────────────────────────────────┘
```

**Types de champs supportés:**
- `text` - Texte simple
- `number` - Nombres
- `select` - Options prédéfinies
- `date` - Dates
- `boolean` - Vrai/Faux
- `email` - Email validé
- `url` - URL validée
- `richtext` - Texte riche
- `json` - JSON custom
- `relation` - Lien vers autre table (Phase 4)

**Fichiers impliqués:**
- `app/actions/entities/fields.ts` - Logique champs
- Table DB: `entity_fields`

### 7. Flow CRUD Enregistrements

#### Créer/Modifier Enregistrement
```
User tape donnée
     │
     ▼
upsertEntityRecordAction
 - Valide data vs fields
 - Crée/update entity_records
     │
     ▼
Data stockée en JSONB:
{
  "field-uuid-1": "valeur",
  "field-uuid-2": 123,
  ...
}
     │
     ▼
UI met à jour tableau
```

#### Récupérer Enregistrements
```
Page table chargée
     │
     ▼
getEntityRecordsAction
 - Pagination (limit, offset)
 - Filtre par workspace/table
 - RLS appliquée automatique
     │
     ▼
Données + total count
     │
     ▼
Affichage DataTable
```

**Fichiers impliqués:**
- `app/actions/entities/records.ts` - Logique records
- Table DB: `entity_records`

---

## Structure des répertoires

```
dynamic_repo/
│
├── app/                              # Application Next.js
│   ├── (auth)/                       # Routes publiques authentification
│   │   ├── signup/
│   │   │   └── page.tsx             # Page inscription
│   │   ├── login/
│   │   │   └── page.tsx             # Page connexion
│   │   ├── after-signup/
│   │   │   └── page.tsx             # Post-inscription (création 1er workspace)
│   │   ├── onboarding/
│   │   │   └── page.tsx             # Onboarding utilisateur
│   │   ├── invitations/
│   │   │   └── [token]/
│   │   │       └── page.tsx         # Acceptation invitation
│   │   └── join-organization/
│   │       └── page.tsx             # Rejoindre organisation
│   │
│   ├── (app)/                        # Routes protégées
│   │   ├── dashboard/
│   │   │   ├── page.tsx             # Accueil (liste workspaces)
│   │   │   ├── workspace/
│   │   │   │   └── [workspaceId]/
│   │   │   │       ├── page.tsx     # Vue workspace
│   │   │   │       ├── layout.tsx
│   │   │   │       └── project/
│   │   │   │           └── [projectId]/
│   │   │   │               ├── page.tsx    # Vue projet
│   │   │   │               └── table/
│   │   │   │                   └── [tableId]/
│   │   │   │                       ├── page.tsx  # Vue table + données
│   │   │   │                       └── layout.tsx
│   │   │   ├── project/
│   │   │   │   └── [projectId]/
│   │   │   │       └── page.tsx     # Vue projet (shortcut)
│   │   │   ├── settings/
│   │   │   │   ├── members/
│   │   │   │   │   └── page.tsx    # Gestion membres workspace
│   │   │   │   └── layout.tsx
│   │   │   └── layout.tsx
│   │   └── layout.tsx               # Layout protégé
│   │
│   ├── actions/                      # Server Actions
│   │   ├── auth.ts                  # signUp, signIn, signOut
│   │   └── entities/
│   │       ├── workspace.ts         # Gestion workspaces
│   │       ├── projects.ts          # Gestion projets
│   │       ├── tables.ts            # Gestion tables
│   │       ├── fields.ts            # Gestion champs
│   │       ├── records.ts           # Gestion enregistrements
│   │       └── invitations.ts       # Gestion invitations
│   │
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Page d'accueil /
│
├── components/                       # Composants React
│   ├── ui/                           # Shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── form.tsx
│   │   ├── textarea.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── avatar.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   └── ...
│   │
│   ├── datatable/
│   │   ├── entity-table.tsx         # Composant table données
│   │   └── columns-builder.tsx      # Construction colonnes dynamiques
│   │
│   ├── Navbar.tsx                   # Navigation principale
│   ├── UserMenu.tsx                 # Menu utilisateur/profil
│   ├── Breadcrumb.tsx               # Fil d'Ariane
│   ├── create-workspace-modal.tsx   # Modal création workspace
│   ├── create-project-modal.tsx     # Modal création projet
│   ├── create-table-modal.tsx       # Modal création table
│   ├── create-table-form.tsx        # Form création table
│   ├── dashboard-client.tsx         # Dashboard côté client
│   ├── projects-list.tsx            # Liste projets
│   └── workspace-tables-list.tsx    # Liste tables
│
├── lib/                              # Utilities
│   ├── supabase/
│   │   ├── server.ts               # Client Supabase (SSR)
│   │   ├── client.ts               # Client Supabase (browser)
│   │   └── auth.ts                 # getCurrentUser() helper
│   │
│   ├── auth/
│   │   └── workspace.ts            # Helpers auth & validation
│   │
│   ├── validations/
│   │   ├── auth.ts                 # Schémas auth
│   │   ├── entities.ts             # Schémas tables/champs
│   │   └── workspace.ts            # Schémas workspaces
│   │
│   ├── types/
│   │   └── action-result.ts        # Type ActionResult
│   │
│   ├── utils.ts                    # Utilities (cn, etc.)
│   └── debug-projects.ts           # Debug utils
│
├── types/                            # Types TypeScript
│   ├── database.ts                 # Types DB (Organization, Profile, etc.)
│   └── entities.ts                 # Types métier (Project, Table, Field, Record)
│
├── supabase/
│   ├── config.json                 # Config Supabase
│   └── migrations/
│       ├── 20251222153520_create_dynamic_tables_system.sql
│       ├── 20251224_add_projects_hierarchy.sql
│       ├── 20251224_add_invitations_system.sql
│       └── 20251224_fix_organization_members_rls.sql
│
├── scripts/
│   └── seed-test-data.ts           # Script seed données test
│
├── public/                           # Assets statiques
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── components.json                 # Config Shadcn
├── .env.local                      # Env vars
├── .eslintrc.json
└── README.md
```

### Conventions de nommage

| Type | Convention | Exemple |
|------|-----------|---------|
| Fichiers composants | kebab-case | `create-workspace-modal.tsx` |
| Fichiers utilitaires | kebab-case | `action-result.ts` |
| Dossiers | kebab-case | `entity-tables/`, `(auth)/` |
| Interfaces/Types | PascalCase | `interface Organization` |
| Functions | camelCase | `createProjectAction()` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_PAGE_SIZE` |
| Variables | camelCase | `workspace`, `userId` |

---

## Base de données

### Schéma global

```sql
-- Auth (Supabase gérée)
auth.users (id, email, email_confirmed_at, ...)

-- Profils utilisateurs
profiles (
  id UUID,
  user_id UUID (FK auth.users.id),
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP
)

-- Organisations (Workspaces)
organizations (
  id UUID,
  name TEXT,
  slug TEXT UNIQUE,
  description TEXT,
  created_by UUID (FK profiles.id),
  created_at TIMESTAMP
)

-- Membres d'organisation
organization_members (
  id UUID,
  organization_id UUID (FK organizations.id),
  user_id UUID (FK profiles.id),
  role TEXT ('owner' | 'admin' | 'member'),
  created_at TIMESTAMP
)

-- Invitations
workspace_invitations (
  id UUID,
  organization_id UUID (FK organizations.id),
  email TEXT,
  token TEXT UNIQUE,
  role TEXT ('owner' | 'admin' | 'member'),
  created_by_user_id UUID (FK profiles.id),
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  accepted_at TIMESTAMP,
  accepted_by_user_id UUID (FK profiles.id)
)

-- Projets (Phase 3)
projects (
  id UUID,
  workspace_id UUID (FK organizations.id),
  name TEXT,
  description TEXT,
  color TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Tables dynamiques
entity_tables (
  id UUID,
  workspace_id UUID (FK organizations.id),
  project_id UUID (FK projects.id),
  name TEXT,
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Colonnes/Champs
entity_fields (
  id UUID,
  table_id UUID (FK entity_tables.id),
  name TEXT,
  type TEXT ('text' | 'number' | 'select' | 'date' | ...),
  options JSONB,
  order_index INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Enregistrements/Données
entity_records (
  id UUID,
  table_id UUID (FK entity_tables.id),
  data JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Row Level Security (RLS)

**Principe clé:** Un utilisateur ne voit que les données des workspaces auxquels il appartient.

**Pattern RLS pour toutes les tables (sauf profiles):**

```sql
-- Permet SELECT si user est member du workspace
SELECT ON entity_tables WHERE
  workspace_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )

-- Permet INSERT/UPDATE/DELETE même logique
-- + validation workspace access
```

**Exceptions:**
- `profiles` : Users can only see their own profile
- `organization_members` : Évite récursion, validation en app layer

### Indexes importants

```sql
-- Performance requêtes
CREATE INDEX idx_organization_members_user_id
  ON organization_members(user_id);

CREATE INDEX idx_entity_tables_workspace_id
  ON entity_tables(workspace_id);

CREATE INDEX idx_entity_records_table_id
  ON entity_records(table_id);

-- Full-text search (futur)
CREATE INDEX idx_entity_fields_name
  ON entity_fields(name);

-- JSONB search (futur)
CREATE INDEX idx_entity_records_data
  ON entity_records USING GIN (data);
```

### Relations entre tables

```
Organization (Workspace)
    ├─ (1:N) organization_members ─ profiles
    ├─ (1:N) workspace_invitations ─ profiles (created_by)
    ├─ (1:N) projects
    │         └─ (1:N) entity_tables
    │             ├─ (1:N) entity_fields
    │             └─ (1:N) entity_records
    │                  └─ JSONB references entity_fields by UUID
    └─ (1:N) entity_tables (direct, sans project)
        ├─ (1:N) entity_fields
        └─ (1:N) entity_records
```

---

## Patterns et conventions

### 1. Server Actions Pattern

Tous les Server Actions:
- Sont marqués `'use server'`
- Prennent input typé (via Zod)
- Retournent `ActionResult<T>`
- Centralisent la logique métier
- Inclent validations de sécurité

**Template:**

```typescript
'use server'

import { z } from 'zod'
import { ActionResult } from '@/lib/types/action-result'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, requireWorkspaceAccess } from '@/lib/auth/workspace'

const inputSchema = z.object({
  // ... Zod schema
})

export async function myActionFunction(
  input: unknown
): Promise<ActionResult<ReturnType>> {
  try {
    // 1. Validate input
    const validated = inputSchema.parse(input)

    // 2. Get auth
    const supabase = await createClient()
    const user = await requireAuth(supabase)

    // 3. Check permissions
    await requireWorkspaceAccess(supabase, user.id, workspaceId)

    // 4. Business logic
    const result = await supabase.from('table').insert({...})

    // 5. Return success
    return {
      success: true,
      data: result.data
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'ERROR_CODE',
        message: 'User-friendly message'
      }
    }
  }
}
```

### 2. ActionResult Type

```typescript
// lib/types/action-result.ts

export interface ActionError {
  code: string
  message: string
  details?: unknown
}

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: ActionError }

// Usage
const result = await myAction(input)

if (result.success) {
  console.log(result.data)
  // Type: T
} else {
  console.log(result.error.code)
  console.log(result.error.message)
  // Type: ActionError
}
```

### 3. Auth Helpers (`lib/auth/workspace.ts`)

**Helpers disponibles:**

```typescript
// Vérifier authentification
async function requireAuth(supabase: Client): Promise<User>

// Vérifier accès workspace
async function requireWorkspaceAccess(
  supabase: Client,
  userId: string,
  workspaceId: string
): Promise<Organization>

// Vérifier accès projet
async function requireProjectInWorkspace(
  supabase: Client,
  userId: string,
  projectId: string
): Promise<Project>

// Vérifier accès table
async function requireTableInWorkspace(
  supabase: Client,
  userId: string,
  tableId: string
): Promise<EntityTable>

// Et autres...
```

**Bénéfices:**
- Code DRY (centralisé)
- Cohérent partout
- Erreurs standardisées
- Facile à maintenir

### 4. Validation avec Zod

Tous les inputs sont validés:

**Schéma:**
```typescript
// lib/validations/auth.ts
export const signUpSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 chars')
})

// lib/validations/entities.ts
export const createTableSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  projectId: z.string().uuid().optional()
})
```

**Utilisation:**

```typescript
const validated = signUpSchema.parse(input)
// ou
const validated = signUpSchema.safeParse(input)
if (!validated.success) {
  // handle error
}
```

### 5. Formulaires avec React Hook Form

Pattern pour formulaires:

```typescript
// Dans composant
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createTableSchema } from '@/lib/validations/entities'
import { createEntityTableAction } from '@/app/actions/entities/tables'

export function CreateTableForm() {
  const form = useForm({
    resolver: zodResolver(createTableSchema),
    defaultValues: { name: '', projectId: undefined }
  })

  async function onSubmit(data) {
    const result = await createEntityTableAction(data)

    if (result.success) {
      // Success handling
      router.push(`/dashboard/table/${result.data.id}`)
    } else {
      // Error handling
      form.setError('root', {
        message: result.error.message
      })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  )
}
```

### 6. Données JSONB dans Records

Chaque record stocke ses données en JSONB:

```json
// entity_records.data
{
  "field-uuid-a1b2-c3d4": "John Doe",
  "field-uuid-e5f6-g7h8": 25,
  "field-uuid-i9j0-k1l2": ["option1", "option2"],
  "field-uuid-m3n4-o5p6": "2024-12-26"
}
```

**Clés:** UUID des fields (stable, pour refactoring)
**Valeurs:** Typées par type de field

**Avantages:**
- Champs dynamiques (pas de migration DB pour chaque champ)
- Structure flexible
- Facile d'ajouter/supprimer champs

**Utilisation côté code:**

```typescript
// Construction données
const data = {
  [fieldA.id]: 'valeur texte',
  [fieldB.id]: 42,
  [fieldC.id]: ['option1']
}

// Insert/update
await upsertEntityRecordAction({
  tableId,
  data // JSONB stocké directement
})

// Requête Supabase
const records = await supabase
  .from('entity_records')
  .select('*')
  .eq('table_id', tableId)

// Data retournée
records[0].data['field-uuid'] // accès direct
```

---

## Authentification et sécurité

### 1. Authentification

**Flux global:**

1. **Signup:** Email/password → Supabase Auth
2. **Login:** Email/password → Session JWT
3. **Logout:** Supprime session
4. **Session persistante:** JWT en httpOnly cookie

**Supabase Auth:**
- Stocke email/password sécurisé
- Vérifie password avant session
- Gère JWT (expires 1h, refresh token)
- Recuperation automatique session via middleware

**Middleware Next.js (implicite):**
```typescript
// Next.js/Supabase gèrent automatiquement
// Session accessible via:
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

### 2. Row Level Security (RLS)

**Concept clé:** Chaque requête DB inclut `auth.uid()`, les RLS policies filtrent.

**Avantage:** Sécurité appliquée au niveau DB, pas juste app.

**Exemple - entity_tables RLS:**

```sql
-- SELECT: User voit seulement tables de ses workspaces
CREATE POLICY "Users can see workspace tables"
ON entity_tables FOR SELECT USING (
  workspace_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
)

-- INSERT: User peut créer table seulement dans son workspace
CREATE POLICY "Users can create tables in workspace"
ON entity_tables FOR INSERT WITH CHECK (
  workspace_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
)
```

**Important:** RLS s'applique même si user contourne l'app!

### 3. Helpers d'autorisation (`lib/auth/workspace.ts`)

Même avec RLS, on double-check en app layer:

```typescript
// Vérifie user a accès workspace ET retourne l'organisation
async function requireWorkspaceAccess(
  supabase: Client,
  userId: string,
  workspaceId: string
): Promise<Organization> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', workspaceId)
    .in('id',
      supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', userId)
    )
    .single()

  if (error) throw new WorkspaceAccessError()
  return data
}
```

**Principes:**
- Centraliser vérifications
- User-friendly error messages
- Log tentatives d'accès non-autorisé

### 4. Sécurité côté client

**Toujours faire:**
- Valider input (client + serveur)
- Ne pas stocker secrets côté client
- Utiliser httpOnly cookies (géré Supabase)
- CSRF protection (incluse Next.js)

**Ne jamais:**
- Passer secrets en query string
- Faire logique auth côté client
- Trusting form data du client
- Skip validation serveur

---

## Guides de développement

### Guide: Ajouter une nouvelle entité

**Exemple:** Ajouter une entity "Categories" liée aux Tables.

**Étapes:**

1. **Schéma DB:**
```sql
-- supabase/migrations/[timestamp]_add_categories.sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES entity_tables(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see categories in accessible tables"
ON categories FOR SELECT USING (
  table_id IN (
    SELECT id FROM entity_tables
    WHERE workspace_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);
-- ... autres policies INSERT/UPDATE/DELETE
```

2. **Types TypeScript:**
```typescript
// types/entities.ts
export interface Category {
  id: string
  table_id: string
  name: string
  color?: string
  created_at: string
}
```

3. **Validation:**
```typescript
// lib/validations/entities.ts
export const createCategorySchema = z.object({
  tableId: z.string().uuid(),
  name: z.string().min(1).max(50),
  color: z.string().optional()
})
```

4. **Server Actions:**
```typescript
// app/actions/entities/categories.ts
'use server'

import { z } from 'zod'
import { createCategorySchema } from '@/lib/validations/entities'
import { createClient } from '@/lib/supabase/server'
import { requireTableInWorkspace } from '@/lib/auth/workspace'

export async function createCategoryAction(
  input: unknown
): Promise<ActionResult<Category>> {
  try {
    const validated = createCategorySchema.parse(input)
    const supabase = await createClient()
    const user = await requireAuth(supabase)

    // Verify table access
    await requireTableInWorkspace(supabase, user.id, validated.tableId)

    const { data, error } = await supabase
      .from('categories')
      .insert({
        table_id: validated.tableId,
        name: validated.name,
        color: validated.color
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'CREATE_CATEGORY_ERROR',
        message: 'Failed to create category'
      }
    }
  }
}
```

5. **Composants UI:**
```typescript
// components/create-category-modal.tsx
'use client'

import { useState } from 'react'
import { createCategoryAction } from '@/app/actions/entities/categories'

export function CreateCategoryModal({ tableId }: { tableId: string }) {
  const [open, setOpen] = useState(false)

  async function handleSubmit(formData: FormData) {
    const result = await createCategoryAction({
      tableId,
      name: formData.get('name'),
      color: formData.get('color')
    })

    if (result.success) {
      setOpen(false)
      // Refresh data
    }
  }

  return (
    // Form JSX
  )
}
```

6. **Route/Page (optionnel):**
Ajouter routes si interface dédiée nécessaire.

7. **Tests:**
Tester action isolée, permissions, edge cases.

---

### Guide: Debugging

**Outils disponibles:**

1. **Logs Supabase:**
```typescript
// lib/supabase/server.ts
const supabase = createBrowserClient(...)
// Les requêtes Supabase sont loggées en dev
```

2. **Logs Server Actions:**
```typescript
console.log('Debug info:', value) // Visible terminal
console.error('Error:', error) // Visible en red
```

3. **Inspect RLS Policies:**
```sql
-- Dans Supabase UI, onglet SQL Editor
-- Chercher rls policies dans postgres_schema
SELECT * FROM pg_policies
WHERE tablename = 'entity_tables';
```

4. **Inspect User Session:**
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
console.log('Current user:', user)
```

5. **Network Inspector (DevTools):**
- F12 → Network tab
- Voir requêtes Supabase
- Check authorization headers

---

### Guide: Testing Actions

**Pattern recommandé:**

```typescript
// app/actions/entities/__tests__/workspace.test.ts
import { createWorkspaceAction } from '../workspace'
import { mockSupabase } from '@/test/mocks'

describe('createWorkspaceAction', () => {
  it('should create workspace for authenticated user', async () => {
    // Setup
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    const input = { name: 'New workspace' }

    // Execute
    const result = await createWorkspaceAction(input)

    // Assert
    expect(result.success).toBe(true)
    expect(result.data.name).toBe('New workspace')
  })

  it('should reject unauthenticated request', async () => {
    // Setup - no user
    const input = { name: 'New workspace' }

    // Execute
    const result = await createWorkspaceAction(input)

    // Assert
    expect(result.success).toBe(false)
    expect(result.error.code).toBe('UNAUTHORIZED')
  })
})
```

---

### Guide: Déployer sur Supabase

1. **Synchroniser migrations:**
```bash
supabase db push
```

2. **Seed données (optionnel):**
```bash
supabase db seed
```

3. **Vérifier RLS policies:**
Supabase Dashboard → Database → Policies

4. **Tester authentification:**
- Signup nouveau user
- Vérifier JWT token
- Tester requête protégée

5. **Monitoring:**
- Supabase Dashboard → Logs
- Check erreurs auth, RLS rejections
- Monitor performance queries

---

## FAQ et Troubleshooting

### Q: Comment ajouter un nouveau champ type?
**A:** Modifier `entity_fields.type` enum, update validation Zod, puis update `ColumnsBuilder` pour rendu UI.

### Q: User voit des données d'autres workspaces?
**A:** Vérifier RLS policies sur table, utiliser `requireWorkspaceAccess()` dans action.

### Q: Comment filtrer records par champ?
**A:** Implémenter filter sur requête Supabase avec JSONB operators:
```typescript
const { data } = await supabase
  .from('entity_records')
  .select('*')
  .eq('table_id', tableId)
  .contains('data', { [fieldId]: 'value' })
```

### Q: Erreur "token has expired"?
**A:** Session JWT expiré, user doit se reconnecter. Supabase refresh automatique si refresh token valide.

### Q: Comment ajouter permissions granulaires?
**A:** Ajouter colonne `role` dans `organization_members`, modifier RLS policies pour checker role, puis validation actions.

---

## Ressources et références

**Documentation officielle:**
- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase PostgreSQL](https://supabase.com/docs/guides/database)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
- [Shadcn/ui Components](https://ui.shadcn.com/)

**Fichiers clés du projet:**
- `lib/auth/workspace.ts` - Logique auth centralisée
- `app/actions/entities/` - Toutes les actions métier
- `supabase/migrations/` - Schéma DB complet
- `types/entities.ts` - Types métier

---

## Notes finales

Ce projet implémente une architecture **moderne, type-safe, et sécurisée**:

✅ **Type-safe** - TypeScript strict, Zod, ActionResult pattern
✅ **Sécurisé** - RLS + Auth helpers + validations
✅ **Maintenable** - Code organisé, patterns cohérents
✅ **Scalable** - Prêt pour features futures (Phase 4)
✅ **UX friendly** - Shadcn/ui, validations claires

Bonne chance au développeur! 🚀
