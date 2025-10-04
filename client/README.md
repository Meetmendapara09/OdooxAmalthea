# 💰 Expenseasy

Expenseasy is a modern expense management application built with Next.js 15, PostgreSQL (via Prisma ORM), and Tailwind CSS.

It simplifies expense tracking, introduces role-based approvals, and includes client-side OCR for receipts—all in one streamlined platform.

📚 **See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete technical documentation.**

## ✨ Features

- 📝 Expense creation & listing
- 👥 Role-based access (Admin / Manager / Employee)
- ✅ Conditional approvals (percentage, specific approver, hybrid)
- 🧾 Receipt OCR (Tesseract.js) – auto-fills amount, date, vendor, expense type
- 🔐 Authentication with NextAuth (JWT)
- 💱 Real-time currency conversion

  
## 🚀 Getting started

1. Install dependencies
	npm install

2. Start dev server
	npm run dev

## 🗄️ Database: PostgreSQL (Local setup)

We use PostgreSQL via Prisma.

1. Start Postgres locally (Docker)

	docker compose up -d db

2. Create .env with connection string

	DATABASE_URL="postgresql://postgres:postgres@localhost:5432/expenseasy?schema=public"

3. Generate client and run migrations

	npx prisma generate
	npx prisma migrate dev --name init

4. Seed data

	npm run prisma:seed

⚠️ Troubleshooting:
- If ts-node isn’t installed, add it as a dev dependency or compile the seed to JS.
- Alternatively, run: npx ts-node prisma/seed.ts

## 🔑 RBAC

Roles supported: admin, manager, employee.
- Sidebar items are role-filtered
- Approvals page is protected with a RoleGuard allowing admin/manager
- Approval actions also check the current role and prevent employee actions

## 🔍 OCR languages

OCR runs in the browser using Tesseract.js.
- Default languages: English + Hindi (eng+hin)
- You can pass opts.lang to ocrReceiptClient to override (e.g., 'eng' or 'eng+hin+spa')


3. Open the app

	http://localhost:3000 (or the port shown in the terminal)

## 🧾 OCR: Receipt Scanning (Tesseract.js)

We use Tesseract.js directly in the browser to extract text from uploaded receipt images and then parse fields:

- amount (best-effort numeric parsing)
- date (normalized to YYYY-MM-DD)
- description (vendor or a short line)
- expenseType (heuristic mapping to one of: Meals & Entertainment, Travel, Software, Office Supplies, Other)

Where it's wired:
- Client utility: `src/lib/ocr-tesseract.ts` (exports `ocrReceiptClient(dataUri)`)
- Used in: `src/components/expenses/expense-form.tsx` on file upload

No server key or model setup is required for Tesseract.js. For better accuracy you can:
- Use clearer images with good contrast
- Crop the image to the receipt area before upload
- Switch to additional languages by passing `{ lang: 'eng+spa' }` to `ocrReceiptClient`

⚠️ Troubleshooting:
- If OCR is slow, it’s running fully client-side in the browser. Consider resizing images before upload.
- If fields are not detected correctly, you can still manually edit the prefilled form fields.

## 🔐 Authentication and Signup

We use NextAuth with the Prisma Adapter and the Credentials provider.

- Local dev usually works without extra env, but for production you must set:
	- NEXTAUTH_URL="http://localhost:3000"
	- NEXTAUTH_SECRET="some-strong-random-string"

👤 Signup flow:
- Visit /signup
- Enter company details and your admin user details
- We’ll create the company (and currency if it doesn’t exist), create your admin user, then log you in automatically.

👥 Seeded users (if you ran the seed script):
- admin@expenseasy.com / password
- manager@expenseasy.com / password
- employee@expenseasy.com / password

Note: If you seeded earlier, you may need to re-seed to get passwords set.

## ⚡ Prisma Accelerate

This project is configured to use Prisma Accelerate via the DATABASE_URL using the prisma+postgres protocol.

- The `.env` contains a `DATABASE_URL` that begins with `prisma+postgres://...` which routes all Prisma Client queries through Accelerate.
- Because Accelerate is handled by the connection string, no additional code changes are required. We instantiate a normal `PrismaClient()` in `src/lib/db.ts`, and all CRUD operations will go through Accelerate automatically.

## 🌍 Deployment

This project is ready for deployment on Vercel at: **https://new-backdoor-pathway.vercel.app**

📚 **See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions and Vercel configuration.**

### Quick Deploy to Vercel

1. Push repo → GitHub
2. Import project in Vercel
3. Add env vars (DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, etc.)
4. Deploy 🎉

### 🔧 Environment Variables for Production

Set these in your Vercel project settings:
- `DATABASE_URL` - Your Prisma Accelerate connection string
- `NEXTAUTH_URL` - Your production URL (https://new-backdoor-pathway.vercel.app)
- `NEXTAUTH_SECRET` - Secure random string for JWT signing
- `CLIENT_ID` - Your application client ID
- `CLIENT_SECRET` - Your application client secret
- `NEXT_PUBLIC_WEB_URL` - Public-facing URL for the app

