# JRADIANCE E-Commerce Platform
## Product Requirements Document (PRD)

**Document Version:** 1.0.0  
**Last Updated:** 2026-03-15  
**Status:** ✅ Complete & Production Ready  
**Confidentiality:** Proprietary & Confidential

---

## Executive Summary

JRADIANCE is a comprehensive e-commerce platform designed for premium cosmetics and skincare products targeting the Nigerian market with international expansion capabilities. The platform provides a complete solution for online retail operations with multi-currency support, secure payment processing, and enterprise-grade security.

### Product Vision

To become Nigeria's leading online destination for premium cosmetics and skincare, providing customers with an exceptional shopping experience and businesses with powerful management tools.

### Target Market

- **Primary:** Nigeria (NGN currency)
- **Secondary:** USA, UK, Europe, Africa (USD currency)
- **Demographics:** Age 18-45, beauty-conscious consumers
- **Psychographics:** Quality-focused, brand-conscious, convenience-seeking

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [User Personas](#user-personas)
3. [Functional Requirements](#functional-requirements)
4. [User Stories & Journey Maps](#user-stories--journey-maps)
5. [Non-Functional Requirements](#non-functional-requirements)
6. [System Architecture](#system-architecture)
7. [Data Models](#data-models)
8. [API Specifications](#api-specifications)
9. [Security Requirements](#security-requirements)
10. [Performance Metrics](#performance-metrics)
11. [Success Metrics](#success-metrics)
12. [Roadmap](#roadmap)

---

## Product Overview

### Core Features

| Feature | Priority | Status | Description |
|---------|----------|--------|-------------|
| **Product Catalog** | P0 | ✅ Complete | Browse, search, filter products |
| **Shopping Cart** | P0 | ✅ Complete | Add, update, remove items |
| **Checkout** | P0 | ✅ Complete | Secure payment processing |
| **Order Management** | P0 | ✅ Complete | Track and manage orders |
| **Multi-Currency** | P0 | ✅ Complete | NGN and USD support |
| **Admin Dashboard** | P0 | ✅ Complete | Complete admin panel |
| **User Authentication** | P0 | ✅ Complete | Secure login/signup |
| **Wishlist** | P1 | ✅ Complete | Save favorite products |
| **Product Reviews** | P2 | ⏳ Planned | Rate and review products |
| **Recommendations** | P1 | ✅ Complete | Product suggestions |

### Unique Value Propositions

1. **Multi-Currency Pricing** - Seamless NGN/USD switching
2. **Local Payment Methods** - Flutterwave integration for Nigeria
3. **Real-Time Order Tracking** - Complete order visibility
4. **Enterprise Security** - Bank-grade security measures
5. **Mobile-First Design** - Optimized for mobile shopping

---

## User Personas

### 1. Customer - Chioma (Primary User)

**Demographics:**
- Age: 28
- Location: Lagos, Nigeria
- Occupation: Marketing Manager
- Income: ₦500,000/month

**Goals:**
- Find quality skincare products
- Quick and easy checkout
- Track order delivery
- Secure payment options

**Frustrations:**
- Complicated checkout processes
- Unclear delivery timelines
- Poor mobile experience
- Limited payment options

**Technical Proficiency:** High
**Preferred Device:** Mobile (iPhone)

---

### 2. Customer - Sarah (International User)

**Demographics:**
- Age: 35
- Location: Houston, USA
- Occupation: Software Engineer
- Income: $120,000/year
- Nigerian diaspora

**Goals:**
- Access Nigerian beauty products
- Pay in USD
- International shipping
- Product authenticity

**Frustrations:**
- Currency conversion confusion
- High international shipping costs
- Long delivery times

**Technical Proficiency:** Very High
**Preferred Device:** Desktop

---

### 3. Admin - Mr. Johnson (Store Manager)

**Demographics:**
- Age: 42
- Location: Lagos, Nigeria
- Role: Operations Manager
- Experience: 10 years retail

**Goals:**
- Manage inventory efficiently
- Process orders quickly
- Generate sales reports
- Handle customer issues

**Frustrations:**
- Complex admin interfaces
- Manual processes
- Lack of real-time data

**Technical Proficiency:** Medium
**Preferred Device:** Desktop

---

### 4. Chief Admin - Philip (Business Owner)

**Demographics:**
- Age: 38
- Location: Lagos, Nigeria
- Role: Founder/CEO
- Experience: 15 years business

**Goals:**
- Monitor business performance
- Manage team access
- Ensure security
- Scale operations

**Frustrations:**
- Limited visibility
- Security concerns
- Integration challenges

**Technical Proficiency:** High
**Preferred Device:** Mobile & Desktop

---

## Functional Requirements

### FR-1: User Authentication & Authorization

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-1.1 | Users shall be able to register with email and password | P0 | ✅ Complete |
| FR-1.2 | Users shall be able to login with credentials | P0 | ✅ Complete |
| FR-1.3 | Users shall be able to reset forgotten password | P0 | ✅ Complete |
| FR-1.4 | System shall support role-based access (customer, agent, admin, chief_admin) | P0 | ✅ Complete |
| FR-1.5 | System shall enforce password strength requirements | P0 | ✅ Complete |
| FR-1.6 | System shall support email verification | P1 | ✅ Complete |
| FR-1.7 | System shall support session management | P0 | ✅ Complete |

### FR-2: Product Management

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-2.1 | Admins shall be able to create products with NGN and USD prices | P0 | ✅ Complete |
| FR-2.2 | Admins shall be able to update product information | P0 | ✅ Complete |
| FR-2.3 | Admins shall be able to manage product images | P0 | ✅ Complete |
| FR-2.4 | Admins shall be able to set product stock levels | P0 | ✅ Complete |
| FR-2.5 | System shall auto-generate product slugs | P0 | ✅ Complete |
| FR-2.6 | System shall auto-generate SKUs | P0 | ✅ Complete |
| FR-2.7 | System shall support product categories | P0 | ✅ Complete |
| FR-2.8 | System shall support soft delete for products | P0 | ✅ Complete |

### FR-3: Shopping Experience

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-3.1 | Users shall be able to browse products by category | P0 | ✅ Complete |
| FR-3.2 | Users shall be able to search products | P0 | ✅ Complete |
| FR-3.3 | Users shall be able to filter products | P0 | ✅ Complete |
| FR-3.4 | Users shall be able to sort products | P0 | ✅ Complete |
| FR-3.5 | Users shall be able to view product details | P0 | ✅ Complete |
| FR-3.6 | Users shall be able to add products to cart | P0 | ✅ Complete |
| FR-3.7 | Users shall be able to update cart quantities | P0 | ✅ Complete |
| FR-3.8 | Users shall be able to remove items from cart | P0 | ✅ Complete |
| FR-3.9 | Users shall be able to save products to wishlist | P1 | ✅ Complete |
| FR-3.10 | System shall sync cart across devices | P1 | ✅ Complete |

### FR-4: Checkout & Payment

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-4.1 | Users shall be able to checkout with cart items | P0 | ✅ Complete |
| FR-4.2 | System shall calculate tax (7.5% VAT) | P0 | ✅ Complete |
| FR-4.3 | System shall calculate shipping (Free above ₦50,000) | P0 | ✅ Complete |
| FR-4.4 | System shall support Flutterwave payment | P0 | ✅ Complete |
| FR-4.5 | System shall verify payments server-side | P0 | ✅ Complete |
| FR-4.6 | System shall handle payment failures gracefully | P0 | ✅ Complete |
| FR-4.7 | System shall send order confirmation | P1 | ⏳ Planned |
| FR-4.8 | System shall prevent duplicate orders | P0 | ✅ Complete |

### FR-5: Order Management

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-5.1 | Users shall be able to view order history | P0 | ✅ Complete |
| FR-5.2 | Users shall be able to track order status | P0 | ✅ Complete |
| FR-5.3 | System shall support order statuses (pending, confirmed, shipped, delivered, cancelled, returned) | P0 | ✅ Complete |
| FR-5.4 | Admins shall be able to update order status | P0 | ✅ Complete |
| FR-5.5 | Admins shall be able to cancel orders | P0 | ✅ Complete |
| FR-5.6 | Admins shall be able to process refunds | P1 | ✅ Complete |
| FR-5.7 | System shall preserve order history | P0 | ✅ Complete |

### FR-6: Admin Features

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-6.1 | Admins shall have a dashboard with sales stats | P0 | ✅ Complete |
| FR-6.2 | Admins shall be able to manage users | P0 | ✅ Complete |
| FR-6.3 | Admins shall be able to manage roles | P0 | ✅ Complete |
| FR-6.4 | Admins shall be able to view audit logs | P0 | ✅ Complete |
| FR-6.5 | Admins shall be able to manage customer issues | P0 | ✅ Complete |
| FR-6.6 | Admins shall be able to view sales reports | P0 | ✅ Complete |
| FR-6.7 | System shall log all admin actions | P0 | ✅ Complete |

### FR-7: Multi-Currency

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-7.1 | System shall support NGN and USD currencies | P0 | ✅ Complete |
| FR-7.2 | System shall auto-detect user currency | P0 | ✅ Complete |
| FR-7.3 | Users shall be able to manually switch currency | P0 | ✅ Complete |
| FR-7.4 | System shall persist currency preference | P0 | ✅ Complete |
| FR-7.5 | System shall format prices correctly | P0 | ✅ Complete |
| FR-7.6 | Admins shall set both NGN and USD prices | P0 | ✅ Complete |

### FR-8: Customer Support

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-8.1 | Users shall be able to submit bug reports | P0 | ✅ Complete |
| FR-8.2 | Users shall be able to submit complaints | P0 | ✅ Complete |
| FR-8.3 | Users shall be able to submit feature requests | P1 | ✅ Complete |
| FR-8.4 | Users shall be able to contact support | P0 | ✅ Complete |
| FR-8.5 | Admins shall be able to resolve issues | P0 | ✅ Complete |
| FR-8.6 | Admins shall be able to clear resolved issues | P1 | ✅ Complete |

---

## User Stories & Journey Maps

### User Story 1: Browse and Purchase Product

**As a** customer  
**I want to** browse products and make a purchase  
**So that** I can get the skincare products I need

#### Journey Map

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browse    │────▶│   View      │────▶│  Add to     │────▶│  Checkout   │
│   Products  │     │   Product   │     │   Cart      │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
  - Search            - Images            - Update            - Enter details
  - Filter            - Description       - Remove            - Payment
  - Sort              - Reviews           - View total        - Confirm
```

**Touchpoints:**
1. Homepage → Shop page
2. Product listing → Product details
3. Add to cart → Cart overlay
4. Checkout → Payment → Confirmation

**Emotions:**
- 😊 Excited to find products
- 😐 Cautious about quality
- 😌 Satisfied with easy checkout
- 😃 Happy with confirmation

---

### User Story 2: Track Order

**As a** customer  
**I want to** track my order status  
**So that** I know when to expect delivery

#### Journey Map

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login     │────▶│  Order      │────▶│  Select     │────▶│  View       │
│             │     │  History    │     │  Order      │     │  Tracking   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
  - Credentials       - List of         - Order details     - Status timeline
  - Dashboard         - orders          - Tracking #        - Delivery date
```

---

### User Story 3: Manage Products (Admin)

**As an** admin  
**I want to** create and manage products  
**So that** customers can purchase them

#### Journey Map

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Admin     │────▶│  Catalog    │────▶│  Add/Edit   │────▶│  Save &     │
│   Dashboard │     │  Page       │     │  Product    │     │  Publish    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
  - Login             - Product         - Details           - Validation
  - Navigate          - list            - Images            - Success
  - Permissions       - Search          - Pricing           - Publish
```

---

## Non-Functional Requirements

### NFR-1: Performance

| ID | Requirement | Target | Measurement |
|----|-------------|--------|-------------|
| NFR-1.1 | Page load time | < 3 seconds | Lighthouse |
| NFR-1.2 | Time to Interactive | < 5 seconds | Lighthouse |
| NFR-1.3 | API response time | < 500ms | Server logs |
| NFR-1.4 | Database query time | < 100ms | Supabase logs |
| NFR-1.5 | Image optimization | < 200KB per image | Audit |
| NFR-1.6 | Core Web Vitals | All green | Search Console |

### NFR-2: Scalability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-2.1 | Concurrent users | 10,000+ |
| NFR-2.2 | Products in catalog | 10,000+ |
| NFR-2.3 | Orders per day | 1,000+ |
| NFR-2.4 | Database size | 100GB+ |
| NFR-2.5 | File storage | 500GB+ |

### NFR-3: Security

| ID | Requirement | Implementation |
|----|-------------|----------------|
| NFR-3.1 | Data encryption | HTTPS/TLS 1.3 |
| NFR-3.2 | Password hashing | bcrypt |
| NFR-3.3 | SQL injection prevention | Parameterized queries |
| NFR-3.4 | XSS prevention | Input sanitization |
| NFR-3.5 | CSRF protection | CSRF tokens |
| NFR-3.6 | Rate limiting | API rate limits |
| NFR-3.7 | Access control | RLS policies |
| NFR-3.8 | Audit logging | All admin actions |

### NFR-4: Reliability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-4.1 | Uptime | 99.9% |
| NFR-4.2 | Backup frequency | Daily |
| NFR-4.3 | Recovery time | < 4 hours |
| NFR-4.4 | Error rate | < 0.1% |
| NFR-4.5 | Payment success rate | > 95% |

### NFR-5: Usability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-5.1 | Mobile responsiveness | 100% pages |
| NFR-5.2 | Accessibility | WCAG 2.1 AA |
| NFR-5.3 | Browser support | Last 2 versions |
| NFR-5.4 | Load time on 3G | < 5 seconds |
| NFR-5.5 | User error rate | < 5% |

---

## System Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │   Web App  │  │  Mobile    │  │   Admin    │             │
│  │  (Next.js) │  │   (PWA)    │  │  Dashboard │             │
│  └────────────┘  └────────────┘  └────────────┘             │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                        CDN LAYER                              │
│                    (Vercel Edge Network)                      │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │ API Routes │  │   Server   │  │   Server   │             │
│  │  (REST)    │  │  Actions   │  │  Clients   │             │
│  └────────────┘  └────────────┘  └────────────┘             │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │  Supabase  │  │  Storage   │  │     Auth   │             │
│  │ PostgreSQL │  │    (S3)    │  │  (Supabase)│             │
│  └────────────┘  └────────────┘  └────────────┘             │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │ Flutterwave│  │   Vercel   │  │   Email    │             │
│  │ (Payment)  │  │  Analytics │  │   (SMTP)   │             │
│  └────────────┘  └────────────┘  └────────────┘             │
└──────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Components                   │
├─────────────────────────────────────────────────────────┤
│  Pages (App Router)                                     │
│  ├── (users)/shop/*         - Customer pages           │
│  ├── admin/*                - Admin panel              │
│  └── api/*                  - API routes               │
├─────────────────────────────────────────────────────────┤
│  Components                                             │
│  ├── products/              - Product components       │
│  ├── checkout/              - Checkout flow            │
│  └── common/                - Reusable components      │
├─────────────────────────────────────────────────────────┤
│  Context Providers                                      │
│  ├── UserContext            - Authentication           │
│  ├── CartContext            - Shopping cart            │
│  ├── CurrencyContext        - Multi-currency           │
│  └── ToastContext           - Notifications            │
└─────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
User Action → Component → Context → Server Action → Supabase
     │            │           │           │             │
     │            │           │           │             ▼
     │            │           │           │        Database
     │            │           │           │
     │            │           │           ▼
     │            │           │      API Route
     │            │           │
     │            │           ▼
     │            │      State Update
     │            │
     │            ▼
     │        UI Update
     │
     ▼
  Response
```

---

## Data Models

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  profiles   │──────<│ cart_items  │>──────│  products   │
└─────────────┘   1:M └─────────────┘   M:1 └─────────────┘
      │                                         │
      │ 1:M                                     │ 1:M
      ▼                                         ▼
┌─────────────┐                         ┌─────────────┐
│   orders    │                         │order_items  │
└─────────────┘                         └─────────────┘
      │                                         │
      │ 1:M                                     │ M:1
      ▼                                         ▼
┌─────────────┐                         ┌─────────────┐
│admin_staff  │>────────────────────────│   issues    │
└─────────────┘       M:1               └─────────────┘
```

### Core Entities

#### User (profiles)

```typescript
interface Profile {
  id: string;              // UUID, PK
  email: string;           // Unique, indexed
  full_name: string;
  phone: string;
  role: UserRole;          // Enum
  is_active: boolean;
  created_at: timestamp;
  updated_at: timestamp;
}
```

#### Product

```typescript
interface Product {
  id: string;              // UUID, PK
  name: string;            // Indexed
  slug: string;            // Unique, indexed
  category: string;        // Indexed
  price: decimal;          // NGN price
  usd_price: decimal;      // USD price
  stock_quantity: integer;
  is_active: boolean;      // Indexed
  created_at: timestamp;
  updated_at: timestamp;
  deleted_at: timestamp;   // Soft delete
}
```

#### Order

```typescript
interface Order {
  id: string;              // UUID, PK
  order_number: string;    // Unique, indexed
  user_id: string;         // FK → profiles
  status: OrderStatus;     // Enum
  payment_status: PaymentStatus;
  total_amount: decimal;
  currency: string;        // 'NGN' or 'USD'
  created_at: timestamp;
  updated_at: timestamp;
}
```

---

## API Specifications

### RESTful Endpoints

#### Products

```
GET    /api/products              - List products
GET    /api/products/:slug        - Get product by slug
POST   /api/products              - Create product (Admin)
PUT    /api/products/:id          - Update product (Admin)
DELETE /api/products/:id          - Delete product (Admin)
```

#### Orders

```
GET    /api/orders                - List orders (User/Admin)
GET    /api/orders/:id            - Get order details
POST   /api/orders                - Create order
PUT    /api/orders/:id/status     - Update status (Admin)
```

#### Payment

```
POST   /api/flutterwave/verify    - Verify payment
POST   /api/flutterwave/webhook   - Payment webhook
```

---

## Security Requirements

### Authentication

- ✅ Supabase Auth with email/password
- ✅ JWT token-based sessions
- ✅ Password strength requirements (min 8 chars)
- ✅ Email verification for new accounts
- ✅ Password reset via email

### Authorization

- ✅ Role-Based Access Control (RBAC)
- ✅ Row Level Security (RLS) policies
- ✅ Server-side permission checks
- ✅ API route protection

### Data Protection

- ✅ HTTPS/TLS encryption
- ✅ Environment variable protection
- ✅ Input validation and sanitization
- ✅ SQL injection prevention
- ✅ XSS protection

---

## Performance Metrics

### Key Performance Indicators (KPIs)

| Metric | Target | Current |
|--------|--------|---------|
| Page Load Time | < 3s | 2.1s ✅ |
| API Response Time | < 500ms | 320ms ✅ |
| Conversion Rate | > 2% | TBD |
| Cart Abandonment | < 70% | TBD |
| Customer Satisfaction | > 4.5/5 | TBD |

### Monitoring

- ✅ Vercel Analytics for page views
- ✅ Vercel Speed Insights for performance
- ✅ Supabase logs for database queries
- ✅ Error tracking for exceptions

---

## Success Metrics

### Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Monthly Revenue | ₦10M+ | Sales reports |
| Orders per Month | 1,000+ | Order count |
| Average Order Value | ₦15,000+ | Revenue/Orders |
| Customer Retention | > 30% | Repeat customers |
| Cart Conversion | > 3% | Checkout/Views |

### Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Uptime | 99.9% | Vercel status |
| Error Rate | < 0.1% | Error logs |
| Page Speed Score | > 90 | Lighthouse |
| Mobile Performance | > 85 | Lighthouse |

---

## Roadmap

### Phase 1: Foundation (Completed ✅)

- [x] Core e-commerce features
- [x] Payment integration
- [x] Admin panel
- [x] Multi-currency support
- [x] Order tracking

### Phase 2: Enhancement (Q2 Future)

- [ ] Email notifications
- [ ] Product reviews
- [ ] Advanced analytics
- [ ] Marketing tools
- [ ] SEO optimization

### Phase 3: Growth (Q3 Future)

- [ ] Mobile app (React Native)
- [ ] Loyalty program
- [ ] Affiliate system
- [ ] Multi-vendor support
- [ ] International shipping

### Phase 4: Scale (Q4 Future)

- [ ] AI recommendations
- [ ] Chatbot support
- [ ] AR product preview
- [ ] Voice search
- [ ] Blockchain authentication

---

## Appendix

### Glossary

| Term | Definition |
|------|------------|
| **RLS** | Row Level Security - Database-level access control |
| **RBAC** | Role-Based Access Control - Permission management |
| **SSG** | Static Site Generation - Pre-rendered pages |
| **SSR** | Server-Side Rendering - Dynamic rendering |
| **PWA** | Progressive Web App - App-like web experience |

### References

- Next.js Documentation: https://nextjs.org/docs
- Supabase Documentation: https://supabase.com/docs
- Flutterwave Documentation: https://flutterwave.com/docs
- Tailwind CSS: https://tailwindcss.com/docs

---

**Document Approval**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | Jradianceco | | |
| Tech Lead | Oluwaseye Ayooluwa Philip | Ayooluwa | 16th, March, 2026|
| Project Manager | Adesokan B. | | |

**Last Updated:** 2026-03-16  
**Next Review:** 2026-06-16
