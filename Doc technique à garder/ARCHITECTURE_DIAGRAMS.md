# Diagrammes d'Architecture

## 1. Architecture générale du système

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Navigateur Web                              │
│  (React 19 + Next.js App Router + Shadcn/ui Components)            │
└────────────────────┬────────────────────────────────────────────────┘
                     │ HTTPS
                     │
        ┌────────────▼────────────┐
        │   Next.js 16            │
        │  - App Router           │
        │  - Server Components    │
        │  - Server Actions       │
        │  - Middleware (auth)    │
        └────────────┬────────────┘
                     │
         ┌───────────┴────────────┐
         │                        │
    ┌────▼────┐            ┌──────▼──────┐
    │ Supabase │            │  Validation │
    │   Auth   │            │    (Zod)    │
    │ (JWT)    │            └─────────────┘
    └────┬─────┘
         │
    ┌────▼──────────────────────────────┐
    │  Supabase PostgreSQL Database     │
    │  - Tables (entity, auth, config)  │
    │  - Row Level Security (RLS)       │
    │  - Triggers & Functions           │
    │  - Indexes & Performance          │
    └───────────────────────────────────┘
```

---

## 2. Hiérarchie et relations des données

```
User (Supabase Auth)
│
├─ id: uuid
├─ email: string
└─ password_hash: (sécurisé)
    │
    │
    ▼
Profile
├─ id: uuid (PK)
├─ user_id: uuid (FK → auth.users)
├─ email: string
├─ full_name: string
└─ created_at: timestamp
    │
    │
    ▼
Organization (Workspace)
├─ id: uuid (PK)
├─ name: string
├─ slug: string (unique)
├─ description: string
├─ created_by: uuid (FK → profiles)
└─ created_at: timestamp
    │
    ├─────────────────────────┬─────────────────────────┐
    │                         │                         │
    ▼                         ▼                         ▼
organization_members    workspace_invitations    Projects
├─ id: uuid            ├─ id: uuid              ├─ id: uuid
├─ org_id: uuid        ├─ org_id: uuid          ├─ workspace_id: uuid
├─ user_id: uuid       ├─ email: string         ├─ name: string
├─ role: enum          ├─ token: string         ├─ description: string
│ (owner/admin/member) ├─ role: enum            ├─ color: string
└─ created_at         ├─ expires_at: timestamp  └─ created_at: timestamp
                      ├─ accepted_at: timestamp     │
                      └─ created_by: uuid           │
                                                    │
                                                    ▼
                                            Entity Tables
                                            ├─ id: uuid
                                            ├─ workspace_id: uuid
                                            ├─ project_id: uuid
                                            ├─ name: string
                                            ├─ description: string
                                            └─ created_at: timestamp
                                                │
                                    ┌───────────┴───────────┐
                                    │                       │
                                    ▼                       ▼
                            entity_fields          entity_records
                            ├─ id: uuid            ├─ id: uuid
                            ├─ table_id: uuid      ├─ table_id: uuid
                            ├─ name: string        ├─ data: JSONB
                            ├─ type: enum          │  {
                            │ (text/number/        │    "field-uuid": value,
                            │  select/date/...)    │    "field-uuid": value
                            ├─ options: JSONB      │  }
                            ├─ order_index: int    └─ created_at: timestamp
                            └─ created_at
```

---

## 3. Flow d'authentification

```
                    SIGNUP FLOW

User Signup Form
    │
    ├─ Email: user@example.com
    ├─ Password: ••••••••
    └─ Name: John Doe
        │
        ▼
signUpAction (Server Action)
    ├─ Validate input (Zod)
    ├─ Hash password
    └─ Call Supabase Auth
        │
        ▼
auth.users (Supabase)
    ├─ id: 'uuid-user-1'
    ├─ email: 'user@example.com'
    └─ password_hash: '$2a$...'
        │
        ▼ (SQL Trigger)
profiles (Auto-created)
    ├─ id: 'uuid-user-1'
    ├─ user_id: 'uuid-user-1'
    ├─ email: 'user@example.com'
    └─ created_at: '2024-12-26'
        │
        ▼
signInAction (Auto-signin)
    ├─ Create JWT token
    ├─ Set httpOnly cookie
    └─ Session active
        │
        ▼
Redirect /after-signup
    └─ Create first workspace


                    LOGIN FLOW

User Login Form
    │
    ├─ Email: user@example.com
    └─ Password: ••••••••
        │
        ▼
signInAction (Server Action)
    ├─ Validate input (Zod)
    ├─ Verify with Supabase Auth
    └─ Match password hash
        │
        ▼ Success
JWT Token created
    ├─ user_id: 'uuid-user-1'
    ├─ expires_in: 3600 (1 hour)
    └─ token: 'eyJhbGc...'
        │
        ▼
Set httpOnly Cookie
    ├─ Secure flag
    ├─ HttpOnly flag
    └─ SameSite: strict
        │
        ▼
Session Active
    └─ All subsequent requests include JWT


                    LOGOUT FLOW

User Clicks Logout
    │
    ▼
signOutAction (Server Action)
    ├─ Revoke session
    └─ Clear cookies
        │
        ▼
Redirect /login
    └─ Session removed
```

---

## 4. Flow de création workspace et table

```
┌─────────────────────────────────────────────────────────────────┐
│              WORKSPACE & TABLE CREATION FLOW                    │
└─────────────────────────────────────────────────────────────────┘

                    1️⃣ USER CREATES WORKSPACE

User clicks "New Workspace"
    │
    ▼
CreateWorkspaceModal (Component)
    ├─ Input: name
    └─ Submit
        │
        ▼
createWorkspaceAction (Server Action)
    ├─ Validate: name (Zod)
    ├─ requireAuth() - check user authenticated
    │
    └─▶ DB INSERT organization
        ├─ name: "My First Workspace"
        ├─ slug: "my-first-workspace"
        ├─ created_by: user.id
        └─ Return: organization_id
            │
            ▼
        DB INSERT organization_members
        ├─ organization_id: workspace_id
        ├─ user_id: user.id
        ├─ role: "owner"
        └─ created_at: now()
            │
            ▼
Return ActionResult<Organization>
    │
    ▼
Redirect /dashboard/workspace/[id]


                    2️⃣ USER CREATES TABLE

User in Workspace, clicks "New Table"
    │
    ▼
CreateTableModal (Component)
    ├─ Input: name, project (optional)
    └─ Submit
        │
        ▼
createEntityTableAction (Server Action)
    ├─ Validate: name, projectId (Zod)
    ├─ requireAuth() - check user authenticated
    ├─ requireWorkspaceAccess() - check workspace access
    │
    └─▶ DB INSERT entity_tables
        ├─ workspace_id: workspace.id
        ├─ project_id: project.id (if selected)
        ├─ name: "Customers"
        ├─ description: ""
        └─ Return: table_id
            │
            ▼
Return ActionResult<EntityTable>
    │
    ▼
Redirect /dashboard/workspace/[id]/table/[tableId]
    └─ Empty table, ready for columns


                    3️⃣ USER ADDS FIELDS

User in Table, clicks "Add Column"
    │
    ▼
AddFieldForm (Component)
    ├─ Input: name, type (text/number/select/date/...)
    └─ Submit
        │
        ▼
createEntityFieldAction (Server Action)
    ├─ Validate: name, type (Zod)
    ├─ requireAuth()
    ├─ requireTableInWorkspace()
    │
    └─▶ DB INSERT entity_fields
        ├─ table_id: table.id
        ├─ name: "Name"
        ├─ type: "text"
        ├─ id: gen_random_uuid() [field reference]
        ├─ order_index: 1
        └─ Return: field_id
            │
            ▼
Return ActionResult<EntityField>
    │
    ▼
Refresh UI - new column visible


                    4️⃣ USER ADDS DATA

User types in cell or form
    │
    ▼
upsertEntityRecordAction (Server Action)
    ├─ Input: tableId, recordId, data: {
    │   "field-uuid-123": "John Doe",
    │   "field-uuid-456": 30
    │ }
    ├─ requireAuth()
    ├─ requireTableInWorkspace()
    │
    └─▶ DB INSERT/UPDATE entity_records
        ├─ table_id: table.id
        ├─ data: JSONB {field-uuid: value}
        └─ Return: record_id
            │
            ▼
Return ActionResult<EntityRecord>
    │
    ▼
Refresh table view - data visible
```

---

## 5. Flow d'autorisation et sécurité

```
┌────────────────────────────────────────────────────────────────────┐
│                   AUTHORIZATION FLOW (3 layers)                    │
└────────────────────────────────────────────────────────────────────┘

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Layer 1: Application Code (Server Actions)                       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

User requests action
    │
    ▼
myAction (Server Action)
    ├─ requireAuth(supabase)
    │   └─ Check: JWT token valid?
    │       ├─ Yes: return user object
    │       └─ No: throw AuthenticationError
    │
    ├─ requireWorkspaceAccess(supabase, userId, workspaceId)
    │   └─ Check: Is user member of workspace?
    │       └─ Query: SELECT * FROM organization_members
    │           WHERE organization_id = workspaceId
    │           AND user_id = userId
    │       ├─ Found: return Organization
    │       └─ Not found: throw WorkspaceAccessError
    │
    └─ Continue with action logic


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Layer 2: Row Level Security (Database Policy)                    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Even if app layer bypassed, DB RLS prevents access

SELECT * FROM entity_tables
    │
    ▼
RLS Policy Evaluation
    ├─ Check: Is requesting user authenticated?
    │   └─ Get: auth.uid() (from JWT)
    │
    ├─ Check: SELECT policy
    │   └─ WHERE workspace_id IN (
    │       SELECT organization_id FROM organization_members
    │       WHERE user_id = auth.uid()
    │     )
    │
    ├─ User IS member of workspace?
    │   ├─ Yes: Allow query, return records
    │   └─ No: Deny access, return error 403
    │
    └─ Similar policies for INSERT/UPDATE/DELETE


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Layer 3: Input Validation (Zod Schema)                           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

User submits form
    │
    ▼
createTableSchema.parse(input)
    ├─ name: z.string().min(1).max(100)
    │   └─ Check: string between 1-100 chars?
    │
    ├─ projectId: z.string().uuid().optional()
    │   └─ Check: valid UUID if provided?
    │
    ├─ All validations pass?
    │   ├─ Yes: continue to DB
    │   └─ No: return validation error
    │
    └─ Type-safe object returned to action


                    AUTHORIZATION SUMMARY

User A requests table from Workspace B
    │
    ├─ Layer 1 (App): Check if A is member of B
    │                 ✅ Pass
    │
    ├─ Layer 2 (DB RLS): Check auth.uid() in org_members
    │                    ✅ Pass
    │
    └─ Data returned: A sees only their own data
       ✅ Secure


User C (unauthorized) tries to access Workspace B
    │
    ├─ Layer 1 (App): Check if C is member of B
    │                 ❌ FAIL → WorkspaceAccessError
    │
    └─ Layer 2 (DB RLS): Prevents access anyway
                         ❌ 403 Forbidden
```

---

## 6. Types de données et JSONB

```
┌────────────────────────────────────────────────────────────────────┐
│              DYNAMIC DATA STORAGE WITH JSONB                       │
└────────────────────────────────────────────────────────────────────┘

Traditional Database (STATIC):
┌─────────────────────────────┐
│ customers table             │
├─────────────────────────────┤
│ id  │ name  │ age │ email   │
├─────┼───────┼─────┼─────────┤
│ 1   │ John  │ 30  │ j@ex.com│
│ 2   │ Jane  │ 28  │ j@ex.com│
└─────────────────────────────┘

Problem: Add new column? Need ALTER TABLE migration


OUR SOLUTION (DYNAMIC):
┌────────────────────────────────────────────────────┐
│ entity_tables                                      │
├────────────────────────────────────────────────────┤
│ id: uuid-123    name: "Customers"                  │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ entity_fields                                      │
├─────────────────────────────────────────────────────┤
│ id (UUID)        │ name      │ type    │ table_id  │
├──────────────────┼───────────┼─────────┼───────────┤
│ f-uuid-a1b2c3d4  │ "Name"    │ "text"  │ uuid-123  │
│ f-uuid-e5f6g7h8  │ "Age"     │ "number"│ uuid-123  │
│ f-uuid-i9j0k1l2  │ "Email"   │ "email" │ uuid-123  │
│ f-uuid-m3n4o5p6  │ "Country" │ "text"  │ uuid-123  │
└──────────────────┴───────────┴─────────┴───────────┘

┌────────────────────────────────────────────────────┐
│ entity_records                                     │
├─────────────────────────────────────────────────────┤
│ id        │ table_id  │ data (JSONB)               │
├───────────┼───────────┼────────────────────────────┤
│ rec-001   │ uuid-123  │ {                          │
│           │           │   "f-a1b2c3d4": "John",   │
│           │           │   "f-e5f6g7h8": 30,       │
│           │           │   "f-i9j0k1l2": "j@ex",   │
│           │           │   "f-m3n4o5p6": "USA"     │
│           │           │ }                         │
├───────────┼───────────┼────────────────────────────┤
│ rec-002   │ uuid-123  │ {                          │
│           │           │   "f-a1b2c3d4": "Jane",   │
│           │           │   "f-e5f6g7h8": 28,       │
│           │           │   "f-i9j0k1l2": "j@ex",   │
│           │           │   "f-m3n4o5p6": "Canada"  │
│           │           │ }                         │
└───────────┴───────────┴────────────────────────────┘

ADVANTAGES:
✅ Add field: Just INSERT into entity_fields
✅ No migration: No ALTER TABLE needed
✅ Remove field: DELETE from entity_fields
✅ Flexible: Each record can have different fields
✅ Type-safe: Type defined in entity_fields.type


How to add "Phone" column:

1. INSERT entity_fields
   ├─ id: f-uuid-x1y2z3
   ├─ table_id: uuid-123
   ├─ name: "Phone"
   └─ type: "text"

2. No DB migration needed!

3. Existing records still work:
   └─ Add field-uuid-x1y2z3 to data JSONB when user enters phone

4. To remove "Country":
   └─ DELETE from entity_fields WHERE id = f-m3n4o5p6
   └─ Existing data still in JSONB (orphaned but not breaking)
```

---

## 7. Lifecycle d'une requête

```
┌─────────────────────────────────────────────────────────────────┐
│            FULL REQUEST LIFECYCLE                               │
└─────────────────────────────────────────────────────────────────┘

USER INTERACTION
├─ User types in input field
├─ Clicks button
└─ Form submits


CLIENT-SIDE (Browser)
├─ React component captures input
├─ Validates with React Hook Form
├─ Shows local errors if any
├─ Disables submit button (loading state)
└─ Calls Server Action


NETWORK
├─ HTTP POST to /api/
├─ Request body: serialized form data
├─ Auth header: JWT token (httpOnly cookie)
└─ Next.js server receives request


SERVER-SIDE (Next.js)
│
├─ Middleware intercepts (optional)
│   └─ Check session valid
│
├─ Server Action executes
│   ├─ 1. Input Validation (Zod)
│   │   ├─ Parse input
│   │   └─ Type validation
│   │       ├─ Valid: continue
│   │       └─ Invalid: return error
│   │
│   ├─ 2. Authentication
│   │   └─ requireAuth(supabase)
│   │       ├─ Get user from JWT
│   │       ├─ Verify auth.users
│   │       └─ Get user object
│   │
│   ├─ 3. Authorization
│   │   └─ requireWorkspaceAccess(...)
│   │       ├─ Check organization_members
│   │       ├─ Verify user is member
│   │       └─ Get workspace details
│   │
│   ├─ 4. Business Logic
│   │   └─ Process request
│   │       └─ Prepare DB mutation
│   │
│   └─ 5. Database Operation
│       └─ supabase.from('table').insert({...})
│           ├─ RLS policies evaluated
│           ├─ WHERE conditions applied
│           ├─ Mutation executed
│           └─ Result returned


DATABASE (Supabase PostgreSQL)
├─ Receive INSERT/UPDATE/DELETE query
├─ Apply RLS policies
│   └─ Check: auth.uid() in allowed rows?
│       ├─ Yes: Execute
│       └─ No: 403 Forbidden
├─ Apply triggers (if any)
│   └─ Example: Set updated_at = now()
├─ Validate constraints
│   └─ Example: Foreign keys, unique
├─ Write to disk
└─ Return result


SERVER RESPONSE
├─ Server Action returns ActionResult
│   ├─ Success: { success: true, data: {...} }
│   └─ Error: { success: false, error: {...} }
├─ HTTP 200 OK
└─ Response body: serialized ActionResult


NETWORK RESPONSE
├─ Browser receives response
└─ Body: ActionResult JSON


CLIENT UPDATE
├─ Server Action promise resolves
├─ React component checks result.success
├─ If success:
│   ├─ Update local state
│   ├─ Show success message
│   └─ Redirect or refresh data
├─ If error:
│   ├─ Show error message to user
│   ├─ Re-enable form
│   └─ Allow retry


USER SEES
├─ Success: "Changes saved!"
│   └─ Page updated
├─ Error: "Email already in use"
│   └─ Can retry immediately
└─ Loading: Button spinner while processing


Total time: 100-500ms depending on operation
```

---

## 8. Diagramme des états et transitions

```
┌────────────────────────────────────────────────────────────────┐
│          USER STATE TRANSITIONS                               │
└────────────────────────────────────────────────────────────────┘

                         ┌─────────────┐
                         │ Not Signed  │
                         │     Up      │
                         └──────┬──────┘
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
            ┌────▼─────┐            ┌──────────▼────┐
            │  Signup  │            │  Accept Invite│
            │  Page    │            │  (if new user)│
            └────┬─────┘            └──────────┬────┘
                 │                             │
                 │         ┌───────────────────┤
                 │         │                   │
            ┌────▼─────────▼──────┐            │
            │  Account Created    │            │
            │  (email verified)   │◄───────────┘
            └────┬────────────────┘
                 │
                 ▼
            ┌─────────────┐
            │  Signed Up, │
            │ Not Logged  │
            │     In      │
            └──────┬──────┘
                   │
        ┌──────────┴──────────┐
        │                     │
    ┌───▼────┐          ┌────▼───┐
    │ Login  │          │ Invite │
    │ Page   │          │ Token  │
    └───┬────┘          └────┬───┘
        │                    │
        │   ┌────────────────┤
        │   │                │
    ┌───▼───▼──────────────┐
    │   Session Created    │
    │   (JWT in cookie)    │
    └───┬─────────────────┘
        │
        ▼
    ┌──────────────┐
    │   Logged In  │
    │   (Default   │
    │  Dashboard)  │
    └───┬──────────┘
        │
        ├────────────────────┬──────────────────┐
        │                    │                  │
    ┌───▼────┐        ┌──────▼────┐      ┌────▼────┐
    │ Browse │        │  Create   │      │ Manage  │
    │ Data   │        │ Workspace │      │ Members │
    └────────┘        └───────────┘      └─────────┘
        │
        │ (Continue using app)
        │
        ├──────────────────────┐
        │                      │
    ┌───▼────┐          ┌──────▼────┐
    │ Logout │          │ Inactivity│
    │ Button │          │ (1h idle) │
    └───┬────┘          └──────┬────┘
        │                      │
        │    ┌─────────────────┤
        │    │                 │
    ┌───▼────▼───────┐
    │  Session Ended │
    │  (Logged Out)  │
    └───┬────────────┘
        │
        ▼
    ┌─────────────┐
    │  Logged Out │
    │  (redirected
    │   to /login)│
    └─────────────┘
```

---

## 9. Architecture des permissions et rôles

```
┌────────────────────────────────────────────────────────────┐
│         ROLES & PERMISSIONS STRUCTURE                      │
└────────────────────────────────────────────────────────────┘

Organization Levels:

                    Organization (Workspace)
                            │
                    ┌───────┴────────┐
                    │                │
        ┌───────────▼──────┐  ┌──────▼──────────┐
        │ organization_    │  │ workspace_      │
        │ members          │  │ invitations     │
        └───────────┬──────┘  └──────┬──────────┘
                    │                │
    ┌──────────────┼────────────────┤
    │              │                │
    │  ┌───────────▼──────────┐    │
    │  │ Roles (in DB)        │    │
    │  ├──────────────────────┤    │
    │  │ • owner              │    │
    │  │ • admin              │    │
    │  │ • member             │    │
    │  └──────────────────────┘    │
    │                              │
    │  Role Permissions:           │
    │                              │
    │  OWNER:                      │
    │  ├─ All actions              │
    │  ├─ Create/delete workspace  │
    │  ├─ Manage members           │
    │  ├─ Manage projects/tables   │
    │  └─ Delete organization      │
    │                              │
    │  ADMIN:                      │
    │  ├─ Create/manage projects   │
    │  ├─ Create/edit tables       │
    │  ├─ Invite members           │
    │  ├─ Manage table permissions │
    │  └─ Cannot delete workspace  │
    │                              │
    │  MEMBER:                     │
    │  ├─ View tables              │
    │  ├─ Edit data in tables      │
    │  ├─ Cannot manage structure  │
    │  └─ Cannot invite others     │
    │                              │
    └──────────────────────────────┘


Permission Matrix:

Action                    │ Owner │ Admin │ Member
──────────────────────────┼───────┼───────┼────────
View workspace            │   ✅   │  ✅   │  ✅
View tables/data          │   ✅   │  ✅   │  ✅
Edit data                 │   ✅   │  ✅   │  ✅
Create table              │   ✅   │  ✅   │  ❌
Edit table structure      │   ✅   │  ✅   │  ❌
Create project            │   ✅   │  ✅   │  ❌
Invite members            │   ✅   │  ✅   │  ❌
Remove members            │   ✅   │  ✅   │  ❌
Edit member role          │   ✅   │  ❌   │  ❌
Delete workspace          │   ✅   │  ❌   │  ❌
Transfer ownership        │   ✅   │  ❌   │  ❌


Implementation:
1. Store role in organization_members.role
2. Check role in Server Action:
   - Get user role: SELECT role FROM organization_members
   - Verify permission: if (role !== 'owner') throw Error
3. RLS policies filter by role (if needed)
4. UI hides buttons based on role (nice-to-have)
```

---

## 10. Performance et scaling

```
┌────────────────────────────────────────────────────────┐
│          PERFORMANCE OPTIMIZATION                     │
└────────────────────────────────────────────────────────┘

INDEXES (Création rapide)
┌─────────────────────────────────────────┐
│ entity_tables                           │
├─────────────────────────────────────────┤
│ ✅ INDEX: workspace_id                  │
│    └─ Fast lookup by workspace         │
│                                         │
│ ✅ INDEX: created_at DESC              │
│    └─ Sort by creation date            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ entity_records                          │
├─────────────────────────────────────────┤
│ ✅ INDEX: table_id                     │
│    └─ Fast lookup all records         │
│                                        │
│ ✅ GIN INDEX: data (JSONB)             │
│    └─ Search in JSONB data (future)   │
│                                        │
│ ✅ COMPOSITE: (table_id, created_at)  │
│    └─ Table + sort order              │
└─────────────────────────────────────────┘


PAGINATION

Without pagination:
├─ 100,000 records
├─ SELECT * returns all
├─ Slow network transfer
└─ Memory overload

With pagination (recommended):
├─ SELECT ... LIMIT 20 OFFSET 0
├─ Page 1: records 0-19
├─ Page 2: records 20-39
└─ Efficient use of bandwidth

Implementation:
const limit = 20
const page = 1
const offset = (page - 1) * limit

const { data: records, count } = await supabase
  .from('entity_records')
  .select('*', { count: 'exact' })
  .eq('table_id', tableId)
  .range(offset, offset + limit - 1)


CACHING (React Query - TanStack)

Without caching:
├─ Click same record twice
├─ Two DB queries
└─ Slower UX

With caching:
├─ Click record first time
│  └─ DB query, cache result
├─ Click record second time
│  └─ Return cached result (instant)
├─ 5 min idle: invalidate cache
└─ Next click: fresh from DB


DENORMALIZATION (Future)

Currently:
└─ Normalized: organization_members {role}
   └─ Query: Check role in table every time

Future (if many role checks):
├─ Denormalize: Store role in JWT
│  └─ Decode JWT: get role instantly
│  └─ No DB query needed
│  └─ Invalidate on role change


SCALING CONSIDERATIONS

Current (single Supabase instance):
├─ Works for: 100K-1M records
├─ Works for: 100-10K concurrent users
├─ Bottleneck: Large JSONB queries

Future scaling:
├─ Read replicas: Distribute read load
├─ Caching layer: Redis for hot data
├─ Sharding: Split by workspace_id
├─ Elasticsearch: Full-text search
```

---

## Résumé visuel simplifié

```
La structure en 10 secondes:

User (signup/login)
    ↓
Workspace (créé par user)
    ├─ Projects (groupes de tables)
    └─ Tables (définition colonne + données)
        ├─ Fields (les colonnes)
        └─ Records (les données)

Sécurité:
- Auth: JWT token via Supabase Auth
- RLS: PostgreSQL empêche accès non-autorisé
- Helpers: Vérifications supplémentaires en app layer

Flux typique:
1. User type dans form
2. React Hook Form valide
3. Server Action appelle Supabase
4. RLS policies filtrent dans DB
5. Données retournées au client
6. UI mise à jour

C'est tout! 🚀
```
