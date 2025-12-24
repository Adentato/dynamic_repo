# 🔧 Remaining Issues - Phase 1

## Issue 1: Second Workspace Creation Redirects to Onboarding

**Problem**: Creating 2nd workspace → URL stays `/dashboard` → Membership shows as `null` → Redirects to `/onboarding` (infinite loop)

**Root Cause**: `router.refresh()` not aggressive enough - data not synced before navigation

**Solution**: Use `redirect()` directly in the server action instead of returning and using client-side refresh

### Fix: Update `createWorkspaceAction()`

```typescript
// At the end of app/actions/entities/workspace.ts

// Success - use SERVER-SIDE redirect instead of client refresh
revalidatePath('/dashboard', 'layout')
revalidatePath('/', 'layout')

// Redirect immediately from server
redirect('/dashboard')
```

Then update the modal to expect redirect (no need for success handling).

---

## Issue 2: Slug Constraint is Global, Not Per-User

**Problem**: Two different users can't both have workspace slug `test-2` - violates global unique constraint

**Expected**: Slugs should be unique per user, not globally

**Cause**: Database constraint is `UNIQUE(slug)` instead of `UNIQUE(slug, created_by)`

### Fix: Create Migration for Constraint

```sql
-- Drop the bad constraint
ALTER TABLE public.organizations 
DROP CONSTRAINT IF EXISTS organizations_slug_key;

-- Create the correct constraint (unique per user)
ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_slug_created_by_key UNIQUE(slug, created_by);
```

Execute this in **Supabase Dashboard → SQL Editor**

---

## Action Items

1. **Apply SQL fix for slug constraint** via Supabase Dashboard
2. **Update `createWorkspaceAction()`** to use server-side `redirect()` instead of returning
3. **Revert modal changes** - it should just close on redirect, not handle success manually

After these fixes, you should be able to:
- Create multiple workspaces without redirect loops
- Have the same slug in different user accounts
