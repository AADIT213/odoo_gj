# 🌍 EcoSphere – Enterprise ESG Management Platform

> **Empowering organizations to achieve sustainable growth through intelligent Environmental, Social, and Governance (ESG) management.**

EcoSphere is a full-stack enterprise ESG management platform designed to help organizations monitor, manage, and improve their Environmental, Social, and Governance initiatives. The platform combines analytics, role-based workflows, gamification, and AI-powered recommendations to create a modern sustainability management ecosystem.

---

# 🚀 Features

## 🔐 Authentication & Security
- JWT Authentication
- Role-Based Access Control (RBAC)
- Protected Routes
- Secure API Access
- Password Hashing

### Supported Roles
- Super Admin
- ESG Manager
- Department Head
- Employee

---

# 📊 Executive Dashboard

A centralized dashboard providing real-time ESG insights.

### Dashboard Includes

- ESG KPI Cards
- Organization ESG Score
- Department Rankings
- Carbon Emission Trends
- Sustainability Progress
- CSR Analytics
- Governance Compliance
- Activity Timeline
- Notifications
- AI Insights

---

# 🌱 Environmental Module

Track and improve environmental sustainability.

### Features

- Carbon Transaction Management
- Emission Tracking
- Sustainability Goals
- Carbon Footprint Analytics
- Historical Trend Analysis
- Environmental Score Calculation

---

# 🤝 Social Module

Manage employee engagement and CSR initiatives.

### Features

- CSR Activity Management
- Employee Participation
- Volunteer Tracking
- Diversity Metrics
- Employee Engagement Dashboard

---

# 🏛 Governance Module

Monitor organizational compliance.

### Features

- Policy Management
- Policy Acknowledgements
- Compliance Tracking
- Audit Management
- Governance Analytics

---

# 🎮 Gamification

Increase employee participation using rewards.

### Features

- ESG Challenges
- XP System
- Badges
- Rewards
- Leaderboards
- Achievement Tracking

---

# 📈 ESG Scoring Engine

Automatically calculates organization-wide ESG performance.

### Calculates

- Environmental Score
- Social Score
- Governance Score
- Department Score
- Organization Score

---

# 📑 Reports & Analytics

Generate business-ready reports.

### Reports

- Environmental Report
- Social Report
- Governance Report
- ESG Summary
- Department Performance

### Export Formats

- PDF
- Excel
- CSV

---

# 🔔 Notifications

Real-time updates across the platform.

Examples:

- Challenge Completed
- Badge Earned
- Compliance Alerts
- Policy Reminders
- CSR Approvals

---

# 🤖 AI Sustainability Advisor

AI-powered recommendation engine providing actionable sustainability insights.

Capabilities include:

- ESG Recommendations
- Sustainability Suggestions
- Carbon Reduction Insights
- Executive ESG Summary
- Department Performance Recommendations

---

# 🏗 System Architecture

```
                React + TypeScript
                       │
                       │
                 React Query
                       │
                     Axios
                       │
                 FastAPI Backend
                       │
                  SQLAlchemy ORM
                       │
                  PostgreSQL
```

---

# 🛠 Tech Stack

## Frontend

- React 18
- TypeScript
- Vite
- TailwindCSS
- ShadCN UI
- Framer Motion
- React Query
- Axios
- Recharts

## Backend

- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT Authentication
- Passlib
- Pydantic

---

# 📁 Project Structure

```
EcoSphere/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── crud/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   │
│   ├── requirements.txt
│   └── seed.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── main.tsx
│   │
│   ├── package.json
│   └── vite.config.ts
│
└── TESTING.md
```

---

# ⚙ Installation

## Backend

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt

alembic upgrade head

python seed.py

uvicorn app.main:app --reload
```

Backend runs at

```
http://localhost:8000
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend runs at

```
http://localhost:5173
```

---

# 👥 Default Users

| Role | Email |
|------|-------|
| Super Admin | admin@ecosphere.com |
| ESG Manager | manager@ecosphere.com |
| Department Head | dept_head@ecosphere.com |
| Employee | employee@ecosphere.com |

---

# 🔄 Workflow

```
Login
      │
      ▼
Dashboard
      │
      ▼
Manage Departments
      │
      ▼
Environmental Tracking
      │
      ▼
CSR Activities
      │
      ▼
Governance Compliance
      │
      ▼
Gamification
      │
      ▼
ESG Score Updates
      │
      ▼
Reports & Analytics
      │
      ▼
AI Sustainability Advisor
```

---

# ✨ Highlights

- Enterprise-grade architecture
- Modern responsive UI
- Secure JWT authentication
- Role-Based Access Control
- Real-time analytics
- AI-powered sustainability insights
- Interactive dashboards
- Gamification system
- ESG scoring engine
- PostgreSQL-backed persistence

---

# 📚 Documentation

Additional setup, testing, API verification, and workflow documentation is available in:

```
TESTING.md
```

---

# 👨‍💻 Team

Developed as part of the **Odoo Hackathon**.

---

# 📄 License

This project is developed for educational and hackathon purposes.
