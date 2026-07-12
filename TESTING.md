# EcoSphere Enterprise ESG Management Platform - Testing Guide

Welcome to the comprehensive testing and verification guide for the EcoSphere ESG Platform. This document provides step-by-step instructions to set up, start, and manually QA all modules to ensure production readiness.

## 1. Installation & Setup

### Requirements
- Node.js (v18+)
- Python (v3.9+)
- PostgreSQL (v14+)

### Database Setup
Ensure PostgreSQL is running. Create the database:
```bash
createdb ecosphere
```

### Backend Startup
1. Navigate to the backend directory:
```bash
cd backend
```
2. Create and activate a virtual environment:
```bash
python -m venv venv
.\venv\Scripts\activate
```
3. Install dependencies:
```bash
pip install -r requirements.txt
```
4. Run Alembic migrations to set up the database schema:
```bash
alembic upgrade head
```
5. Seed the database (creates default roles, users, and emission factors):
```bash
python scripts/seed_db.py
```
6. Start the FastAPI backend:
```bash
uvicorn app.main:app --reload --port 8000
```
> The API will be available at `http://localhost:8000/api/v1`

### Frontend Startup
1. Navigate to the frontend directory in a new terminal:
```bash
cd frontend
```
2. Install dependencies:
```bash
npm install
```
3. Start the Vite development server:
```bash
npm run dev
```
> The application will be available at `http://localhost:5173`

---

## 2. Default Login Credentials (Seed Data)

The following users are created automatically when running `seed_db.py`.

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@ecosphere.com` | `admin123` |
| **ESG Manager** | `manager@ecosphere.com` | `manager123` |
| **Department Head** | `dept_head@ecosphere.com` | `head123` |
| **Employee** | `employee@ecosphere.com` | `emp123` |

---

## 3. Business Workflow Walkthroughs (QA Checklist)

### A. Authentication & RBAC
- [ ] **Login**: Use the Employee credentials to log in. Verify successful redirection to the Dashboard.
- [ ] **RBAC**: As an Employee, attempt to navigate to `/departments` or `/governance`. You should be gracefully denied access if the roles restrict it.
- [ ] **Logout**: Click the logout button and verify the JWT is cleared and you are redirected to `/login`.

### B. Environmental Tracking
- [ ] Log in as **Department Head**.
- [ ] Navigate to **Environmental**.
- [ ] Click "Log Data" and submit a new resource log (e.g., 500 kWh electricity, 200 L water).
- [ ] Verify the Carbon Footprint Breakdown chart immediately updates (React Query refetches data).
- [ ] Navigate to the **Dashboard** and verify the total Environmental Score recalculates.

### C. Social & Gamification (CSR)
- [ ] Log in as **Employee**.
- [ ] Navigate to **Social**.
- [ ] Log CSR Volunteer Hours for a community event.
- [ ] Navigate to **Gamification**.
- [ ] Verify XP has increased based on the backend gamification engine.
- [ ] Verify position on the **Global Leaderboard**.

### D. Governance & Audits
- [ ] Log in as **ESG Manager**.
- [ ] Navigate to **Governance**.
- [ ] View pending audits and policy acknowledgements.
- [ ] Approve an active compliance issue and verify the status changes from `Pending` to `Resolved`.

### E. AI Sustainability Advisor
- [ ] Navigate to **AI Advisor**.
- [ ] Submit a question (e.g., "How can we reduce our Scope 2 emissions?").
- [ ] Verify the FastAPI backend returns the AI-generated insight and it is rendered gracefully.

### F. Reports Export
- [ ] Navigate to **Reports**.
- [ ] Select a date range and department.
- [ ] Click **Download Report**. Verify the CSV/PDF exports successfully.

---

## 4. API Verification Checklist

Using tools like Postman or Swagger UI (`http://localhost:8000/docs`), verify the following REST endpoints:

- **Auth**:
  - `POST /api/v1/auth/login/access-token`
  - `POST /api/v1/auth/test-token`
- **Analytics**:
  - `GET /api/v1/analytics/organization-score`
  - `GET /api/v1/analytics/historical-trend`
- **Environmental**:
  - `GET /api/v1/environmental/`
  - `POST /api/v1/environmental/`
- **Gamification**:
  - `GET /api/v1/gamification/me`
  - `GET /api/v1/gamification/leaderboard`

## 5. Known Assumptions
- Database uses PostgreSQL. SQLite will not work due to specific JSONB and array fields.
- The `python-jose` library requires cryptography bindings which may require build tools on some platforms if a wheel is not available.
- Gamification XP is allocated statically per activity in the prototype. In production, this can be dynamically weighted.
