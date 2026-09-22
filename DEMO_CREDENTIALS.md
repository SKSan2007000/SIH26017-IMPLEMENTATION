# LandGuard AI — Demonstration Credentials

> **IMPORTANT**: Demo credentials — change before production deployment.
>
> This platform uses real backend JWT authentication and role-based access control (RBAC). Passwords are securely hashed with bcrypt.

---

## Default Administrator Account

| Field | Value |
| :--- | :--- |
| **Email** | `admin@landguard.ai` |
| **Password** | `LandGuard@2026` |
| **Role** | `SUPER_ADMIN` |
| **Full Name** | LandGuard System Administrator |
| **Department / District** | Central Administration |
| **Landing Interface** | `/admin` |

---

## Role-Based Demo Accounts

All demo accounts share the password: **`LandGuard@2026`**

| Role | Email (`.ai` / `.gov.in`) | Name | Designation | Landing Route |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@landguard.ai` | System Administrator | Super Administrator | `/admin` |
| **Project Head** | `head@landguard.ai` | Dr. A. Sundaram (DEMO) | Project Director — National Corridors | `/dashboard/project-head` |
| **District Officer** | `district@landguard.ai` | M. K. Revathi IAS (DEMO) | District Collector — Chennai | `/dashboard/district` |
| **Land Acquisition Officer** | `lao@landguard.ai` | K. Rajagopal (DEMO) | Special LAO — Corridor Division | `/dashboard/land-acquisition` |
| **Field Officer** | `field@landguard.ai` | R. Vignesh (DEMO) | Senior Field Surveyor | `/dashboard/field` |
| **Supervisor** | `supervisor@landguard.ai` | P. Ananthi (DEMO) | Cadastral Verification Supervisor | `/dashboard/supervisor` |
| **Citizen** | `citizen@landguard.ai` | DEMO Citizen User | Land Owner Representative | `/portal/citizen` |
| **Contractor** | `contractor@landguard.ai` | DEMO Infra Consortium | EPC Highway Contractor | `/portal/contractor` |

---

## Quick Testing Flow

1. Open `http://localhost:3000`
2. Watch the 3-second animated LandGuard AI intro sequence (or click **Skip Intro** in the top corner).
3. On `/signin`, enter `admin@landguard.ai` and `LandGuard@2026`.
4. Click **Sign In** → Access the Super Admin Control Center at `/admin`.
5. Use the Admin User Management panel to create a new user with any role, and log in with that account immediately.
