# Vercel Deployment Configuration

## Environment Variables for Vercel

Set these in your Vercel project settings (Settings → Environment Variables):

### Required Variables

```bash
# Database (Prisma Accelerate)
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"

# NextAuth Configuration
NEXTAUTH_URL="https://new-backdoor-pathway.vercel.app"
NEXTAUTH_SECRET="CzfwsWfiv3dT2Ez2N2fcZ2wEds/ErkHjO9Wdv2DjHT8="

# Application Configuration
CLIENT_ID="cmgbxet5n00yf17fhetpt2p04"
CLIENT_SECRET="PMKJvVqrAsx_FcqFWe5Ms_TPYFpUS64k0KM2-cXS8rM"
NEXT_PUBLIC_WEB_URL="https://new-backdoor-pathway.vercel.app"
```

## Deployment Steps

### 1. Initial Setup

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link
```

### 2. Configure Environment Variables

Go to your Vercel dashboard:
1. Navigate to your project
2. Go to Settings → Environment Variables
3. Add each variable above for Production, Preview, and Development
4. Click "Save"

### 3. Deploy

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Build Settings in Vercel Dashboard

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

## Post-Deployment

### 1. Run Database Migrations

After first deployment, run migrations via Vercel CLI:

```bash
# In your local terminal
vercel env pull .env.production
npx prisma migrate deploy
```

Or set up a GitHub Action to run migrations on deploy.

### 2. Seed Database (Optional)

If you want to seed the production database:

```bash
# Caution: This will add test data to production
npm run prisma:seed
```

### 3. Test Authentication

1. Visit https://new-backdoor-pathway.vercel.app/signup
2. Create a test company and admin user
3. Login and verify dashboard loads

## Troubleshooting

### "NO_SECRET" Error
- Ensure `NEXTAUTH_SECRET` is set in Vercel environment variables
- Redeploy after adding the variable

### "Database Connection Failed"
- Verify `DATABASE_URL` is correct in Vercel
- Check Prisma Accelerate API key is valid
- Ensure Prisma client is generated with `--no-engine` flag

### NextAuth Callback URL Mismatch
- Ensure `NEXTAUTH_URL` matches your production domain exactly
- No trailing slash in the URL

### CORS Issues
- Add your Vercel domain to any external API allowlists
- Check that `NEXT_PUBLIC_WEB_URL` is set correctly

## Continuous Deployment

### GitHub Integration (Recommended)

1. Connect your GitHub repository to Vercel
2. Every push to `main` branch will deploy to production
3. Every PR will create a preview deployment

### Environment Variables by Branch

- **Production** (main branch): Use production credentials
- **Preview** (PRs): Can use same as production or separate staging DB
- **Development**: Use `.env.local` for local dev

## Performance Optimization

### Enable Prisma Accelerate Features

In your Vercel project:
1. Prisma Accelerate is already configured via `DATABASE_URL`
2. Connection pooling is automatic
3. Query caching is enabled for eligible queries

### Edge Runtime (Optional)

To use Edge Runtime for faster cold starts:

```typescript
// In your API route
export const runtime = 'edge';
```

⚠️ Note: Some Prisma features may not work on Edge Runtime. Test thoroughly.

## Monitoring

### Vercel Analytics

Enable in dashboard:
- Settings → Analytics → Enable

### Error Tracking

Consider adding:
- Sentry: `npm i @sentry/nextjs`
- LogRocket: `npm i logrocket`

## Security Checklist

- ✅ `NEXTAUTH_SECRET` is strong and unique
- ✅ `CLIENT_SECRET` is kept private
- ✅ Database credentials are not in git
- ✅ HTTPS is enforced (Vercel does this by default)
- ✅ Environment variables are environment-specific

## Rollback

If a deployment breaks:

```bash
# Via Vercel dashboard
# Go to Deployments → Find working version → Promote to Production

# Or via CLI
vercel rollback
```

## Custom Domain (Optional)

1. Go to Settings → Domains
2. Add your custom domain
3. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_WEB_URL` to match
4. Redeploy

---

**Deployed URL**: https://new-backdoor-pathway.vercel.app
**Last Updated**: October 4, 2025
