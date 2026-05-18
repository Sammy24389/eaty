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
│                   PostgreSQL (Render)                        │
│  50+ tables | Shared schema | Production-ready               │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **GitHub Repository** - Push your code to GitHub
2. **Vercel Account** - https://vercel.com/signup
3. **Render Account** - https://render.com/register
4. **Payment Gateway Accounts** (optional) - Paystack/Flutterwave

---

## Step 1: Deploy Backend to Render

### Option A: Using Render Blueprint (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Blueprint**
3. Connect your GitHub repository
4. Select the `render.yaml` file
5. Render will auto-provision:
   - Backend web service
   - PostgreSQL database
   - Environment variables (JWT_SECRET auto-generated)

### Option B: Manual Setup

1. **Create PostgreSQL Database:**
   - Go to Render Dashboard → **New +** → **PostgreSQL**
   - Name: `eaty-db`
   - Region: Virginia (or closest to you)
   - Plan: Free
   - Copy the **Internal Connection String**

2. **Create Web Service:**
   - **New +** → **Web Service**
   - Connect your GitHub repo
   - Configure:
     - **Name**: `eaty-backend`
     - **Root Directory**: `backend`
     - **Build Command**: `npm install && npx prisma generate && npm run build`
     - **Start Command**: `npm start`
     - **Health Check Path**: `/health`
     - **Plan**: Free

3. **Add Environment Variables:**
   | Variable | Value |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `NODE_VERSION` | `20` |
   | `DATABASE_URL` | (PostgreSQL connection string from step 1) |
   | `JWT_SECRET` | (Generate: `openssl rand -hex 32`) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `FRONTEND_URL` | (Your Vercel URL - set after Step 2) |
   | `PAYSTACK_SECRET_KEY` | (Optional - your Paystack secret) |
   | `FLUTTERWAVE_SECRET_KEY` | (Optional - your Flutterwave secret) |

4. **Deploy** - Click "Create Web Service"

5. **Run Database Migrations & Seed:**
   - Go to your backend service in Render Dashboard
   - Click **Shell** tab
   - Run these commands:
     ```bash
     npx prisma migrate deploy
     npm run seed
     ```

6. **Note the Backend URL** (e.g., `https://eaty-backend.onrender.com`)

---

## Step 2: Deploy Frontend to Vercel

1. Go to [Vercel](https://vercel.com)
2. Click **Add New...** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `foodappi-next` (or your frontend folder)
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `.next`

5. **Add Environment Variables:**
   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | `https://eaty-backend.onrender.com` (from Step 1) |
   | `JWT_SECRET` | (Same value as backend JWT_SECRET) |

6. **Deploy** - Click "Deploy"

7. **Note the Frontend URL** (e.g., `https://your-app.vercel.app`)

---

## Step 3: Update Backend CORS

1. Go back to Render Dashboard → your backend service
2. Go to **Environment** tab
3. Update `FRONTEND_URL` to your Vercel URL
4. Click **Save Changes** (triggers redeploy)

---

## Step 4: Configure Payment Gateways (Optional)

### Paystack
1. Go to [Paystack Dashboard](https://dashboard.paystack.com)
2. Settings → API Keys & Webhooks
3. Copy **Secret Key**
4. Add to Render backend as `PAYSTACK_SECRET_KEY`
5. Set webhook URL: `https://eaty-backend.onrender.com/api/webhooks/paystack`

### Flutterwave
1. Go to [Flutterwave Dashboard](https://dashboard.flutterwave.com)
2. Settings → API Keys
3. Copy **Secret Key**
4. Add to Render backend as `FLUTTERWAVE_SECRET_KEY`
5. Set webhook URL: `https://eaty-backend.onrender.com/api/webhooks/flutterwave`

---

## Step 5: Verify Deployment

### Test Backend
```bash
curl https://eaty-backend.onrender.com/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Test Frontend
1. Open your Vercel URL in browser
2. Navigate to `/login`
3. Login with:
   - **Email**: `admin@foodappi.com`
   - **Password**: `admin123`
4. Navigate to `/admin/dashboard`

### Test API Connection
1. Open browser DevTools → Network tab
2. Login on the frontend
3. Check that API calls go to your Render backend URL
4. Verify JWT token is stored in localStorage

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
npm run migrate:dev    # or npm run db:push for PGLite
npm run seed
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
- Verify `DATABASE_URL` is correct
- Run `npx prisma generate` in build command

### CORS errors
- Ensure `FRONTEND_URL` in Render matches your Vercel URL exactly
- No trailing slash in `FRONTEND_URL`

### JWT verification fails
- `JWT_SECRET` must be identical in both frontend and backend
- Check that token is being sent in `Authorization: Bearer <token>` header

### Database migrations fail
- Run `npx prisma migrate deploy` (not `migrate dev` in production)
- Check PostgreSQL connection string format

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel
- Check that backend is running and healthy

---

## File Structure

```
foodappi-next/
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
- [ ] Regular database backups (Render auto-backups)
