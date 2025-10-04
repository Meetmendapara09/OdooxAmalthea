# ExpensEasy - Project Architecture

## Overview
ExpensEasy is a modern expense management system built with Next.js 15, PostgreSQL via Prisma, and NextAuth for authentication. All data operations flow through Prisma ORM to ensure consistency and type safety.

---

## Technology Stack

### Core Technologies
- **Frontend**: Next.js 15.5.4 (App Router), React 18.3, TypeScript 5
- **Database**: PostgreSQL (via Prisma Accelerate)
- **ORM**: Prisma 6.16.3
- **Authentication**: NextAuth v4 (JWT strategy with Credentials provider)
- **UI**: Tailwind CSS, Radix UI components, Recharts
- **OCR**: Tesseract.js (client-side)
- **External APIs**:
  - Rest Countries API (country/currency data)
  - ExchangeRate-API (live currency conversions)

---

## Database Architecture

### Schema Overview (PostgreSQL via Prisma)

```
Company (1) ──→ (N) User (1) ──→ (N) Expense (1) ──→ (N) Approval
                                        ↑
                                        │
                                   User (approver)
```

### Models

#### **Company**
- Represents an organization
- Has one base currency (via Currency relation)
- Contains multiple users

**Fields:**
- `id`: String (CUID)
- `name`: String
- `currencyCode`: String (FK to Currency)
- Relations: `users[]`, `currency`

#### **Currency**
- Stores currency metadata
- Referenced by companies

**Fields:**
- `code`: String (PK, e.g., "USD")
- `name`: String
- `symbol`: String
- Relations: `companies[]`

#### **User**
- Represents system users (employees, managers, admins)
- Belongs to one company
- Can create expenses and approve others' expenses
- Has password for authentication

**Fields:**
- `id`: String (CUID)
- `name`: String
- `email`: String (unique)
- `password`: String? (bcrypt hashed)
- `role`: UserRole enum (admin|manager|employee)
- `avatarUrl`: String
- `companyId`: String? (FK)
- Relations: `company`, `expenses[]`, `approvals[]`, `accounts[]`, `sessions[]`

#### **Expense**
- Expense submission by an employee
- Has conditional approval rules (JSON)
- Tracks approval status

**Fields:**
- `id`: String (CUID)
- `description`: String
- `amount`: Decimal(12,2)
- `currency`: String (ISO code)
- `category`: String
- `date`: DateTime
- `status`: ExpenseStatus enum (pending|approved|rejected)
- `comments`: String?
- `receiptUrl`: String?
- `employeeId`: String (FK to User)
- `approvalRules`: Json? (flexible rule configuration)
- Relations: `employee`, `approvals[]`

**Approval Rules Types:**
- **Percentage**: Requires X% of eligible approvers
- **Specific Approver**: Requires approval from specific users (e.g., CFO)
- **Hybrid**: Both percentage AND specific approvers required
- **Sequential Routing**: Ordered `approverSequence` (with optional manager-first flag) ensures each approver acts in sequence; the API locks the flow to the next scheduled approver.

#### **Approval**
- Records individual approval/rejection decisions
- Links approver (User) to expense
- Unique constraint prevents duplicate votes

**Fields:**
- `id`: String (CUID)
- `decision`: String ('approved' | 'rejected')
- `timestamp`: DateTime
- `comments`: String?
- `expenseId`: String (FK)
- `approverId`: String (FK to User)
- Relations: `expense`, `approver`
- Unique: `[expenseId, approverId]`
- UI enforces collecting a comment when an approver rejects an expense; comments are persisted on each `Approval` record.

#### **NextAuth Models** (Account, Session, VerificationToken)
- Support NextAuth session management
- Currently using JWT strategy (not database sessions)

---

## Authentication Flow

### Strategy: NextAuth with JWT + Credentials Provider

**Why JWT?**
- Credentials provider requires JWT strategy (no OAuth flow)
- Session data stored in encrypted JWT token
- No database session table queries on every request

### Login Flow

```
1. User submits email/password → /api/auth/[...nextauth]
2. NextAuth calls authorize() callback
3. Query PostgreSQL via Prisma: prisma.user.findUnique()
4. Verify password with bcrypt.compare()
5. Return user object with role, companyId
6. NextAuth jwt() callback: Store user data in JWT token
7. NextAuth session() callback: Expose user data to client
8. Client receives session with user.id, role, companyId
```

### Session Data Structure

```typescript
session.user = {
  id: string,
  email: string,
  name: string,
  role: 'admin' | 'manager' | 'employee',
  companyId: string,
  avatarUrl: string
}
```

### Environment Variables (Required)

```env
DATABASE_URL="prisma+postgres://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<secure-random-string>"
```

---

## API Routes (All use Prisma)

### Authentication
- **POST `/api/auth/[...nextauth]`**: NextAuth handler (login, session)
- **POST `/api/signup`**: Create company + admin user

### Users
- **GET `/api/users`**: List all users (with companyId)

### Companies
- **GET `/api/companies`**: List companies with currency
- **POST `/api/companies`**: Create company (upserts currency)
- **POST `/api/companies/[id]/users`**: Add user to company

### Expenses
- **GET `/api/expenses`**: List expenses with employee + approvals
- **POST `/api/expenses`**: Create expense
- **GET `/api/expenses/[id]`**: Get single expense
- **PATCH `/api/expenses/[id]`**: Record approval/rejection (re-evaluates status)
- Sequential approvals: validates the caller is the next approver in the defined sequence and notifies the subsequent approver (or employee on completion)
- **DELETE `/api/expenses/[id]`**: Retract approval (re-evaluates status)

### All API Routes:
- Import `prisma` from `@/lib/db`
- Use Prisma queries (`.findMany()`, `.create()`, `.update()`, etc.)
- Return JSON responses
- Include proper error handling (404, 400, 403, 500)

---

## Data Flow Architecture

### Frontend → API → Database

```
┌─────────────────────────────────────────────────────────────┐
│  Client (Browser)                                           │
│  - React components                                         │
│  - AppContext (useAppContext hook)                          │
│  - Session via useSession() from next-auth/react            │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ fetch() API calls
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  Next.js API Routes (/api/*)                                │
│  - Import prisma from @/lib/db                              │
│  - Execute Prisma queries                                   │
│  - Apply business logic (approval evaluation, RBAC checks)  │
│  - Return JSON                                              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Prisma Client
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  Prisma ORM                                                 │
│  - Type-safe query builder                                  │
│  - Schema validation                                        │
│  - Relation management                                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ SQL queries (via Accelerate)
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL Database (Prisma Accelerate)                    │
│  - Stores all application data                              │
│  - Enforces foreign keys, unique constraints                │
│  - Handles transactions                                     │
└─────────────────────────────────────────────────────────────┘
```

### AppContext Pattern

**Purpose**: Centralized state management for client-side data

**Flow:**
1. On mount, `AppContext` fetches:
   - Users: `GET /api/users`
   - Expenses: `GET /api/expenses`
   - Companies: `GET /api/companies`
2. Derives `currentUser` from NextAuth session email
3. Derives `currentCompany` from `currentUser.companyId`
4. Provides actions:
   - `addExpense()`: POST to `/api/expenses`
   - `updateExpenseStatus()`: PATCH to `/api/expenses/[id]`
5. Updates local state after successful API calls

**Key Point**: AppContext never stores hardcoded data—it's a cache of API responses.

---

## Features & Workflows

### 1. **Signup Flow**
```
User fills form (company, name, email, password, country)
  ↓
POST /api/companies (create company + upsert currency)
  ↓
POST /api/signup (create admin user for that company)
  ↓
signIn('credentials') auto-login
  ↓
Redirect to /dashboard
```

### 2. **Expense Creation Flow**
```
User uploads receipt image (optional)
  ↓
Tesseract.js OCR extracts fields (client-side)
  ↓
User submits expense form
  ↓
POST /api/expenses (creates Expense record with approvalRules)
  ↓
AppContext refreshes, expense appears in list
```

### 3. **Approval Flow**
```
Manager/Admin sees pending expense
  ↓
Clicks Approve/Reject
  ↓
PATCH /api/expenses/[id] (creates Approval record)
  ↓
Server calls evaluateApprovalRules() to check if conditions met
  ↓
If conditions met, updates Expense.status
  ↓
Returns updated expense with all approvals
  ↓
UI reflects new status
```

**Approval Rule Evaluation** (`src/lib/approval-utils.ts`):
- **Percentage**: Count approved vs. eligible approvers (admins/managers)
- **Specific Approver**: Check if all required user IDs have approved
- **Hybrid**: Both percentage AND specific approvers must be satisfied
- **Rejection**: Any rejection immediately sets status to 'rejected'

### 4. **Currency Conversion Flow**
```
User's company has base currency (e.g., USD)
  ↓
Expense created in different currency (e.g., EUR)
  ↓
Dashboard/List calls internal /api/exchange proxy
  ↓
Server proxy fetches ExchangeRate-API with EXCHANGE_API key
  ↓
Converts amounts: amount * rate[targetCurrency]
  ↓
Displays: "$108.50 (EUR)" - showing company currency + original
  ↓
Analytics/charts aggregate in company currency
```

---

## Security & RBAC

### Role-Based Access Control

**Roles:**
- **Employee**: Create expenses, view own expenses
- **Manager**: Approve/reject expenses, view all company expenses
- **Admin**: Full access (manage users, settings, approvals)

**Enforcement:**

1. **Client-side** (`RoleGuard` component):
   - Hides UI elements based on `currentUser.role`
   - Example: Approvals page wrapped with `<RoleGuard allowedRoles={['admin', 'manager']}>`

2. **Server-side** (API routes):
   - Check `approverId` role before recording approval
   - Verify user belongs to same company for data access
   - Example:
   ```typescript
   const approver = await prisma.user.findUnique({ where: { id: approverId } });
   if (approver.role !== 'admin' && approver.role !== 'manager') {
     return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
   }
   ```

### Password Security
- Passwords hashed with bcrypt (10 rounds)
- Stored in `User.password` field
- Never returned in API responses (excluded in queries)

### Password Reset Emails
- Route: `POST /api/users/:id/send-password`
- Generates a secure, random temporary password, re-hashes it with bcrypt, and updates the user record
- Tries to deliver the password via Nodemailer using optional SMTP environment variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `SMTP_FROM`)
- If SMTP is not configured, logs the generated password server-side as a fallback for manual distribution during development

### Forgot Password Flow
1. **Request Reset** (`POST /api/auth/forgot-password`):
   - User submits email address
   - System generates secure random token (32 bytes, hashed with SHA-256)
   - Token stored in `password_reset_tokens` table with 1-hour expiration
   - Reset link sent via email to user
   
2. **Verify Token** (`GET /api/auth/reset-password?token=xxx`):
   - Validates token exists, hasn't expired, and hasn't been used
   - Returns token validity status
   
3. **Reset Password** (`POST /api/auth/reset-password`):
   - Validates token and new password (min 8 characters)
   - Hashes new password with bcrypt
   - Updates user password and marks token as used
   - User can then log in with new password

**Security Features:**
- Tokens are hashed before storage (SHA-256)
- Tokens expire after 1 hour
- Tokens are single-use (marked as used after successful reset)
- Email enumeration protection (always returns success message)
- Old tokens are deleted when new reset is requested

---

## External API Integration

### Rest Countries API
**URL**: `https://restcountries.com/v3.1/all?fields=name,currencies`

**Usage:**
- Signup form: Fetch countries and their currencies
- Graceful fallback to USD if API unavailable
- Cached in memory for session lifetime

### ExchangeRate-API
**Primary Endpoint**: Internal proxy `/api/exchange?base=USD`

**Upstream URL**: `https://v6.exchangerate-api.com/v6/{EXCHANGE_API}/latest/{BASE}` with automatic fallback to `https://api.exchangerate-api.com/v4/latest/{BASE}` when the key is missing/unavailable.

**Usage:**
- Fetch live exchange rates for expense display via the proxy
- Convert expense amounts to company currency
- Proxy caches results for 15 minutes per base currency on the client; upstream fetch uses Next.js revalidation
- Graceful fallback to identity rate (1:1) if API or proxy unavailable

---

## Development Workflow

### Setup

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL and NEXTAUTH_SECRET

# Generate Prisma client
npx prisma generate --no-engine

# Run migrations
npx prisma migrate dev --name init

# Seed database
npm run prisma:seed

# Start dev server
npm run dev
```

### Database Commands

```bash
# Create new migration
npx prisma migrate dev --name <migration-name>

# Reset database (caution!)
npx prisma migrate reset

# Open Prisma Studio (GUI)
npx prisma studio

# Seed database
npm run prisma:seed
```

### Production Build

```bash
npm run build
npm start
```

---

## File Structure (Key Files)

```
/workspaces/new_backdoor_pathway/
├── prisma/
│   ├── schema.prisma              # Database schema
│   ├── seed.ts                     # Seed script
│   └── migrations/                 # Migration history
├── src/
│   ├── app/
│   │   ├── api/                    # API routes (all use Prisma)
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── users/route.ts
│   │   │   ├── expenses/route.ts
│   │   │   ├── companies/route.ts
│   │   │   └── signup/route.ts
│   │   ├── dashboard/              # Dashboard pages
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── components/
│   │   ├── auth/                   # Auth forms, RoleGuard
│   │   ├── expenses/               # Expense components
│   │   └── layout/                 # Header, Sidebar
│   ├── context/
│   │   └── app-context.tsx         # Global state (fetches from API)
│   ├── lib/
│   │   ├── db.ts                   # Prisma client singleton
│   │   ├── definitions.ts          # TypeScript types
│   │   ├── approval-utils.ts       # Approval logic
│   │   ├── currency.ts             # Currency conversion utils
│   │   └── ocr-tesseract.ts        # OCR utilities
│   └── hooks/
│       └── use-currency.ts         # Exchange rate hook
├── .env                            # Environment variables
├── package.json
└── README.md
```

---

## Key Design Decisions

### 1. **Why Prisma Accelerate?**
- Edge-compatible (serverless functions)
- Connection pooling (prevents exhausting DB connections)
- Global caching layer
- Type-safe queries

### 2. **Why JWT over Database Sessions?**
- Required for Credentials provider
- Faster (no DB lookup per request)
- Stateless (scales horizontally)
- Session data encrypted in token

### 3. **Why JSON for Approval Rules?**
- Flexible rule definitions without schema changes
- Easy to extend with new rule types
- Prisma's Json type provides type safety

### 4. **Why Client-Side OCR?**
- No server upload needed
- Works offline
- Instant feedback
- Lower server costs

---

## Testing Credentials (from seed)

After running `npm run prisma:seed`:

```
admin@expenseasy.com / password (role: admin)
manager@expenseasy.com / password (role: manager)
employee@expenseasy.com / password (role: employee)
cfo@expenseasy.com / password (role: manager)
```

Company: Innovate Inc. (USD)

---

## Deployment Checklist

- [ ] Set production `DATABASE_URL` (Prisma Accelerate)
- [ ] Generate strong `NEXTAUTH_SECRET` (32+ chars)
- [ ] Set `NEXTAUTH_URL` to production domain
- [ ] Run `npx prisma generate --no-engine`
- [ ] Run `npx prisma migrate deploy`
- [ ] Build: `npm run build`
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS if needed
- [ ] Enable HTTPS
- [ ] Set up database backups

---

## Troubleshooting

### "NO_SECRET" Error
**Cause**: Missing `NEXTAUTH_SECRET` in production
**Fix**: Add to `.env` or environment variables

### "CALLBACK_CREDENTIALS_JWT_ERROR"
**Cause**: Using database sessions with Credentials provider
**Fix**: Ensure `session: { strategy: 'jwt' }` in NextAuth config

### Currency Conversion Shows Same Value
**Cause**: ExchangeRate-API rate fetch failed or is cached
**Fix**: Check network, wait for cache expiry (15 min), or clear/restart

### Expense Approval Not Updating Status
**Cause**: Approval rules not met or evaluateApprovalRules() logic issue
**Fix**: Check console logs, verify rule thresholds, ensure eligible approvers exist

---

## Future Enhancements

- [ ] Add file upload for receipt images (S3/CloudFlare R2)
- [ ] Implement real-time notifications (Pusher/Socket.io)
- [ ] Add expense categories management UI
- [ ] Multi-currency company support
- [ ] Export expenses to CSV/PDF
- [ ] Audit log for all approval actions
- [x] Web push notifications for approvals
- [ ] Mobile app (React Native)
- [ ] GraphQL API option
- [ ] Advanced analytics dashboard

---

## Support & Documentation

- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **NextAuth Docs**: https://next-auth.js.org
- **Prisma Accelerate**: https://www.prisma.io/docs/accelerate

---

**Last Updated**: October 4, 2025
**Version**: 1.0.0
