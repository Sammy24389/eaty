# Eaty - Food Delivery Platform

A full-featured food delivery platform built with Next.js 15, featuring customer ordering, admin dashboard, POS terminal, kitchen display system, and PWA support.

## Features

- **Customer Frontend** - Home, menu browsing, cart, checkout, order tracking, PWA
- **Admin Dashboard** - Orders, menu CRUD, customers, settings, reports, analytics
- **POS Terminal** - Full-screen point of sale with cart, checkout, receipt printing
- **Kitchen Display (KDS)** - Real-time order management with status pipeline
- **Order Status Screen (OSS)** - Customer-facing order status display
- **Payments** - Paystack, Flutterwave, Cash on Delivery with webhooks
- **Push Notifications** - FCM integration for mobile/web push
- **WhatsApp Ordering** - One-click cart sharing via WhatsApp
- **i18n** - English, Spanish, French, Arabic (RTL support)
- **PWA** - Installable, offline support, push notifications

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL (PGLite for local, any provider for production)
- **ORM**: Prisma 6
- **Auth**: NextAuth v5
- **UI**: Tailwind CSS + shadcn/ui
- **State**: Zustand (cart), React Context (i18n)
- **Payments**: Paystack, Flutterwave APIs
- **Push**: Firebase Admin SDK (FCM)

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn

### Local Development

```bash
# Install dependencies
npm install

# Initialize embedded database, push schema, and seed
npm run setup

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Default Admin Credentials:**
- Email: `admin@foodappi.com`
- Password: `admin123`

## Deployment

### Option 1: Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Sammy24389/eaty)

1. Connect your GitHub repo to Vercel
2. Set environment variables:
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` - Your Vercel deployment URL
   - `DATABASE_URL` - PostgreSQL connection string (see below)
   - `NEXT_PUBLIC_URL` - Your Vercel deployment URL
   - `FIREBASE_SERVICE_ACCOUNT` - Firebase Admin SDK JSON (optional)
3. Deploy

**Database for Vercel:**
- [Neon](https://neon.tech) - Free serverless PostgreSQL
- [Supabase](https://supabase.com) - Free PostgreSQL
- [Vercel Postgres](https://vercel.com/storage/postgres)

After connecting your database, run migrations:
```bash
npx prisma migrate deploy
npx prisma db seed
```

### Option 2: Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Sammy24389/eaty)

The `render.yaml` file configures:
- Web service (Node.js)
- PostgreSQL database (free tier)
- Automatic migrations on deploy

1. Click the deploy button
2. Render automatically provisions the database and sets `DATABASE_URL`
3. The build command runs `prisma migrate deploy` before starting

### Option 3: Docker

```bash
# Build image
docker build -t eaty .

# Run with environment file
docker run -p 3000:3000 --env-file .env.production eaty
```

### Option 4: VPS / Self-Hosted

```bash
# Clone repo
git clone https://github.com/Sammy24389/eaty.git
cd eaty

# Install and build
npm install
npx prisma generate
npm run build

# Run migrations
npx prisma migrate deploy
npx prisma db seed

# Start (uses PM2 or systemd in production)
npm run start:prod
```

**PM2 Setup:**
```bash
npm install -g pm2
pm2 start npm --name "eaty" -- run start:prod
pm2 save
pm2 startup
```

**Systemd Setup:**
```ini
[Unit]
Description=Eaty Food Delivery
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/eaty
ExecStart=/usr/bin/npm run start:prod
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXTAUTH_SECRET` | Session encryption key | Yes |
| `NEXTAUTH_URL` | Base URL for auth callbacks | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXT_PUBLIC_URL` | Public app URL | Yes |
| `FIREBASE_SERVICE_ACCOUNT` | FCM service account JSON | No |
| `PAYSTACK_SECRET_KEY` | Paystack API key | No |
| `FLUTTERWAVE_SECRET_KEY` | Flutterwave API key | No |
| `SMTP_HOST` | Email server host | No |
| `SMTP_USER` | Email server user | No |
| `SMTP_PASS` | Email server password | No |

## Project Structure

```
├── prisma/
│   ├── schema.prisma          # Database schema (50+ tables)
│   └── seed.ts                # Initial data (admin, branches, etc.)
├── public/
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service worker
├── scripts/
│   ├── init-db.mjs            # Local PGLite initialization
│   ├── start-dev.mjs          # Dev server with embedded DB
│   └── start-prod.mjs         # Production startup
├── src/
│   ├── app/
│   │   ├── (frontend)/        # Customer-facing pages
│   │   ├── (admin)/           # Admin dashboard pages
│   │   ├── (pos)/             # POS terminal pages
│   │   ├── (kds)/             # Kitchen display pages
│   │   ├── (oss)/             # Order status screen
│   │   └── api/               # API routes (84+)
│   ├── components/
│   │   ├── layout/            # Header, footer, etc.
│   │   ├── admin/             # Admin sidebar, header
│   │   ├── cart/              # Cart components
│   │   └── items/             # Item cards, add-to-cart
│   └── lib/
│       ├── auth.ts            # NextAuth config
│       ├── db.ts              # Prisma client
│       ├── push.ts            # FCM push notifications
│       ├── i18n/              # Internationalization
│       ├── ratelimit.ts       # Rate limiting
│       └── store/             # Zustand stores
├── Dockerfile
├── render.yaml
└── vercel.json
```

## API Routes

### Frontend (Public)
- `GET /api/frontend/items` - Browse menu items
- `GET /api/frontend/item-categories` - Menu categories
- `GET /api/frontend/offers` - Active offers
- `POST /api/frontend/orders` - Place order
- `GET /api/frontend/orders` - Customer order history
- `POST /api/frontend/contact` - Contact form
- `POST /api/frontend/subscribers` - Newsletter signup

### Admin (Authenticated)
- `GET/POST/PATCH/DELETE /api/admin/items` - Menu items CRUD
- `GET/POST/PATCH/DELETE /api/admin/online-orders` - Order management
- `GET/POST/PATCH/DELETE /api/admin/pos-orders` - POS orders
- `PATCH /api/admin/kds-orders` - Kitchen status updates
- `POST /api/admin/notifications` - Send push notifications
- `GET/POST /api/admin/settings` - App settings

### Payments
- `POST /api/payment/initialize` - Initialize Paystack/Flutterwave
- `GET /api/payment/verify` - Verify payment after redirect
- `POST /api/webhooks/paystack` - Paystack webhook
- `POST /api/webhooks/flutterwave` - Flutterwave webhook

### Auth
- `POST /api/auth/register` - Customer registration
- `POST /api/auth/otp` - OTP generation/verification
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset completion

## Database

### Local Development
Uses PGLite (embedded PostgreSQL) - no Docker or external database needed.
Database files are stored in `.pglite/` directory.

### Production
Any PostgreSQL provider works:
- **Neon** - Serverless, free tier, branch-based
- **Supabase** - Full PostgreSQL with dashboard
- **Render** - Managed PostgreSQL
- **Railway** - Easy PostgreSQL provisioning
- **AWS RDS** - Enterprise-grade

Run migrations before starting:
```bash
npx prisma migrate deploy
```

## License

MIT
