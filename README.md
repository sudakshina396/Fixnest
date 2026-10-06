# Fixnest (HomeServe)

Fixnest is a full-stack, production-minded home-services marketplace. It includes customer booking, provider workflow, administration APIs, role-based JWT authentication, Razorpay verification, Cloudinary upload support, and a Vercel-ready split deployment.

## Architecture

```text
Browser → Vercel frontend (React/Vite) → VITE_API_URL → Vercel backend API (Express)
                                                        ├─ MongoDB Atlas
                                                        ├─ Cloudinary
                                                        ├─ Razorpay
                                                        └─ Transactional email provider
```

The frontend and backend are deliberately deployable as two independent Vercel projects. The frontend never receives backend secrets; it uses only `VITE_API_URL`. The backend owns database access, authentication, Razorpay signature verification, Cloudinary credentials, and CORS policy.

## Repository layout

```text
Fixnest/
├─ frontend/                    # React + TypeScript + Vite + Tailwind
│  ├─ src/
│  │  ├─ api/                   # Axios client and API modules
│  │  ├─ assets/
│  │  ├─ components/
│  │  ├─ context/
│  │  ├─ hooks/
│  │  ├─ layouts/
│  │  ├─ pages/
│  │  ├─ routes/
│  │  ├─ services/
│  │  ├─ types/
│  │  └─ utils/
│  ├─ .env.example
│  └─ vercel.json
├─ backend/                     # Express + TypeScript API
│  ├─ api/index.ts              # Vercel serverless entry point
│  ├─ src/
│  │  ├─ config/
│  │  ├─ controllers/
│  │  ├─ middleware/
│  │  ├─ models/
│  │  ├─ routes/
│  │  ├─ services/
│  │  ├─ utils/
│  │  ├─ validators/
│  │  ├─ app.ts
│  │  └─ server.ts              # Local development only
│  ├─ .env.example
│  └─ vercel.json
├─ package.json                 # npm workspaces and root scripts
└─ .gitignore
```

## Prerequisites

- Node.js 20 LTS or newer
- npm 10 or newer
- A MongoDB Atlas account (needed when database work starts)
- Git

## Local setup

1. Copy the environment templates. In PowerShell:

   ```powershell
   Copy-Item frontend/.env.example frontend/.env
   Copy-Item backend/.env.example backend/.env
   ```

2. Set `VITE_API_URL=http://localhost:5000/api` in `frontend/.env` and set `CLIENT_URL=http://localhost:5173` in `backend/.env`.

3. Install dependencies from the repository root:

   ```powershell
   npm install
   ```

4. Start both apps:

   ```powershell
   npm run dev
   ```

5. Open `http://localhost:5173`. Confirm the browser shows the Fixnest starter page and `http://localhost:5000/api/health` returns a JSON health response.

### Admin account

Set `ADMIN_EMAIL` and a bcryptjs `ADMIN_PASSWORD_HASH` in `server/.env` for the one account that should manage the service catalog. Sign in using the **Admin** option on `/login`; this password flow does not depend on SMTP. A verified OTP login for the same email also receives the `admin` role. The account can open **Manage services** from the header to add catalog entries. Other new accounts remain customers.

Service photos are stored as small data URLs in MongoDB for this MVP; admin uploads are limited to 1 MB. Customers can open a service card, review its details and price, and submit a booking request after signing in.

## Dependency rationale

Frontend dependencies are intentionally limited at this stage: React and React DOM render the UI, React Router will handle page guards and navigation, Axios handles API calls, React Hook Form and Zod provide ergonomic validated forms, TanStack Query handles server state, and Tailwind supports the design system.

Backend dependencies are Express for REST endpoints, Mongoose for MongoDB, `jsonwebtoken`/`bcryptjs` for authentication, Zod for request validation, Helmet/CORS/rate limiting/security middleware for hardening, and Cloudinary/Razorpay SDKs for later integrations. TypeScript developer dependencies compile and type-check both applications.

## Vercel deployment model

Deploy **two Vercel projects from the same Git repository**:

1. Create the frontend project with root directory `frontend`; Vercel runs `npm run build` and serves `dist`. Its rewrite in `frontend/vercel.json` makes React Router deep links work.
2. Create the backend project with root directory `backend`; Vercel invokes `api/index.ts`, which exports the Express app as a serverless function. Do not run `server.ts` on Vercel.
3. Set production variables in the matching Vercel project dashboards (never in source control):
   - frontend: `VITE_API_URL=https://<your-api-domain>/api`
   - backend: `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, Cloudinary variables, Razorpay variables, email variables, and `CLIENT_URL=https://<your-frontend-domain>`
4. Redeploy the frontend after changing `VITE_API_URL`; Vite substitutes `VITE_*` values at build time.

## Production setup checklist (later phases)

1. Create an Atlas organization, project, database user, and cluster; allow Vercel connectivity in Network Access and copy the connection URI into `MONGODB_URI`.
2. Create Cloudinary and Razorpay accounts; place their credentials only in backend Vercel variables.
3. Push this repository to GitHub and import it twice into Vercel using the root directories above.
4. Add `CLIENT_URL` to the backend deployment and deploy both projects.
5. Verify `/api/health`, browser routing, CORS, MongoDB connectivity, then later test Razorpay in test mode before enabling live keys.

## Database initialization

After adding a real `MONGODB_URI` to `backend/.env`, seed a usable demo catalog and your first admin account:

```powershell
npm run seed --workspace=@fixnest/backend
```

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_PHONE` before running the seed. The script upserts the initial categories and service packages, so it is safe to rerun. The database is the source of truth for every displayed package price.

## Implemented API surface

- `/api/auth`: register, login, current user
- `/api/users`: profile and address management
- `/api/categories`, `/api/services`: public catalog plus admin CRUD
- `/api/providers`: application, profile, approval, jobs, and earnings
- `/api/bookings`: create, list, status tracking, cancellation, and admin assignment
- `/api/payments`: Razorpay order creation and server-side HMAC signature verification
- `/api/reviews`, `/api/complaints`, `/api/uploads/image`, `/api/admin/*`

All responses use `{ success, message, data }` on success and `{ success, message, errors }` on error. Booking changes are governed by a strict status-transition service; invalid progressions are rejected.

## Deployment walkthrough

1. Create a MongoDB Atlas cluster and database user. Under **Network Access**, permit access from Vercel (Atlas `0.0.0.0/0` is the simple initial option; use tighter controls when available). Copy the `mongodb+srv` URI into the backend's `MONGODB_URI` variable.
2. Create a Cloudinary product environment, then add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` to the backend project.
3. Razorpay is optional. Without it, customers can use the built-in **Pay after service** flow: a booking is confirmed while its payment remains `PENDING`. When you are ready, create a Razorpay account with test keys and add both backend variables. Payment verification happens on the API only; never put `RAZORPAY_KEY_SECRET` in Vercel's frontend project.
4. Push to GitHub. Import the repository twice in Vercel: `frontend` as one project and `backend` as the other. Keep the automatically detected Node build settings.
5. Deploy the backend first. Set `CLIENT_URL` to the exact production frontend URL, and add `JWT_SECRET` as a long random value. Generate it locally, for example with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
6. Copy the backend deployment URL and set frontend `VITE_API_URL` to `https://your-api.vercel.app/api`; redeploy frontend after changing it.
7. Run the seed command against Atlas from a trusted local shell. Sign in with the seeded admin account, verify the catalog, add providers, then test a booking.
8. Test Razorpay with test cards, confirm the order signature is accepted, then switch to live keys only after the complete production booking flow succeeds.

## Core security decisions

- Passwords are bcrypt-hashed; plain passwords are never stored.
- JWTs expire using `JWT_EXPIRES_IN`; routes enforce both authentication and roles.
- Helmet, explicit CORS, rate limiting, JSON size limits, Mongo query sanitizing, Zod validation, and centralized errors are enabled.
- Cloudinary files are streamed and only their URLs are persisted.
- The Razorpay HMAC signature is validated by the backend before a booking can become paid and confirmed.

## Helpful commands

```powershell
npm run dev
npm run build
npm run typecheck
```
