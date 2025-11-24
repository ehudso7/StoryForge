# StoryForge 📚✨

**AI-Powered Professional Book Writing Platform**

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/storyforge)

Transform anyone into a professional fiction author with enterprise-grade tools that generate publication-quality novels with human-like prose, proper story structure, and genre-aware excellence.

## 🎯 Overview

StoryForge revolutionizes AI-assisted storytelling through a sophisticated **dual-engine approach**:

1. **AI-Powered Generation** - OpenAI GPT-4o with strict quality controls
2. **Mechanical Writer** - Template-based system guaranteeing 90%+ scores

### Core Differentiators

- ✅ **90%+ Quality Guarantee** - Enforced through multiple validation layers
- ✅ **Zero AI Language Policy** - 134 forbidden patterns actively blocked
- ✅ **U-WQES v2.0 Scoring** - Universal Writing & Quality Enforcement Standard
- ✅ **Professional Structure** - 3-act format with 100k-130k word targets
- ✅ **Mobile-First PWA** - Native app experience on any device
- ✅ **Subscription Monetization** - Three-tier system with Stripe

## 🚀 Features

### Writing Excellence Engine

- **9 Core Metrics**
  - Glue Words (< 40%)
  - Passive Voice (< 5%)
  - Dialogue Balance (30-50%)
  - Show vs Tell (< 10%)
  - Word Repetition (< 2%)
  - Dynamic Content (> 70%)
  - Reflective Content (~30%)
  - AI Pattern Detection (Zero tolerance)
  - Coherence Validation

- **8 Improvement Strategies**
  - AI Pattern Eliminator
  - Show vs Tell Converter
  - Dialogue Fixer
  - Glue Word Reducer
  - Dynamic Content Booster
  - Passive Voice Eliminator
  - Sentence Variation Enhancer
  - Sensory Detail Enhancer

### Content Generation

- **AI Generation** - GPT-4o powered scenes and chapters
- **Mechanical Writer** - Template-based content with guaranteed scores
- **Iterative Improvement** - Up to 15 cycles with metric locking
- **Genre Templates** - Thriller, Fantasy, Romance, Sci-Fi, Mystery

### Project Management

- **Project Dashboard** - Track multiple books simultaneously
- **Scene-by-Scene Editing** - Real-time quality scoring
- **Character Builder** - Develop protagonists, antagonists, supporting cast
- **World Building** - Create settings, cultures, magic systems
- **Version History** - Track all revisions and improvements

### Export System

- **TXT** - Clean plain text with formatting
- **PDF** - Professional layout with jsPDF
- **EPUB** - E-book format with proper structure

### Subscription Tiers

| Feature | Hobby ($9.99/mo) | Professional ($49.99/mo) | Enterprise ($149.99/mo) |
|---------|------------------|--------------------------|-------------------------|
| Projects | 3 max | Unlimited | Unlimited |
| Tokens/Month | 25,000 | 150,000 | 500,000 |
| Exports | TXT | TXT + PDF | TXT + PDF + EPUB |
| Generation Cooldown | 10s | 3s | 1s |
| Support | Community | Priority | Dedicated |

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.6
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: TanStack Query (React Query v5)
- **Forms**: React Hook Form + Zod
- **Auth**: NextAuth.js with Google & GitHub
- **Theme**: next-themes (dark/light)
- **PWA**: next-pwa

### Backend
- **Runtime**: Node.js 18+ with Next.js API Routes
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **AI**: OpenAI GPT-4o
- **Payments**: Stripe
- **Validation**: Zod schemas

### Infrastructure
- **Hosting**: Vercel
- **Database**: Neon PostgreSQL (serverless)
- **CDN**: Vercel Edge Network
- **Analytics**: Vercel Analytics (optional)

## 📦 Installation

### Prerequisites

- Node.js 18.17.0 or higher
- PostgreSQL database (Neon recommended)
- OpenAI API key
- Stripe account
- Google OAuth credentials
- GitHub OAuth credentials

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/storyforge.git
   cd storyforge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your credentials:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"

   # OAuth Providers
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   GITHUB_ID="your-github-client-id"
   GITHUB_SECRET="your-github-client-secret"

   # OpenAI
   OPENAI_API_KEY="sk-your-openai-api-key"

   # Stripe
   STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
   STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
   STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
   STRIPE_HOBBY_PRICE_ID="price_hobby"
   STRIPE_PROFESSIONAL_PRICE_ID="price_professional"
   STRIPE_ENTERPRISE_PRICE_ID="price_enterprise"

   # App
   NODE_ENV="development"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Create exports directory**
   ```bash
   mkdir -p public/exports
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🔐 Authentication Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google`

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Add Authorization callback URL:
   - `http://localhost:3000/api/auth/callback/github`
   - `https://yourdomain.com/api/auth/callback/github`

## 💳 Stripe Setup

### Create Products and Prices

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create three products:
   - **Hobby** - $9.99/month
   - **Professional** - $49.99/month
   - **Enterprise** - $149.99/month
3. Copy the Price IDs to your `.env` file

### Set up Webhooks

1. In Stripe Dashboard, go to Developers > Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret to `.env`

## 🚀 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/storyforge)

1. **Connect your repository**
   - Import your Git repository to Vercel

2. **Configure environment variables**
   - Add all variables from `.env.example` in Vercel dashboard

3. **Deploy**
   ```bash
   npm run build
   vercel --prod
   ```

4. **Set up database connection**
   - Ensure DATABASE_URL points to your Neon database
   - Run migrations: `npx prisma db push`

5. **Configure Stripe webhook**
   - Update webhook URL to production domain
   - Update STRIPE_WEBHOOK_SECRET

## 📖 Usage

### Creating a Project

1. Sign in with Google or GitHub
2. Navigate to Dashboard
3. Click "New Project"
4. Fill in:
   - Title
   - Genre (Thriller, Fantasy, Romance, Sci-Fi, Mystery)
   - Synopsis
   - Target word count (100k-130k)

### Writing with AI

1. Open your project
2. Click "Generate Scene"
3. Provide context:
   - Previous scene summary
   - Characters involved
   - Desired conflict/action
4. Choose generation method:
   - **AI Generation** - Creative, context-aware
   - **Mechanical Writer** - Guaranteed 90%+ score

### Improving Content

1. Open scene in editor
2. View quality metrics
3. Click "Enhance Scene"
4. System applies targeted improvements
5. Review before/after comparison

### Iterative Refinement

1. Select scene
2. Click "Run Iteration Cycle"
3. Configure:
   - Fixed iterations (1-15)
   - Or run until 90%+ achieved
4. Review improvement history
5. Best version auto-saved

### Exporting

1. Complete all scenes/chapters
2. Navigate to Export tab
3. Select format (TXT/PDF/EPUB based on tier)
4. Download professional manuscript

## 🧪 Testing the Excellence Engine

Visit `/test-excellence` to:
- Test draft evaluation
- Try improvement strategies
- Compare before/after metrics
- Understand scoring system

## 📊 Metrics Explained

### Glue Words (< 40%)
Weak, filler words like "the", "was", "that". Lower is better.

### Passive Voice (< 5%)
Sentences with "was", "were" + past participle. Prefer active voice.

### Dialogue Balance (30-50%)
Percentage of text in quotes. Too little = no character voice. Too much = talking heads.

### Show vs Tell (< 10%)
Using "felt", "thought", "seemed" = telling. Show through action and dialogue.

### Dynamic Content (> 70%)
Action, conflict, tension-driven scenes vs. introspective passages.

### AI Patterns (0 tolerance)
134 forbidden phrases that flag AI-generated content.

## 🔒 Security

- ✅ NextAuth.js session management
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection (input sanitization)
- ✅ CSRF tokens
- ✅ Rate limiting
- ✅ Secure headers (Helmet.js patterns)
- ✅ Stripe webhook signature verification
- ✅ Environment variable protection

## 🎨 Customization

### Adding New Genres

Edit `/services/mechanical-writer.ts`:
```typescript
GENRE_TEMPLATES: {
  'your-genre': {
    patterns: [...],
    wordBanks: {...},
    dialogueRatio: 35,
    fragmentRatio: 10,
    dynamicRatio: 80,
  }
}
```

### Modifying Scoring

Edit `/services/draft-evaluator.ts`:
```typescript
// Adjust weights in calculateScoreBreakdown()
glueWordsScore * 0.15  // 15% weight
showVsTellScore * 0.25  // 25% weight
dynamicContentScore * 0.25  // 25% weight
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

## 🙏 Acknowledgments

- OpenAI for GPT-4o
- Vercel for hosting platform
- shadcn for UI components
- Stripe for payment processing
- Neon for serverless PostgreSQL

## 📞 Support

- **Documentation**: [https://docs.storyforge.ai](https://docs.storyforge.ai)
- **Email**: support@storyforge.ai
- **Discord**: [Join our community](https://discord.gg/storyforge)
- **GitHub Issues**: [Report bugs](https://github.com/yourusername/storyforge/issues)

## 🗺️ Roadmap

- [ ] Collaborative editing
- [ ] Version branching
- [ ] Cover designer
- [ ] Publishing platform integration
- [ ] Mobile native apps (iOS/Android)
- [ ] AI voice narration
- [ ] Multi-language support
- [ ] Advanced analytics dashboard

---

**Built with ❤️ for writers by writers**

Transform your storytelling. Start writing today.

[Get Started](https://storyforge.ai) • [Documentation](https://docs.storyforge.ai) • [Community](https://discord.gg/storyforge)
