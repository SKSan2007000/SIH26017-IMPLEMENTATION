# LandGuard AI

**SIH26017 — Predictive Analytics System for Early Detection of Land Acquisition Delays**

LandGuard AI is an AI-powered land-acquisition decision-support system that combines GIS, route planning, predictive risk analysis, field verification, contractor workflows, evidence uploads, and role-based project management to identify and address potential acquisition delays early.

> **Prototype:** The system uses fictional/demo data for demonstration. No real government land records, Aadhaar data, or real property-ownership data are used.

## Tech Stack

- Next.js + React + TypeScript
- FastAPI + Python
- MapLibre GL JS — 2D GIS
- CesiumJS — 3D Digital Twin
- PostgreSQL + PostGIS
- Zustand
- Framer Motion

## Implemented Features

- Command Center
- Project Management
- Route Planning & Alternative Comparison
- 2D GIS Parcel & Impact Analysis
- 3D Digital Twin
- AI Delay Risk Prediction
- Stage-Wise Risk Analysis
- Explainable Risk Drivers
- What-If Risk Simulation
- Field Officer Dashboard
- Field Verification
- GPS / Visit Tracking
- Evidence & Photograph Upload
- Contractor Dashboard
- Contractor Work Tracking
- Officer Performance & Incentive Tracking
- Citizen Reports
- Notifications
- Analytics
- Documents & Evidence Management
- Audit Trail
- Role-Based Access Control

## Core Workflow

Project Creation
↓
GIS & Parcel Analysis
↓
Route Alternatives
↓
AI Delay Risk Prediction
↓
Risk Prioritization
↓
Intervention Planning
↓
Field Verification
↓
Evidence Upload & Case Update
↓
Risk Recalculation
↓
Continuous Monitoring

## Role-Based Workflow

- **Admin / Project Head** — project monitoring, approvals, reports and decision support
- **Acquisition Officer** — acquisition cases, stakeholders and coordination
- **Field Officer** — assigned cases, field visits, GPS tracking and evidence uploads
- **Supervisor** — verification review, monitoring and escalation
- **Contractor** — assigned work, progress tracking and project updates
- **Citizen / Landowner** — reports, requests and project communication

## AI Components

- Acquisition Delay Prediction
- Stage-Wise Risk Assessment
- Explainable Risk Analysis
- Risk Prioritization
- What-If Intervention Simulation
- Continuous Risk Recalculation

> AI outputs provide decision support. Final decisions remain with authorized human authorities.

## System Architecture

```text
Next.js + React + TypeScript
            ↓
      FastAPI REST API
            ↓
   Python Risk / AI Services
            ↓
     PostgreSQL + PostGIS
            ↓
 GIS / Workflow / Verification
