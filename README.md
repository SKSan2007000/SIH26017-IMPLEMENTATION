# LandGuard AI (SIH26017)

**Predictive Analytics System for Early Detection of Land Acquisition Delays**

LandGuard AI is an enterprise-grade AI decision-support platform that combines 2D/3D GIS, route planning, machine learning risk engines, field verification with GPS and photo evidence, contractor tracking, and role-based access control to detect and mitigate infrastructure acquisition delays early.

---

## Architecture Overview

LandGuard AI is engineered with a completely decoupled full-stack architecture:

```text
LANDGUARD/
├── frontend/               → Deployed to Vercel (Next.js 14 App Router, React 18, MapLibre GL, CesiumJS)
├── backend/                → Deployed to Railway (FastAPI, SQLAlchemy, Scikit-Learn ML Models)
├── start_all.bat           → One-click local full-stack launcher
├── package.json            → Root script runner
├── README.md               → Comprehensive deployment & system documentation
└── .gitignore              → Production git hygiene
```

---

## Production Deployment Guide

### 1. Backend Deployment (Railway)

1. **Create a New Project on Railway**:
   - Link your GitHub repository.
   - Set the **Root Directory** to `backend`.
2. **Environment Variables**:
   Add the following variables in the Railway dashboard:
   - `PORT`: `8000` (or leave default auto-assigned `$PORT`)
   - `DATABASE_URL`: Your PostgreSQL connection string (or use default SQLite for instant portability)
   - `SECRET_KEY`: A strong JWT signing key (e.g. `landguard-super-secret-key-2026`)
   - `ALGORITHM`: `HS256`
   - `FRONTEND_URL`: Your Vercel frontend URL (e.g. `https://landguard.vercel.app`)
   - `BACKEND_CORS_ORIGINS`: `https://landguard.vercel.app,http://localhost:3000`
3. **Start Command**:
   Railway automatically detects `backend/railway.json` and `backend/Procfile`:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
4. **Health Check Endpoint**:
   - Path: `/health`
   - Response: `{"status": "ok", "service": "LandGuard API"}`
5. **Interactive Swagger Docs**:
   - Path: `/docs`

---

### 2. Frontend Deployment (Vercel)

1. **Import Repository into Vercel**:
   - Link your GitHub repository.
   - Set the **Root Directory** to `frontend`.
   - Framework Preset: **Next.js**.
2. **Environment Variables**:
   Add the following variable in Vercel settings:
   - `NEXT_PUBLIC_API_URL`: `https://<your-backend>.up.railway.app`
   - `NEXT_PUBLIC_API_BASE_URL`: `https://<your-backend>.up.railway.app`
3. **Build Settings**:
   - Build Command: `npm run build` (runs prebuild Cesium asset copy + Next.js build)
   - Output Directory: `.next`
   - Install Command: `npm install`
4. **Deploy**:
   - Click **Deploy**. Vercel will build all 34 routes statically and handle client-side routing.

---

## Local Development Setup

### Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **Python**: 3.10+ (tested on Python 3.12)

### Quick Start (Windows Launcher)
Simply double click `start_all.bat` or run:
```cmd
start_all.bat
```
This launches:
- FastAPI backend on `http://127.0.0.1:8000`
- Next.js frontend on `http://localhost:3000`
- Opens `http://localhost:3000/signin` in your default browser

### Manual Launch

**Backend**:
```bash
cd backend
python -m venv .venv
# On Windows: .venv\Scripts\activate
# On Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

---

## Demo Credentials & RBAC Roles

| Role | Email | Password | Access / Dashboard |
| :--- | :--- | :--- | :--- |
| **Super Admin / Project Head** | `admin@landguard.ai` | `LandGuard@2026` | Full system control, analytics, approvals, user management |
| **District Collector** | `collector.pune@landguard.ai` | `LandGuard@2026` | District-wide approvals, compensation & 3D twin review |
| **Land Acquisition Officer** | `officer.sharma@landguard.ai` | `LandGuard@2026` | Case management, parcel tracking, route alternatives |
| **Field Verification Officer** | `field.patil@landguard.ai` | `LandGuard@2026` | GPS verification, photo & document evidence upload |
| **Supervisor** | `supervisor.deshmukh@landguard.ai` | `LandGuard@2026` | Task review, evidence approval, escalation management |
| **Contractor / Partner** | `contractor.infra@landguard.ai` | `LandGuard@2026` | Milestone tracking, handover logs, issue reporting |
| **Citizen / Landowner** | `citizen.kulkarni@landguard.ai` | `LandGuard@2026` | Grievances, compensation status, land parcel tracking |

---

## Key Features & Capabilities

- **2D GIS & 3D Digital Twin**: MapLibre GL and CesiumJS geospatial visualization of project alignments, parcel boundaries, forest/water intersections, and terrain.
- **Machine Learning Predictive Risk Engine**: Scikit-Learn classifier and regressor predicting acquisition delay probability, expected timeline extension, and XAI feature importance.
- **Closed-Loop Workflow**: Predict → Alert → Assign Field Verification → Upload Evidence → Recalculate Risk → Track Remediation.
- **What-If Scenario Simulation**: Real-time policy lever evaluation (fast-track compensation, community liaison, dispute arbitration) predicting risk score reductions.
- **Evidence Management**: Photo attachments, GPS geotagging, document verification, and immutable audit logs.
