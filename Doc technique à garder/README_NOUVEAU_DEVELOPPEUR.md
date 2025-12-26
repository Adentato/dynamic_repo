# 👋 Bienvenue au projet!

Ce document est votre point de départ pour rejoindre l'équipe de développement.

**Temps estimé pour être opérationnel:**
- ⏱️ Jour 1: Setup + compréhension architecture
- ⏱️ Semaine 1: Ajouter première feature
- ⏱️ Semaine 2-3: Être productif en solo

---

## 📚 Documentation disponible

Nous avons préparé 4 documents complets:

### 1. 🚀 **GUIDE_DEMARRAGE.md** (Lisez d'abord!)
**⏱️ 30 minutes**

Votre guide pour commencer immédiatement:
- Installation étape par étape
- Les 3 fichiers clés à connaître
- Patterns courants avec code
- Commandes utiles
- Troubleshooting

👉 **Commencez par celui-ci!**

---

### 2. 📖 **DOCUMENTATION_TECHNIQUE.md** (Reference complète)
**⏱️ À lire au fur et à mesure**

Documentation exhaustive du système:
- Aperçu général du projet
- Architecture complète
- Hiérarchie des données
- 7 flows métier détaillés
- Base de données (schéma + RLS)
- Patterns de développement
- Guides: ajouter une entité, debugging, testing, déploiement
- FAQ

👉 **Consultez-la quand vous codez une feature**

---

### 3. 🏗️ **ARCHITECTURE_DIAGRAMS.md** (Visuels)
**⏱️ 20 minutes**

10 diagrammes pour visualiser:
- Architecture générale
- Hiérarchie des données
- Flows d'authentification
- Création workspace/table
- Autorisation & sécurité
- Types de données JSONB
- Lifecycle des requêtes
- Diagramme des états
- Rôles & permissions
- Performance & scaling

👉 **Parfait pour comprendre visuellement**

---

## 🎯 Chemin d'apprentissage recommandé

### Jour 1: Setup et apprentissage (4-5h)

```
09:00 - 09:30  │ Installer et lancer serveur
               │ $ npm install && npm run dev

09:30 - 10:00  │ Lire GUIDE_DEMARRAGE (section 1-3)
               │ Comprendre: app/actions, lib/auth, types

10:00 - 10:30  │ Lire ARCHITECTURE_DIAGRAMS (sections 1-3)
               │ Comprendre: Data hierarchy, Auth flow

10:30 - 11:00  │ Explorer le code localement
               │ Ouvrir lib/auth/workspace.ts
               │ Ouvrir types/entities.ts
               │ Ouvrir app/actions/entities/

11:00 - 12:00  │ Tester l'app
               │ - Signup nouvel utilisateur
               │ - Créer workspace
               │ - Créer table
               │ - Ajouter colonnes/données

12:00 - 13:00  │ Pause déjeuner

13:00 - 15:00  │ Lire DOCUMENTATION_TECHNIQUE (sections 1-5)
               │ Comprendre patterns + flows complets

15:00 - 17:00  │ Lire GUIDE_DEMARRAGE (section 3: patterns)
               │ Pratiquer: ajouter une feature simple
               │ Exemple: ajouter description au workspace
```

### Semaine 1: Première feature (3-5 jours)

**Feature suggérée: Ajouter couleur personnalisée aux tables**

Pourquoi?
- Nécessite: DB + Types + Validation + Action + UI
- Pas trop complexe
- Couvre tous les patterns

Étapes:
1. Migration SQL (ajouter colonne)
2. Types TypeScript
3. Validation Zod
4. Server Action (update table)
5. Composant UI (color picker)
6. Tester en local
7. Proposer PR à review

**Temps:** 1-2 jours

---

## 📋 Checklist de démarrage

Cochez au fur et à mesure:

### Setup (1h)
- [ ] Cloner repo
- [ ] `npm install`
- [ ] Configurer `.env.local`
- [ ] `npm run dev` fonctionnel
- [ ] Navigateur: `http://localhost:3000` accessible

### Apprentissage (4h)
- [ ] Lire GUIDE_DEMARRAGE complet
- [ ] Lire ARCHITECTURE_DIAGRAMS (sections 1-5)
- [ ] Lire DOCUMENTATION_TECHNIQUE (sections 1-5)
- [ ] Ouvrir et examiner:
  - [ ] `lib/auth/workspace.ts`
  - [ ] `types/entities.ts`
  - [ ] `lib/types/action-result.ts`
  - [ ] Une action dans `app/actions/entities/`

### Pratique (2-3h)
- [ ] Tester signup
- [ ] Tester login
- [ ] Créer workspace
- [ ] Créer table
- [ ] Ajouter champs et données
- [ ] Inviter utilisateur (tester flow complet)

### Prêt pour développement?
- [ ] Comprendre lib/auth/workspace.ts
- [ ] Savoir comment utiliser ActionResult
- [ ] Savoir structure d'une Server Action
- [ ] Savoir comment tester une feature localement

---

## 🔑 Concepts clés à maîtriser (ordre d'importance)

### 1️⃣ Server Actions
```typescript
'use server'
export async function myAction(input): Promise<ActionResult<T>> {
  // Validation → Auth → Authorization → Logic → DB
}
```
- Où la logique métier réside
- Comment sécuriser le code côté serveur

### 2️⃣ ActionResult Pattern
```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: ActionError }
```
- Toutes les actions retournent ce type
- Permet gestion error/success cohérente

### 3️⃣ Auth Helpers
```typescript
await requireAuth(supabase)                    // Vérifier user
await requireWorkspaceAccess(supabase, userId, wsId)  // Vérifier accès
```
- Centralisent les vérifications de sécurité
- Utilisées dans toutes les actions

### 4️⃣ JSONB Data Storage
```json
// entity_records.data
{
  "field-uuid-123": "valeur",
  "field-uuid-456": 42
}
```
- Données stockées en clés UUID
- Permet champs dynamiques sans migration

### 5️⃣ RLS (Row Level Security)
- PostgreSQL filtre les données au niveau DB
- Même si app contournée, DB protège
- Vérifiez RLS policy quand "permission denied"

### 6️⃣ Types TypeScript
- Décrits dans `types/entities.ts`
- Types pour Organization, Project, Table, Field, Record
- Toujours typer les inputs/outputs

---

## 📁 Structure des fichiers clés

### À lire en priorité
```
lib/auth/workspace.ts              # 🔐 Toute la sécurité
lib/types/action-result.ts         # ✅ Pattern de retour
types/entities.ts                  # 📝 Types métier
```

### À explorer par domaine
```
app/actions/entities/              # 🎯 Logique métier
  ├── workspace.ts
  ├── projects.ts
  ├── tables.ts
  ├── fields.ts
  ├── records.ts
  └── invitations.ts

lib/validations/                    # ✔️ Schémas Zod
  ├── auth.ts
  ├── entities.ts
  └── workspace.ts

supabase/migrations/                # 📊 Schéma DB
  ├── 20251222153520_create_dynamic_tables_system.sql
  ├── 20251224_add_projects_hierarchy.sql
  ├── 20251224_add_invitations_system.sql
  └── 20251224_fix_organization_members_rls.sql
```

### UI Components
```
components/
├── ui/                             # 🎨 Shadcn/ui (faire défiler)
├── create-workspace-modal.tsx      # 📦 Voir pattern modal
├── create-table-modal.tsx
└── entity-table.tsx               # 📊 Voir pattern data display
```

---

## 💡 Premiers pas pratiques

### 1. Explorer le code (30 min)

```bash
# Ouvrir projet dans IDE
code .

# Lecture recommandée
1. lib/auth/workspace.ts (50 lignes) → Comprendre requireAuth
2. types/entities.ts (100 lignes) → Voir types métier
3. app/actions/entities/workspace.ts (100 lignes) → Voir Server Action
```

### 2. Tester localement (1h)

```bash
# Terminal 1
npm run dev

# Terminal 2: Supabase (si vous avez linké le projet)
supabase start
```

Puis:
1. Accéder http://localhost:3000
2. Signup nouveau compte
3. Créer workspace
4. Créer table
5. Ajouter données

### 3. Faire une petite modification (2h)

**Objectif: Ajouter champ "emoji" pour les tables**

Steps (dans GUIDE_DEMARRAGE section 3):
1. Migration SQL: `ALTER TABLE entity_tables ADD emoji TEXT;`
2. Types: Ajouter `emoji?: string` à EntityTable
3. Validation: Ajouter field au schéma
4. Action: Modifier `updateTableAction` pour emoji
5. UI: Ajouter input emoji dans table modal
6. Test: Créer table, voir emoji sauvegardé

---

## ❓ Questions fréquentes

**Q: Par où commencer si je n'ai jamais utilisé Next.js?**
A: Lire GUIDE_DEMARRAGE section 6 "Structure d'une page". Voir que pages sont Server Components.

**Q: Comment savoir quelle action utiliser?**
A: Lire DOCUMENTATION_TECHNIQUE section 10 "Guides de développement". Copier pattern similaire.

**Q: Mon changement fonctionne localement mais pas en prod?**
A: Vérifier migrations Supabase poussées: `supabase db push`

**Q: User voit les données d'un autre user?**
A: Vérifier RLS policy: DOCUMENTATION_TECHNIQUE section "Row Level Security"

**Q: Comment déboguer une action qui échoue?**
A: GUIDE_DEMARRAGE section 8 "Debugging courant". Check console logs, Network tab.

---

## 🎓 Ressources supplémentaires

### Documentation officielle
- **Next.js:** https://nextjs.org/docs
- **Supabase:** https://supabase.com/docs
- **React Hook Form:** https://react-hook-form.com
- **Zod:** https://zod.dev

### Dans le repo
- `DOCUMENTATION_TECHNIQUE.md` - Documentation complète (145KB)
- `ARCHITECTURE_DIAGRAMS.md` - 10 diagrammes expliqués
- `GUIDE_DEMARRAGE.md` - Pratique et patterns
- Cette file → Overview et chemin apprentissage

---

## 🤝 Comment demander aide?

### Avant d'escalader:
1. **Chercher** dans les docs (Ctrl+F)
2. **Googler** "Next.js [problème]" ou "Supabase [problème]"
3. **Examiner** code similaire dans le projet
4. **Consulter** DOCUMENTATION_TECHNIQUE section FAQ

### Quand demander aide:
- Unclear requirement
- Blocker technique
- Decision architecture
- Code review avant PR

---

## ✅ Succès = ?

Vous êtes prêt quand vous pouvez:

- ✅ Lancer dev environment localement
- ✅ Comprendre flow: signup → workspace → table → données
- ✅ Identifier où changer pour une feature
- ✅ Écrire Server Action avec validation
- ✅ Lire et modifier RLS policy
- ✅ Faire PR sans questions syntaxe
- ✅ Debugger problème basique
- ✅ Proposer optimisation simple

---

## 📅 Timeline recommandée

```
Jour 1   │ Setup + Compréhension (4-5h)
         │ → Goal: Lancer app, lire docs clés
         │
Jour 2-3 │ Apprentissage en profondeur (6-8h)
         │ → Goal: Comprendre patterns, lire tous flows
         │
Jour 4-5 │ Première feature simple (8-12h)
         │ → Goal: Feature complète testée
         │
Semaine 2│ Features + PR reviews (productif)
         │ → Goal: Contribuer en indépendant
```

---

## 🚀 Prochaines étapes

1. **Aujourd'hui:**
   - Setup dev environment
   - Lire GUIDE_DEMARRAGE complet
   - Lancer l'app

2. **Demain:**
   - Lire ARCHITECTURE_DIAGRAMS
   - Explorer code: lib/auth, types
   - Tester app complet

3. **Cette semaine:**
   - Lire DOCUMENTATION_TECHNIQUE sections 1-5
   - Ajouter petite feature (couleur tables, émoji, etc)
   - Proposer PR pour review

---

**Bienvenue à bord!** 🎉

Si vous avez des questions, consultez les docs ou demandez à l'équipe. L'objectif c'est que vous soyez autonome et productif rapidement.

Bonne chance! 💪
