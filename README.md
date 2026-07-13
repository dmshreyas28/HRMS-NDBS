# HRMS — Talent Acquisition Platform

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Prerequisites](#3-prerequisites)
4. [Quick Start (Docker)](#4-quick-start-docker)
5. [Local Development Setup](#5-local-development-setup)
6. [Configuration Reference](#6-configuration-reference)
7. [Seed Data & Test Accounts](#7-seed-data--test-accounts)
8. [User Roles & Permissions](#8-user-roles--permissions)
9. [Platform Features](#9-platform-features)
   - [Authentication](#91-authentication)
   - [Manpower Requisition (MRF)](#92-manpower-requisition-mrf)
   - [Position Lifecycle & State Machine](#93-position-lifecycle--state-machine)
   - [Approval Workflow](#94-approval-workflow)
   - [Job Posting](#95-job-posting)
   - [ATS — Candidate Pipeline](#96-ats--candidate-pipeline)
   - [Notifications](#97-notifications)
   - [Background Jobs (Hangfire)](#98-background-jobs-hangfire)
   - [Dashboard](#99-dashboard)
   - [Admin Panel](#910-admin-panel)
10. [API Reference](#10-api-reference)
11. [Project Structure](#11-project-structure)
12. [Troubleshooting](#12-troubleshooting)
13. [Future Enhancements](#13-future-enhancements)

---

## 1. Overview

The HRMS Talent Acquisition Platform is a full-stack web application for managing the entire recruitment lifecycle — from raising a Manpower Requisition Form (MRF), through approval workflows, to posting jobs and tracking candidates through an ATS pipeline.

**Tech Stack:**

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| State Management | Zustand (persisted) + React Query |
| Backend API | C# .NET 9 (ASP.NET Core) |
| Database | MongoDB 7.0 |
| Auth | Auth0 OAuth 2.0 (OpenID Connect) |
| Background Jobs | Hangfire with MongoDB storage |
| Reverse Proxy | Nginx (production) / Vite proxy (dev) |
| Deployment | Docker Compose |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser / Client                       │
│           React 19 SPA (Vite + Tailwind)                 │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP (proxied in dev, or nginx)
┌──────────────────▼──────────────────────────────────────┐
│                  Nginx (port 80)                          │
│    /api/*  → api:5000     /uploads/* → api:5000          │
│    /*      → serve dist/index.html  (SPA fallback)        │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│              .NET 9 API (port 5000)                      │
│  ┌─────────┐ ┌────────────┐ ┌──────────────┐            │
│  │ Auth0   │ │ Controllers │ │ Hangfire    │            │
│  │ (OAuth)  │ │ (REST API)  │ │ (Recurring) │            │
│  └────┬─────┘ └──────┬─────┘ └──────┬───────┘            │
│       │              │               │                    │
│  ┌────▼──────────────▼───────────────▼───────┐           │
│  │       Services Layer                       │           │
│  │ Position │ Candidate │ Auth │ Notification│           │
│  └────────────────┬──────────────────────────┘           │
│                   │                                      │
│  ┌────────────────▼──────────────────────────┐           │
│  │       Repositories (MongoDB Driver 3.9)    │           │
│  └────────────────┬──────────────────────────┘           │
└───────────────────┼─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│              MongoDB 7.0 (port 27017)                    │
│  Collections: users, positions, candidates, notifications,│
│              mrf_templates, cost_centres, doa_entries     │
│  + Hangfire DB: hrms_hangfire                            │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Docker Desktop** (or Docker Engine + Compose) | 20.10+ | Full-stack deployment |
| **.NET 9 SDK** | 9.0.x | Backend development (local dev only) |
| **Node.js** | 18 LTS+ | Frontend development (local dev only) |
| **MongoDB** (optional) | 7.0 | If running outside Docker |

> **For production deployment**, Docker Compose is the recommended approach — it bundles MongoDB, the API, and Nginx in one command.

---

## 4. Quick Start (Docker)

### 4.1. Build & Launch

```bash
cd "E:\HRMS NDBS"

# Build frontend (needed for nginx to serve it)
cd client
npm install
npm run build
cd ..

# Build and start all services
docker compose up --build -d
```

This starts three containers:

| Container | Port | Purpose |
|-----------|------|---------|
| `hrms-mongo` | 27017 | MongoDB database |
| `hrms-api` | 5000 | .NET 9 backend API |
| `hrms-web` | 80 | Nginx serving frontend + API proxy |

### 4.2. Verify It's Running

1. Open **http://localhost** in your browser
2. Log in with a test account (see [Section 7](#7-seed-data--test-accounts))
3. The API automatically seeds data on first startup (cost centres, templates, DoA rules, test users)

### 4.3. Useful Docker Commands

```bash
# View logs (all services)
docker compose logs -f

# View API logs only
docker compose logs -f api

# Rebuild after code changes
docker compose up --build -d

# Stop everything
docker compose down

# Stop + delete data volumes (fresh start)
docker compose down -v

# Restart just the API (after config change)
docker compose restart api
```

### 4.4. Volumes

| Volume | Purpose |
|--------|---------|
| `mongo-data` | Persists MongoDB data |
| `uploads-data` | Persists uploaded CV files |

---

## 5. Local Development Setup

If you prefer to run services individually (for hot-reload during development):

### 5.1. Start MongoDB

**Option A — Docker:**
```bash
docker run -d --name hrms-mongo -p 27017:27017 mongo:7.0
```

**Option B — Local install:** Install MongoDB 7.0 and ensure it's running on `localhost:27017`.

### 5.2. Start the Backend API

```bash
cd server/HRMS.API
dotnet restore
dotnet run
```

The API starts on **http://localhost:5000**. Swagger UI is available at **http://localhost:5000/swagger**. Data is seeded automatically on startup.

### 5.3. Start the Frontend

```bash
cd client
npm install
npm run dev
```

The dev server starts on **http://localhost:5173**. It proxies `/api/*` and `/uploads/*` to the backend automatically.

### 5.4. Access

| URL | What |
|-----|------|
| http://localhost:5173 | Frontend (Vite dev server) |
| http://localhost:5000 | Backend API |
| http://localhost:5000/swagger | Swagger API docs |
| http://localhost:5000/hangfire | Hangfire dashboard (background jobs) |

---

## 6. Configuration Reference

All configuration is managed using `.env` files in the client and server subdirectories.

### 6.1. Environment Variables Configuration

The application is configured using `.env` files for both frontend and backend services:

#### Frontend (`client/.env`):
- `VITE_AUTH0_DOMAIN`: Your Auth0 tenant domain (e.g. `dev-xxx.us.auth0.com`).
- `VITE_AUTH0_CLIENT_ID`: Your Auth0 Client ID.
- `VITE_AUTH0_AUDIENCE`: Your Auth0 API Audience identifier (e.g. `https://hrms-api`).

#### Backend (`server/HRMS.API/.env`):
- `Auth0__Domain`: The Auth0 tenant domain.
- `Auth0__Audience`: The Auth0 API Audience identifier.
- `ConnectionStrings__Mongo`: Connection string to MongoDB (e.g. `mongodb://mongo:27017/hrms`).

### 6.2. Database Settings

```json
{
  "MongoDB": {
    "ConnectionString": "mongodb://localhost:27017",  // Docker: "mongodb://mongo:27017"
    "DatabaseName": "hrms"
  },
  "Hangfire": {
    "MongoConnectionString": "mongodb://localhost:27017",
    "DatabaseName": "hrms_hangfire"
  }
}
```

### 6.3. CORS Settings

```json
{
  "Cors": {
    "Origin": "http://localhost:5173"  // Production: "http://localhost"
  }
}
```

### 6.4. File Storage

```json
{
  "FileStorage": {
    "Type": "local",        // "local" or "azure-blob"
    "LocalPath": "./uploads",
    "AzureBlobConnection": ""
  }
}
```

### 6.5. Notification Settings

```json
{
  "Notification": {
    "EmailProvider": "mock"  // "mock" = console log | future: "smtp", "sendgrid"
  }
}
```

---

## 7. Seed Data & Test Accounts

You can seed the database with initial configurations (Cost Centres, MRF Templates, and DoA thresholds) by logging in as the Admin and clicking the **Reset & Seed Database** button on the Admin Console dashboard, or by triggering the `/api/admin/seed` endpoint.

### 7.1. Demo Profiles (Auth0 Sign-in)

The Auth0 login page provides pre-configured profiles for quick sign-in:

| Profile | Email | Role | Cost Centre |
|---------|-------|------|-------------|
| Hiring Manager | `hm@example.com` | HM (Hiring Manager) | Engineering (`CC-001`) |
| HR/TA Recruiter | `ta@example.com` | HR_TA (HR / Talent Acquisition) | People (`CC-005`) |
| System Administrator | `admin@example.com` | Admin | People (`CC-005`) |

### 7.2. Seed Entities

| Entity | Count | Details |
|--------|-------|---------|
| Cost Centres | 5 | Engineering, Marketing, Operations, Finance, Human Resources |
| MRF Templates | 9 | Pre-filled details including job titles, JDs, and skills for common roles |
| DoA Entries | 5 | Authority members for approval routing (Priya Sharma, Rahul Mehta, etc.) |

### 7.3. Manual Re-Seed

```powershell
# Trigger database re-seed via API:
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/admin/seed
```

---

## 8. User Roles & Permissions

| Role | Description | Access |
|------|-------------|--------|
| **HM** (Hiring Manager) | Requests positions, manages their pipeline | Raise/edit own MRFs, view own dashboard, manage candidates on own positions |
| **HR_TA** (HR / Talent Acquisition) | Reviews, approves, posts jobs, manages ATS | Approve/reject MRFs, post jobs, manage all candidates, view TA dashboard |
| **Admin** | Full system management | All of the above + user management, templates, cost centres, DoA, view admin dashboard |

### Sidebar Navigation by Role

| Page | HM | HR_TA | Admin |
|------|:--:|:-----:|:-----:|
| Dashboard | ✅ | ✅ | ✅ |
| Raise Position | ✅ | ✅ | ✅ |
| Positions | ✅ | ✅ | ✅ |
| ATS Pipeline | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ |
| Users | — | — | ✅ |
| MRF Templates | — | — | ✅ |
| Cost Centres | — | — | ✅ |
| DoA Settings | — | — | ✅ |
| All Positions | — | — | ✅ |

---

## 9. Platform Features

### 9.1. Authentication

- **Login page** at `/login` with email + password
- **Quick-fill buttons** for demo accounts (one-click login)
- JWT token stored in `localStorage` via Zustand persist
- Auto-logout on 401 response (expired/invalid token)
- Token attached to every API request via Axios interceptor

### 9.2. Manpower Requisition (MRF)

Navigate to **Raise Position** (`/positions/new`):

1. **Choose type:** New Hire or Replacement
2. **For Replacement:** A popup asks if the departed employee should be replaced (Hire) or not (No Hire). If "No Hire", a NoHireForm captures the rationale.
3. **Select MRF Template:** Auto-fills cost-centre default fields (job title, department, grade, etc.)
4. **Fill in details:**
   - Core fields: Title, department, employment type, grade, required start date
   - Supplementary: Description, responsibilities, qualifications
   - For Replacement: Departing employee name, colour code (GREEN/RED/BLACK), last working day
5. **Save as Draft** or **Submit** (sends to PENDING_APPROVAL)
6. Reviewers are auto-determined from DoA (Delegation of Authority) rules based on salary band

### 9.3. Position Lifecycle & State Machine

```
        ┌──────────────────────┐
        │       DRAFT          │◄───────────────────┐
        └──────────┬───────────┘                    │
                   │ Submit                         │ Reopen
        ┌──────────▼───────────┐                    │
        │  PENDING_APPROVAL    │                    │
        └──────────┬───────────┘                    │
              ┌────┴────┐                           │
              ▼         ▼                           │
        ┌──────────┐  ┌──────────┐                 │
        │ APPROVED  │  │ REJECTED  │────────────────┘
        └────┬─────┘  └──────────┘
             │ Post
        ┌────▼─────┐
        │  POSTED   │◄── Release Hold
        └──┬───┬───┘
           │   │ Hold
           │ ┌─▼──────────┐
           │ │  ON_HOLD    │───► (30-day max, auto-warned)
           │ └────────────┘
           │
           │ HIRED (via ATS)
        ┌──▼─────┐
        │ FILLED  │
        └────────┘

   COLLAPSED ← 180-day inactivity (auto, with day-150/170 warnings)
```

**Colour codes** (Replacement positions only):
| Code | Meaning |
|------|---------|
| 🟢 GREEN | Voluntary resignation, good standing |
| 🔴 RED | Performance-related departure |
| ⚫ BLACK | Misconduct / involuntary departure |

### 9.4. Approval Workflow

1. HM submits MRF → status becomes `PENDING_APPROVAL`
2. **Approval Skip:** If the salary falls below the configured DoA threshold, the system auto-approves (skips to `APPROVED`)
3. HR_TA reviews and either **Approves** or **Rejects**
4. A **reviewer email draft** is auto-generated (mock emails are logged to console)
5. Notifications are sent for pending approvals (daily reminder job)

### 9.5. Job Posting

After approval, HR_TA clicks **"Post"** to change status to `POSTED`. If not posted within 2 hours, a reminder notification is sent.

### 9.6. ATS — Candidate Pipeline

Access via **ATS Pipeline** (`/ats/:positionId`):

**Kanban Board View** — 8 columns:
| Stage | Description |
|-------|-------------|
| APPLIED | Initial application received |
| SCREENING | HR screening / shortlisting |
| INTERVIEW_SCHEDULED | Interview booked |
| INTERVIEW_COMPLETED | Interview done, feedback added |
| OFFER | Offer extended to candidate |
| HIRED | Candidate accepted → **auto-closes position** as FILLED |
| REJECTED | Candidate rejected |
| WITHDRAWN | Candidate withdrew |

**Actions per candidate:**
- Add candidate with name, email, source (REFERRAL, LINKEDIN, JOB_PORTAL, DIRECT, OTHER)
- Upload CV (PDF/DOC, max 10MB)
- Move between stages (drag or via menu)
- Add interview feedback (rating, notes, per-stage)
- View full candidate detail with offer details, stage history

### 9.7. Notifications

- **Bell icon** in the header shows unread count
- **Dropdown** with recent notifications
- **Full page** at `/notifications`
- **Idempotent delivery:** Each notification type uses a deduplication key — recurring jobs won't spam duplicates

**Notification types:**
| Type | Trigger |
|------|---------|
| APPROVAL_REMINDER | Daily job: pending approval > 48h |
| JOB_NOT_POSTED | Every 2h job: approved but not posted |
| POSITION_HOLD_EXPIRY | Daily: hold expiring within 3 days |
| COLLAPSE_WARNING | Daily: position idle > 150 days |
| POSITION_COLLAPSED | Daily: position auto-collapsed at 180 days |
| POSITION_APPROVED | MRF approved |
| POSITION_REJECTED | MRF rejected |
| POSITION_FILLED | Position marked as filled |

### 9.8. Background Jobs (Hangfire)

All jobs run on **MongoDB-backed Hangfire** (no separate SQL Server needed).

| Job | Schedule | Description |
|-----|----------|-------------|
| Approval Reminder | Daily (cron) | Notifies reviewers about MRFs pending > 48h |
| Job Posting Reminder | Every 2 hours | Notifies about approved positions not yet posted |
| Hold Expiry Check | Daily | Warns about positions on hold expiring within 3 days |
| Position Collapse | Daily | Auto-collapses positions idle > 180 days (warnings at day 150/170) |

**Dashboard:** View and manage jobs at **http://localhost:5000/hangfire** (open in dev; restrict in production).

### 9.9. Dashboard

Each role sees a tailored dashboard at `/`:

**Hiring Manager:**
- Open positions count, on-hold count, pending approval count
- Action-required list (positions needing attention)
- Recent positions list

**HR / Talent Acquisition:**
- Positions not yet posted (with post action)
- Candidate pipeline overview
- Pending approvals count

**Admin:**
- Positions grouped by status
- Approaching collapse list (150+ day idle)
- System overview

### 9.10. Admin Panel

Accessible only by **Admin** role. Pages:

| Page | Route | Description |
|------|-------|-------------|
| Users | `/admin/users` | Create, edit, disable/enable user accounts |
| MRF Templates | `/admin/templates` | CRUD for cost-centre MRF templates |
| Cost Centres | `/admin/cost-centres` | CRUD for organisational cost centres |
| DoA Settings | `/admin/doa` | Configure salary bands and approval thresholds |
| All Positions | `/admin/positions` | View all positions across the system |

---

## 10. API Reference

### Base URL
- Dev: `http://localhost:5000/api`
- Docker: `http://localhost/api` (proxied by Nginx)

### Authentication
All API endpoints require `Authorization: Bearer <auth0-jwt>` header.

### 10.1. Auth

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/auth/me` | Get current synchronized user profile | JWT |

### 10.2. Positions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/positions` | Create position from template | HM, TA, Admin |
| GET | `/api/positions` | List positions (filterable by status) | Any Role |
| GET | `/api/positions/:id` | Get position detail | Any Role |
| PUT | `/api/positions/:id` | Update draft position | HM, TA, Admin |
| POST | `/api/positions/:id/submit` | Submit for approval | HM, TA, Admin |
| POST | `/api/positions/:id/approve` | Approve MRF | TA, Admin |
| POST | `/api/positions/:id/reject` | Reject MRF | TA, Admin |
| POST | `/api/positions/:id/post` | Post to job board | TA, Admin |
| POST | `/api/positions/:id/hold` | Place on hold | TA, Admin |
| POST | `/api/positions/:id/release-hold` | Release from hold | TA, Admin |
| POST | `/api/positions/:id/reopen` | Reopen rejected position | HM, TA, Admin |
| POST | `/api/positions/:id/collapse` | Collapse position | Admin |
| GET | `/api/positions/:id/audit` | Get audit log | Any Role |
| PUT | `/api/positions/:id/reviewer-email` | Update reviewer email draft | TA, Admin |

### 10.3. Candidates

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/candidates` | Add candidate to position | HM, TA |
| GET | `/api/candidates/position/:positionId` | List candidates | Any Role |
| GET | `/api/candidates/:id` | Get candidate detail | Any Role |
| PUT | `/api/candidates/:id` | Update candidate info | HM, TA |
| POST | `/api/candidates/:id/stage` | Move to new stage | HM, TA |
| POST | `/api/candidates/:id/feedback` | Add interview feedback | HM, TA |
| POST | `/api/candidates/:id/upload-cv` | Upload CV (multipart) | HM, TA |
| DELETE | `/api/candidates/:id` | Remove candidate | TA, Admin |

### 10.4. Notifications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/notifications` | List notifications | Any Role |
| GET | `/api/notifications/unread-count` | Get unread count | Any Role |
| POST | `/api/notifications/:id/read` | Mark as read | Any Role |
| POST | `/api/notifications/read-all` | Mark all as read | Any Role |

### 10.5. Lookups

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/lookups/cost-centres` | All cost centres | Any Role |
| GET | `/api/lookups/doa` | Delegation of Authority entries | Any Role |

### 10.6. MRF Templates (Admin)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/mrf-templates` | List all templates | Admin |
| POST | `/api/mrf-templates` | Create template | Admin |
| PUT | `/api/mrf-templates/:id` | Update template | Admin |
| DELETE | `/api/mrf-templates/:id` | Delete template | Admin |

### 10.7. Users (Admin)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users` | List all users | Admin |
| POST | `/api/users` | Create user | Admin |
| PUT | `/api/users/:id` | Update user | Admin |
| DELETE | `/api/users/:id` | Delete user | Admin |

### 10.8. Dashboard

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard/hm` | HM dashboard data | HM |
| GET | `/api/dashboard/ta` | TA dashboard data | TA |
| GET | `/api/dashboard/admin` | Admin dashboard data | Admin |

### 10.9. Admin

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/admin/seed` | Trigger seed data | Admin |

### 10.10. Response Format

All API responses use a standard envelope:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "error": "Position not found"
}
```

---

## 11. Project Structure

```
HRMS NDBS/
├── docker-compose.yml              # Docker orchestration (Mongo + API + Nginx)
├── nginx.conf                       # Nginx config for SPA + API proxy
├── 01_PRD.md                        # Product Requirements Document
├── 02_ARCHITECTURE.md               # Architecture specification
├── 03_USER_STORIES.md               # User stories
├── 04_AI_BUILD_PROMPT.md            # AI build prompt
├── 05_FLOWS_AND_STATE_MACHINES.md   # State machine specs
├── 06_SETUP_AND_SEED.md             # Setup & seed specification
│
├── client/                          # React Frontend
│   ├── package.json
│   ├── vite.config.ts               # Vite config with API proxy
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.example
│   └── src/
│       ├── main.tsx                 # Entry point (QueryClient + Toaster)
│       ├── App.tsx                  # Routes + auth guard
│       ├── index.css                # Tailwind directives
│       ├── api/
│       │   ├── client.ts            # Axios + JWT interceptor
│       │   └── hooks.ts             # React Query hooks
│       ├── store/
│       │   └── authStore.ts         # Zustand auth state
│       ├── types/
│       │   └── index.ts            # All TypeScript types
│       ├── utils/
│       │   └── constants.ts         # Status maps, formatters
│       ├── components/
│       │   ├── ui.tsx               # Button, Card, Input, Modal, etc.
│       │   ├── StatusBadge.tsx      # Position & stage badges
│       │   ├── AuditTimeline.tsx    # Vertical timeline component
│       │   └── NotificationPanel.tsx # Bell dropdown
│       ├── layouts/
│       │   └── AppLayout.tsx        # Sidebar + header layout
│       └── features/
│           ├── auth/LoginPage.tsx
│           ├── dashboard/DashboardPage.tsx
│           ├── mrf/MRFForm.tsx
│           ├── positions/
│           │   ├── RaisePositionPage.tsx
│           │   ├── PositionsListPage.tsx
│           │   ├── PositionDetailPage.tsx
│           │   └── PositionEditPage.tsx
│           ├── ats/
│           │   ├── CandidatePipelinePage.tsx
│           │   └── CandidateDetailPage.tsx
│           ├── notifications/NotificationsPage.tsx
│           └── admin/AdminPages.tsx
│
└── server/
    └── HRMS.API/                    # .NET 9 Backend
        ├── HRMS.API.csproj
        ├── Dockerfile
        ├── Program.cs               # DI, auth, middleware, pipeline
        ├── appsettings.json         # Base config
        ├── appsettings.Development.json
        ├── appsettings.Production.json
        ├── Configuration/
        │   └── AppSettings.cs       # AuthSettings, HrmsClaims constants
        ├── Models/
        │   ├── User.cs
        │   ├── Position.cs          # Position + Status enum + OnHoldInfo
        │   ├── Candidate.cs         # Candidate + Stage enum + Feedback
        │   └── Misc.cs              # MrfTemplate, CostCentre, DoA, Notification
        ├── DTOs/
        │   └── Dtos.cs              # Request/Response DTOs
        ├── Common/
        │   └── ApiResult.cs         # Standard response envelope
        ├── Repositories/
        │   ├── MongoDbContext.cs     # 7 collections + indexes
        │   └── Repositories.cs       # All 7 repo interfaces + impls
        ├── Services/
        │   ├── AuthService.cs        # Local JWT + Auth0-ready
        │   ├── PositionService.cs    # Full state machine
        │   ├── CandidateService.cs   # Pipeline + auto-fill
        │   ├── DashboardService.cs   # Role-gated aggregations
        │   ├── NotificationService.cs # In-app + mock email
        │   ├── SeedService.cs        # Idempotent data seed
        │   ├── FileStorageService.cs # Local filesystem
        │   └── CurrentUserService.cs  # Extract user from JWT
        ├── Jobs/
        │   └── BackgroundJobs.cs     # 4 Hangfire recurring jobs
        ├── Middleware/
        │   └── ErrorHandlingMiddleware.cs
        └── Controllers/
            ├── AuthController.cs
            ├── PositionsController.cs
            ├── CandidatesController.cs
            ├── NotificationsController.cs
            ├── DashboardController.cs
            ├── LookupsController.cs
            ├── MrfTemplatesController.cs
            ├── UsersController.cs
            └── AdminController.cs
```

---

## 12. Troubleshooting

### API won't start — MongoDB connection refused
**Cause:** MongoDB not running or wrong connection string.  
**Fix:** Ensure MongoDB is accessible at the configured `ConnectionString`. In Docker, verify the `mongo` container is healthy: `docker compose ps`.

### Login fails with 401
**Cause:** Incorrect credentials or seed data not loaded.  
**Fix:** Check API logs for seed errors. Re-trigger seed: `POST /api/admin/seed`.

### Frontend shows blank page or 404 on refresh
**Cause:** SPA routing not configured.  
**Fix:** In Docker, nginx.conf handles this with `try_files`. In local dev, Vite handles it automatically. If using a custom web server, configure it to serve `index.html` for all non-file routes.

### CORS errors in browser
**Cause:** Frontend origin not in CORS whitelist.  
**Fix:** Add your frontend URL to `Cors.Origin` in appsettings (comma-separated for multiple).

### "Token expired" immediately after login
**Cause:** Clock skew between client and server.  
**Fix:** Ensure system clocks are synchronized, or increase `AccessTokenMinutes`.

### Hangfire dashboard shows no jobs
**Cause:** Hangfire DB not connected or recurring jobs failed to register.  
**Fix:** Check `Hangfire.MongoConnectionString` config. Jobs register on startup — check API logs for errors.

### Docker build fails — "sdk not found"
**Cause:** Docker image not pulled.  
**Fix:** `docker compose pull` or ensure Docker can access `mcr.microsoft.com/dotnet/sdk:9.0`.

### npm install errors
**Cause:** Corrupted node_modules.  
**Fix:** `rm -rf node_modules package-lock.json && npm install`.

---

## 13. Future Enhancements

| Feature | Notes |
|---------|-------|
| **Auth0 integration** | Config switch already built — set `Auth:Mode=Auth0` and fill domain/audience |
| **Email notifications** | Swap `Notification.EmailProvider` from `mock` to `smtp` and implement `IEmailService` |
| **Azure Blob Storage** | Set `FileStorage.Type=azure-blob` and implement `AzureBlobStorageService` |
| **Role-based Hangfire dashboard** | Add `IDashboardAuthorizationFilter` to restrict access |
| **Reporting & Analytics** | Export position fill times, pipeline conversion rates |
| **Multi-language support** | i18n framework for the frontend |
| **Audit trail UI** | Dedicated admin page for full audit history |
| **Resume parsing** | AI-powered CV data extraction |
| **Calendar integration** | Interview scheduling with calendar invites |
| **Mobile responsive improvements** | Optimize kanban and tables for smaller screens |
