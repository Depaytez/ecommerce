# JRADIANCE E-Commerce - Technical Documentation Suite

Welcome to the central documentation hub for the **JRADIANCE Luxury E-Commerce Platform**.

---

## 📚 Master Index

| Document | Description | Target Audience |
|---|---|---|
| [**System Architecture**](./SYSTEM_ARCHITECTURE.md) | Domain-Driven Design (DDD) Bounded Contexts, Layered Architecture, and Concurrency Controls | Architects & Engineers |
| [**Code Documentation**](./CODE_DOCUMENTATION.md) | In-depth TypeScript domain models, repositories, services, and client contexts | Developers |
| [**Payment Gateway Engine**](./PAYMENT_GATEWAY_ARCHITECTURE.md) | Dual-Gateway Architecture (Stripe + Paystack), Geolocation Routing, and Idempotent Webhooks | Backend & Integration Engineers |
| [**Production Runbook**](./PRODUCTION_RUNBOOK.md) | Environment configuration, Live Webhook Setup, Database Migrations, and Deployment Verification | DevOps & Release Engineers |
| [**Product Requirements (PRD)**](./PRODUCT_REQUIREMENTS.md) | Feature matrix, business rules, multi-currency support, and role hierarchies | Product Managers & QA |
| [**Engineering Standards**](./AGENT-STANDARDS.md) | Code quality, zero-secret policy, testing protocol, and branching workflow | All Contributors |
| [**Agent Directive**](./PROMPT.md) | Autonomous pair-programming directives and audit specifications | AI Agents & Maintainers |

---

## ⚙️ Quick Developer Setup & Webhook Configuration

### 1. Environment Secrets Setup
Copy the template to your local environment:
```powershell
cp .env.example .env.local
```
Fill in valid credentials for:
- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Stripe**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Paystack**: `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY`, `PAYSTACK_WEBHOOK_SECRET`

### 2. Local Webhook Forwarding
For webhooks to reach your local Next.js dev server (`http://localhost:3000`):

#### A. Stripe Webhooks (via Stripe CLI)
```powershell
# In a separate terminal:
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
Copy the webhook signing secret output (`whsec_...`) into your `.env.local` as `STRIPE_WEBHOOK_SECRET`.

#### B. Paystack Webhooks (via ngrok)
```powershell
# Expose local port 3000:
ngrok http 3000
```
In your [Paystack Developer Dashboard](https://dashboard.paystack.com/#/settings/developer), enter:
`https://<your-ngrok-subdomain>.ngrok-free.app/api/webhooks/paystack`

---

## 🚀 Production Deployment Checklist

Before going live:
1. Ensure `NODE_ENV=production` is set in your hosting platform.
2. Configure live webhook URLs:
   - Stripe: `https://yourdomain.com/api/webhooks/stripe`
   - Paystack: `https://yourdomain.com/api/webhooks/paystack`
3. Push database migrations: `npx supabase db push --linked`.
4. Run universal verification: `npm test` and `npx tsc --noEmit`.
