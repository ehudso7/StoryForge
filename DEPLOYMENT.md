# StoryForge - Vercel Deployment Guide

Complete guide for deploying StoryForge to production on Vercel with full functionality.

## 🎯 Prerequisites

Before deploying, ensure you have:

1. **Vercel Account** - [Sign up](https://vercel.com/signup)
2. **Neon PostgreSQL Database** - [Create database](https://neon.tech)
3. **OpenAI API Key** - [Get key](https://platform.openai.com/api-keys)
4. **Stripe Account** - [Sign up](https://dashboard.stripe.com/register)
5. **Google OAuth Credentials** - [Google Cloud Console](https://console.cloud.google.com/)
6. **GitHub OAuth App** - [GitHub Settings](https://github.com/settings/developers)

---

## 📦 Step 1: Database Setup (Neon)

### Create Neon Database

1. Go to [Neon Console](https://console.neon.tech)
2. Click "Create a project"
3. Name it `storyforge-production`
4. Select region closest to your users
5. Copy the connection string

### Initialize Database Schema

```bash
# Set DATABASE_URL locally
export DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Verify tables created
npx prisma studio
```

Expected tables:
- User, Account, Session, VerificationToken (NextAuth)
- Project, Scene, Character, WorldBuilding, Export (StoryForge)

---

## 🔐 Step 2: Authentication Setup

### Google OAuth

1. **Google Cloud Console** → [Credentials](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID
3. Application type: Web application
4. Authorized JavaScript origins:
   ```
   http://localhost:3000
   https://your-domain.vercel.app
   ```
5. Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-domain.vercel.app/api/auth/callback/google
   ```
6. Copy **Client ID** and **Client Secret**

### GitHub OAuth

1. **GitHub** → Settings → Developer settings → [OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Application name: `StoryForge`
4. Homepage URL: `https://your-domain.vercel.app`
5. Authorization callback URL:
   ```
   https://your-domain.vercel.app/api/auth/callback/github
   ```
6. Copy **Client ID** and **Client Secret**

### Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Copy the output for `NEXTAUTH_SECRET`.

---

## 💳 Step 3: Stripe Setup

### Create Products

1. **Stripe Dashboard** → [Products](https://dashboard.stripe.com/products)
2. Create three products:

**Hobby Tier**
- Name: `StoryForge Hobby`
- Price: `$9.99/month`
- Recurring: Monthly
- Copy the **Price ID** (starts with `price_`)

**Professional Tier**
- Name: `StoryForge Professional`
- Price: `$49.99/month`
- Recurring: Monthly
- Copy the **Price ID**

**Enterprise Tier**
- Name: `StoryForge Enterprise`
- Price: `$149.99/month`
- Recurring: Monthly
- Copy the **Price ID**

### Set Up Webhooks

1. **Stripe Dashboard** → Developers → [Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Endpoint URL: `https://your-domain.vercel.app/api/webhooks/stripe`
4. Listen to events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
5. Copy the **Webhook Signing Secret** (starts with `whsec_`)

### Get API Keys

1. **Stripe Dashboard** → Developers → [API Keys](https://dashboard.stripe.com/apikeys)
2. Copy:
   - **Secret key** (starts with `sk_live_` or `sk_test_`)
   - **Publishable key** (starts with `pk_live_` or `pk_test_`)

---

## 🤖 Step 4: OpenAI Setup

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Navigate to [API Keys](https://platform.openai.com/api-keys)
3. Click "Create new secret key"
4. Name it `StoryForge Production`
5. Copy the key (starts with `sk-`)

**Important:** Set usage limits to prevent unexpected charges.

---

## 🚀 Step 5: Deploy to Vercel

### Method 1: Deploy from GitHub

1. **Push code to GitHub** (already done ✅)
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New..." → "Project"
4. Import your repository: `ehudso7/StoryForge`
5. Configure project:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Method 2: Deploy from CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

---

## ⚙️ Step 6: Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables

Add the following variables for **Production**:

### Database
```
DATABASE_URL = postgresql://user:password@host/database?sslmode=require
```

### NextAuth
```
NEXTAUTH_URL = https://your-domain.vercel.app
NEXTAUTH_SECRET = your-generated-secret-from-step-2
```

### Google OAuth
```
GOOGLE_CLIENT_ID = your-google-client-id
GOOGLE_CLIENT_SECRET = your-google-client-secret
```

### GitHub OAuth
```
GITHUB_ID = your-github-client-id
GITHUB_SECRET = your-github-client-secret
```

### OpenAI
```
OPENAI_API_KEY = sk-your-openai-api-key
```

### Stripe
```
STRIPE_SECRET_KEY = sk_live_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY = pk_live_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET = whsec_your-webhook-secret
STRIPE_HOBBY_PRICE_ID = price_hobby_id
STRIPE_PROFESSIONAL_PRICE_ID = price_professional_id
STRIPE_ENTERPRISE_PRICE_ID = price_enterprise_id
```

### Application
```
NODE_ENV = production
NEXT_PUBLIC_APP_URL = https://your-domain.vercel.app
```

**Important:** After adding variables, click "Redeploy" to apply changes.

---

## 🔄 Step 7: Post-Deployment Configuration

### Update Stripe Webhook

1. Go back to Stripe Webhooks
2. Update endpoint URL to your actual Vercel domain:
   ```
   https://your-actual-domain.vercel.app/api/webhooks/stripe
   ```
3. Test webhook delivery

### Update OAuth Redirect URIs

**Google:**
- Update redirect URI to: `https://your-actual-domain.vercel.app/api/auth/callback/google`

**GitHub:**
- Update callback URL to: `https://your-actual-domain.vercel.app/api/auth/callback/github`

### Verify Database Connection

```bash
# Run from local with production DATABASE_URL
npx prisma studio
```

Verify all tables exist and are accessible.

---

## ✅ Step 8: Testing & Verification

### Test Authentication
1. Visit `https://your-domain.vercel.app`
2. Click "Sign In"
3. Test Google OAuth
4. Test GitHub OAuth
5. Verify user creation in database

### Test Excellence Engine
1. Navigate to `/test-excellence`
2. Enter sample text
3. Click "Evaluate"
4. Verify metrics display correctly

### Test Project Creation
1. Sign in
2. Go to Dashboard
3. Click "New Project"
4. Fill in details
5. Create project
6. Verify project appears in database

### Test Scene Generation
1. Open a project
2. Click "Generate Scene"
3. Select "Mechanical Writer" (doesn't use OpenAI credits)
4. Verify scene generates with 90%+ score

### Test Subscription Flow
1. Click "Upgrade" or go to `/pricing`
2. Select a tier
3. Complete Stripe checkout (use test card: `4242 4242 4242 4242`)
4. Verify subscription status updates
5. Check webhook logs in Stripe

### Test Export
1. Create a project with scenes
2. Navigate to Export tab
3. Generate TXT export
4. Verify download works

---

## 🔒 Step 9: Security Checklist

- ✅ All environment variables set in Vercel (not in code)
- ✅ `.env` files in `.gitignore`
- ✅ Stripe webhook secret verified
- ✅ NextAuth secret is random and secure
- ✅ Database connection uses SSL (`?sslmode=require`)
- ✅ OAuth redirect URIs match production domain
- ✅ API rate limiting configured
- ✅ Security headers enabled (check `next.config.mjs`)

---

## 🚨 Troubleshooting

### Build Fails

```bash
# Check build logs in Vercel
# Common issues:
# 1. Missing environment variables
# 2. TypeScript errors
# 3. Dependency issues

# Test build locally
npm run build
```

### Database Connection Errors

```bash
# Verify connection string format
# Should include ?sslmode=require for Neon

# Test connection
npx prisma db push
```

### Authentication Fails

```
# Check:
1. NEXTAUTH_URL matches deployment URL
2. OAuth redirect URIs are correct
3. NEXTAUTH_SECRET is set
4. No trailing slashes in URLs
```

### Stripe Webhooks Not Working

```
# Verify:
1. Webhook endpoint URL is correct
2. Webhook secret matches
3. Events are selected
4. Check Vercel function logs
```

### OpenAI API Errors

```
# Check:
1. API key is valid
2. Billing is set up on OpenAI account
3. Usage limits not exceeded
4. Rate limiting configured
```

---

## 📊 Monitoring & Maintenance

### Vercel Analytics

Enable analytics in Vercel Dashboard:
1. Project Settings → Analytics
2. Enable Web Analytics
3. Monitor performance metrics

### Error Tracking

Consider integrating:
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **PostHog** - Product analytics

### Database Monitoring

Neon provides:
- Connection pooling metrics
- Query performance insights
- Storage usage tracking

### Stripe Monitoring

Check regularly:
- Webhook delivery success rate
- Failed payment recovery
- Subscription churn metrics

---

## 🎉 Launch Checklist

Pre-launch:
- [ ] All environment variables configured
- [ ] Database schema deployed
- [ ] OAuth providers tested
- [ ] Stripe webhooks working
- [ ] OpenAI API key tested
- [ ] Security audit completed
- [ ] Performance optimization done
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing passed
- [ ] Error handling tested
- [ ] Backup strategy in place

Post-launch:
- [ ] Monitor error logs
- [ ] Check webhook delivery
- [ ] Verify user signups work
- [ ] Test payment flow
- [ ] Monitor API usage
- [ ] Set up alerts
- [ ] Update documentation
- [ ] Announce launch 🚀

---

## 🆘 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Stripe Docs**: https://stripe.com/docs
- **OpenAI Docs**: https://platform.openai.com/docs

---

## 🔄 Continuous Deployment

Every push to `main` branch automatically deploys to production.

### Preview Deployments

Every pull request gets a preview URL for testing.

### Rollback

In Vercel Dashboard:
1. Go to Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

---

## 🎯 Performance Optimization

### Vercel Edge Network

Your app is automatically deployed to global edge network.

### Image Optimization

Next.js automatically optimizes images. Ensure you use:
```tsx
import Image from 'next/image'
```

### API Route Optimization

- Implement caching where appropriate
- Use edge runtime for faster response times
- Monitor function execution times

---

**Congratulations! StoryForge is now live on Vercel! 🎉**

Your production URL: `https://your-domain.vercel.app`

Questions? Check the [README.md](./README.md) or open an issue.
