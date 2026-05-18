# FoodAppi Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Vercel)                     │
│  Next.js 15 App Router | React | TailwindCSS | PWA          │
│  URL: https://your-app.vercel.app                            │
└──────────────────────────┬──────────────────────────────────┘
                           │ API calls (fetch)
                           │ JWT in Authorization header
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend (Render)                      │
│  Express.js | Prisma ORM | JWT Auth | Rate Limiting          │
│  URL: https://eaty-backend.onrender.com                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ Prisma Client
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL (Neon)                          │
│  Serverless | Auto-scaling | Never expires | Free tier       │
│  URL: postgresql://...                                       │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **GitHub Repository** - Pushed to `https://github.com/Sammy24389/eaty`
2. **Vercel Account** - https://vercel.com/signup
3. **Render Account** - https://render.com/register
4. **Neon Account** - https://neon.tech/signup
5. **Payment Gateway Accounts** (optional) - Paystack/Flutterwave

---

## Step 1: Create Neon Database

1. Go to https://neon.tech and sign up (GitHub login works)
2. Click **New Project**
3. **Project Name**: `eaty`
4. **PostgreSQL Version**: `17` (or latest)
5. **Region**: Choose closest to your Render region (e.g., AWS us-east-1 / Virginia)
6. Click **Create Project**
7. You'll land on the dashboard. Copy the **Connection String** under "Connection Details"
   - Select **Prisma** from the dropdown if available
   - Format: `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`
8. **Save this string** — you'll paste it into Render as `DATABASE_URL`

---

## Step 2: Deploy Backend to Render

1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. **Connect Repository** → Select `Sammy24389/eaty`
4. Configure:
   - **Name**: `eaty-backend`
   - **Region**: Same region as your Neon database (e.g., Virginia)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
   - **Plan**: Free

5. **Add Environment Variables:**

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `NODE_VERSION` | `20` |
   | `DATABASE_URL` | (paste Neon connection string from Step 1) |
   | `JWT_SECRET` | (generate: any random 64-char string) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `FRONTEND_URL` | `http://localhost:3000` (update after Vercel deploy) |

6. Click **Create Web Service**

7. **Wait for build** (~2-3 minutes). Watch the logs.

8. **Run Database Migrations:**
   - Go to your service dashboard → **Shell** tab
   - Run:
     ```bash
     npx prisma migrate deploy
     ```

9. **Seed the Database:**
   - In the same Shell, run:
     ```bash
     npx tsx prisma/seed.ts
     ```
   - You should see:
     ```
     Created admin user: admin@foodappi.com
     Created default branch: Main Branch
     Seed complete!
     ```

10. **Verify:**
    - Open: `https://eaty-backend.onrender.com/health`
    - Should return: `{"status":"ok","timestamp":"..."}`

11. **Note your backend URL** (e.g., `https://eaty-backend.onrender.com`)

---

## Step 3: Deploy Frontend to Vercel

1. Go to https://vercel.com
2. Click **Add New...** → **Project**
3. Import `Sammy24389/eaty`
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `.` (root of repo)
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `.next`

5. **Add Environment Variables:**

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://eaty-backend.onrender.com` (from Step 2) |
   | `JWT_SECRET` | (same value as backend JWT_SECRET) |

6. Click **Deploy**

7. **Note your frontend URL** (e.g., `https://your-app.vercel.app`)

---

## Step 4: Update Backend CORS

1. Go to Render Dashboard → `eaty-backend` → **Environment**
2. Update `FRONTEND_URL` to your Vercel URL
3. Click **Save Changes** (triggers redeploy)

---

## Step 5: Configure Payment Gateways (Optional)

### Paystack
1. Go to https://dashboard.paystack.com → Settings → API Keys & Webhooks
2. Copy **Secret Key**
3. Add to Render as `PAYSTACK_SECRET_KEY`
4. Set webhook URL: `https://eaty-backend.onrender.com/api/webhooks/paystack`

### Flutterwave
1. Go to https://dashboard.flutterwave.com → Settings → API Keys
2. Copy **Secret Key**
3. Add to Render as `FLUTTERWAVE_SECRET_KEY`
4. Set webhook URL: `https://eaty-backend.onrender.com/api/webhooks/flutterwave`

---

## Default Admin Credentials

| Field | Value |
|-------|-------|
| Email | `admin@foodappi.com` |
| Password | `admin123` |
| Admin URL | `/admin/login` |

**⚠️ Change the admin password immediately after first login!**

---

## Local Development

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET
npm install
npx prisma generate
npx prisma migrate dev
npx tsx prisma/seed.ts
npm run dev            # Runs on http://localhost:4000
```

### Frontend
```bash
cd foodappi-next
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:4000
# Set JWT_SECRET (same as backend)
npm install
npm run dev            # Runs on http://localhost:3000
```

---

## Troubleshooting

### Backend won't start
- Check Render logs for errors
- Verify `DATABASE_URL` includes `?sslmode=require` (Neon requires SSL)
- Run `npx prisma generate` in build command

### CORS errors
- Ensure `FRONTEND_URL` in Render matches your Vercel URL exactly
- No trailing slash in `FRONTEND_URL`

### JWT verification fails
- `JWT_SECRET` must be identical in both frontend and backend
- Check token is sent as `Authorization: Bearer <token>`

### Database migrations fail
- Run `npx prisma migrate deploy` (not `migrate dev` in production)
- Neon requires `?sslmode=require` in connection string
- Check Neon project is in same region as Render (reduces latency)

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` is set in Vercel
- Check backend is running: `https://eaty-backend.onrender.com/health`

---

## File Structure

```
eaty/
├── backend/                    # Express.js Backend (→ Render)
│   ├── src/
│   │   ├── index.ts           # Entry point
│   │   ├── routes/            # API routes
│   │   │   ├── auth.ts        # Login, register, OTP
│   │   │   ├── frontend.ts    # Public/customer endpoints
│   │   │   ├── admin.ts       # Admin CRUD endpoints
│   │   │   ├── payment.ts     # Paystack/Flutterwave
│   │   │   ├── webhooks.ts    # Payment webhooks
│   │   │   └── profile.ts     # User profile
│   │   ├── middleware/        # Auth, rate limiting
│   │   └── lib/               # Prisma client
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema (50+ tables)
│   │   └── seed.ts            # Database seeder
│   ├── package.json
│   └── tsconfig.json
│
├── src/                        # Next.js Frontend (→ Vercel)
│   ├── app/                    # App Router pages
│   ├── components/             # React components
│   ├── contexts/               # AuthContext (JWT auth)
│   ├── lib/
│   │   ├── api-client.ts      # API fetch wrapper
│   │   ├── auth/rbac.ts       # Server-side auth
│   │   └── store/             # Zustand stores
│   └── middleware.ts           # JWT cookie verification
│
├── vercel.json                 # Vercel deployment config
├── render.yaml                 # Render blueprint config
└── package.json
```

---

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong `JWT_SECRET` (32+ random characters)
- [ ] Enable HTTPS (automatic on Vercel/Render)
- [ ] Set proper CORS origin (your Vercel URL only)
- [ ] Rotate payment gateway API keys
- [ ] Enable rate limiting (already configured)
- [ ] Set `NODE_ENV=production`
- [ ] Remove `.env` files from git
- [ ] Neon auto-suspends after 5 min idle (wakes on next request — ~1s cold start)
