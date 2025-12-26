# Guide de Démarrage Rapide

**Pour le nouveau développeur**

## 1. Installation initiale (5 min)

### Prérequis
- Node.js 18+ installé
- Git configuré
- Accès aux secrets Supabase

### Étapes

```bash
# 1. Cloner le repo
git clone <repo-url>
cd dynamic_repo

# 2. Installer dépendances
npm install

# 3. Configurer variables d'environnement
cp .env.example .env.local
# Remplir: NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Lancer serveur de dev
npm run dev

# 5. Ouvrir dans navigateur
open http://localhost:3000
```

## 2. Comprendre la structure (15 min)

**Ne lisez pas tout le code!** Comprenez les patterns:

### 3 fichiers clés à connaître

1. **`lib/auth/workspace.ts`**
   - Tous les helpers d'authentification
   - Comment vérifier qu'un user a accès à un workspace

2. **`lib/types/action-result.ts`**
   - Pattern de retour pour actions
   - Comment gérer success/error

3. **`types/entities.ts`**
   - Types des principales entités (Organization, Table, Field, Record)

### 3 dossiers clés

```
app/actions/entities/     → Toute la logique métier
lib/validations/          → Schémas Zod pour validation
types/                    → Types TypeScript centralisés
```

## 3. Flux typique: Ajouter une feature

### Exemple: Ajouter couleur personnalisée aux tables

**Ordre de travail:**

```
1. DB Schema (SQL)
   ↓
2. Types TypeScript
   ↓
3. Validation Zod
   ↓
4. Server Action
   ↓
5. Composant UI
   ↓
6. Tester
```

**Code minimal:**

### Étape 1: Migration SQL

```sql
-- supabase/migrations/[timestamp]_add_table_color.sql
ALTER TABLE entity_tables ADD COLUMN color TEXT;
```

Push:
```bash
supabase db push
```

### Étape 2: Types

```typescript
// types/entities.ts - ajouter à interface EntityTable
export interface EntityTable {
  // ... existing fields
  color?: string  // Ajouter cette ligne
}
```

### Étape 3: Validation

```typescript
// lib/validations/entities.ts - ajouter/modifier schema
export const updateTableSchema = z.object({
  tableId: z.string().uuid(),
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional()  // Ajouter
})
```

### Étape 4: Server Action

```typescript
// app/actions/entities/tables.ts - ajouter fonction

'use server'

export async function updateTableColorAction(
  input: unknown
): Promise<ActionResult<EntityTable>> {
  try {
    const validated = updateTableSchema.parse(input)
    const supabase = await createClient()
    const user = await requireAuth(supabase)

    // Verify access
    await requireTableInWorkspace(supabase, user.id, validated.tableId)

    const { data, error } = await supabase
      .from('entity_tables')
      .update({ color: validated.color })
      .eq('id', validated.tableId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    // ... error handling
  }
}
```

### Étape 5: Composant UI

```typescript
// components/table-color-picker.tsx

'use client'

import { useState } from 'react'
import { updateTableColorAction } from '@/app/actions/entities/tables'

export function TableColorPicker({
  tableId,
  currentColor
}: {
  tableId: string
  currentColor?: string
}) {
  const [color, setColor] = useState(currentColor || '#000000')

  async function handleChange(newColor: string) {
    setColor(newColor)

    const result = await updateTableColorAction({
      tableId,
      color: newColor
    })

    if (!result.success) {
      alert(result.error.message)
      setColor(currentColor || '#000000')
    }
  }

  return (
    <input
      type="color"
      value={color}
      onChange={(e) => handleChange(e.target.value)}
    />
  )
}
```

### Étape 6: Tester

```bash
# 1. Signup nouvel user
# 2. Créer table
# 3. Cliquer color picker
# 4. Vérifier couleur sauvegardée en DB

# En terminal:
npm run dev
# F12 → Network tab → voir requête Supabase
```

---

## 4. Patterns courants

### Pattern 1: Créer une nouvelle entité

**Checklist:**

```
✅ Schéma DB (migration SQL)
✅ Types TypeScript (types/entities.ts)
✅ Validation (lib/validations/)
✅ CRUD Actions (app/actions/entities/)
✅ UI Componentes (components/)
✅ Page/Route si nécessaire
```

### Pattern 2: Vérifier accès utilisateur

**Dans Server Action:**

```typescript
const user = await requireAuth(supabase)
await requireWorkspaceAccess(supabase, user.id, workspaceId)
// Si ça fail → error lancée automatiquement
```

### Pattern 3: Afficher erreur formulaire

```typescript
async function handleSubmit(formData) {
  const result = await myAction(formData)

  if (result.success) {
    // success
  } else {
    form.setError('root', {
      message: result.error.message
    })
  }
}
```

### Pattern 4: Fetcher données avec pagination

```typescript
const limit = 20
const offset = page * limit

const { data: records } = await supabase
  .from('entity_records')
  .select('*')
  .eq('table_id', tableId)
  .range(offset, offset + limit - 1)
```

---

## 5. Commandes utiles

```bash
# Développement
npm run dev          # Lancer serveur (localhost:3000)
npm run build        # Build production
npm start            # Lancer serveur production
npm run lint         # Vérifier code

# Supabase
supabase db push     # Pousser migrations locales
supabase db pull     # Récupérer changes distants
supabase link        # Lier à projet Supabase
supabase status      # Vérifier status

# Git
git checkout -b feature/mon-feature
git add .
git commit -m "feat: description"
git push origin feature/mon-feature
# Créer PR sur GitHub
```

---

## 6. Structure d'une page

### Page protégée (exemple)

```typescript
// app/(app)/dashboard/workspace/[workspaceId]/page.tsx

import { createClient } from '@/lib/supabase/server'
import { requireWorkspaceAccess } from '@/lib/auth/workspace'
import { WorkspaceClient } from '@/components/workspace-client'

export default async function WorkspacePage({
  params
}: {
  params: { workspaceId: string }
}) {
  // 1. Get auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Check access & get data
  const workspace = await requireWorkspaceAccess(
    supabase,
    user.id,
    params.workspaceId
  )

  // 3. Get workspace data
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('workspace_id', params.workspaceId)

  // 4. Render
  return (
    <div>
      <h1>{workspace.name}</h1>
      <WorkspaceClient
        workspace={workspace}
        initialProjects={projects || []}
      />
    </div>
  )
}
```

**Points clés:**
- Page est Server Component (`async`)
- Auth check first
- Fetch data côté serveur
- Passer data à Client Component

---

## 7. Comprendre les données dynamiques

### Structure JSONB Record

```json
// entity_records.data
{
  "uuid-field-1": "John Doe",
  "uuid-field-2": 30,
  "uuid-field-3": ["option1", "option2"],
  "uuid-field-4": "2024-12-26"
}
```

**Pourquoi UUIDs?**
- Stable si champ renommé
- Pas besoin migration DB pour nouveau champ
- Flexible pour schémas dynamiques

**Comment accéder:**

```typescript
// Récupérer
const fieldValue = record.data[field.id]

// Modifier
const newData = {
  ...record.data,
  [fieldId]: newValue
}

// Sauvegarder
await upsertEntityRecordAction({
  recordId: record.id,
  data: newData
})
```

---

## 8. Debugging courant

### "403 Unauthorized"
**Cause:** RLS policy rejette requête
**Solution:**
- Vérifier user a accès workspace
- Utiliser `requireWorkspaceAccess()` dans action
- Check RLS policy en Supabase UI

### "User not found"
**Cause:** `requireAuth()` lancée avant que user soit créé
**Solution:**
- Vérifier auth.users créé
- Vérifier profile créé par trigger

### "Field not found in record"
**Cause:** Accès champ inexistant dans JSONB
**Solution:**
- Vérifier field.id existe
- Utiliser optional chaining: `record.data[field.id] ?? 'N/A'`

### Changements pas visibles en UI
**Cause:** Cache React Query pas invalidé
**Solution:**
- Utiliser `revalidatePath()` en Server Action
- Ou manuellement refetcher data après action

---

## 9. Conseils pour commencer

### Premier jour
1. Setup dev environment
2. Lire `lib/auth/workspace.ts` (15 min)
3. Lire `types/entities.ts` (10 min)
4. Créer une table test, ajouter données via UI

### Première semaine
1. Ajouter 1-2 features simples (couleur, description)
2. Lire migrations SQL
3. Explorer RLS policies
4. Tester edge cases (accès non-autorisé, données invalides)

### Avant de faire PR
- ✅ Tester fonctionnalité localement
- ✅ Vérifier types TypeScript: `npm run build`
- ✅ Tester accès (user A ne voit pas user B)
- ✅ Pas de console.log de debugging
- ✅ Messages d'erreur user-friendly

---

## 10. Questions fréquentes

**Q: Pourquoi Server Actions partout?**
A: Sécurité - logique métier côté serveur, pas exposée au client.

**Q: Comment ajouter permissions granulaires?**
A: Ajouter rôles (owner/admin/member), modifier RLS policies.

**Q: Où stocker données temporaires?**
A: React state pour UI, localStorage si persiste, DB si partagée.

**Q: Comment tester avec données réelles?**
A: Seed script `scripts/seed-test-data.ts`, ou Supabase studio.

**Q: Qui peut voir les données d'autres users?**
A: Personne - RLS empêche, même si contournent app.

---

## Ressources

📖 **Documentation complète:** Lire `DOCUMENTATION_TECHNIQUE.md` au fur et à mesure

🔗 **Liens utiles:**
- Supabase Dashboard: [dashboard.supabase.com](https://dashboard.supabase.com)
- Docs Next.js: [nextjs.org/docs](https://nextjs.org/docs)
- Types du projet: Ouvrir `types/entities.ts`

💬 **Questions?**
- Chercher pattern similaire dans `app/actions/entities/`
- Check validation correspondante dans `lib/validations/`
- Lire migration DB pour schéma

---

Bienvenue à bord! 🚀
