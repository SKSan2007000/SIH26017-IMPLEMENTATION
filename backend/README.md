# LandGuard AI — Backend & Predictive ML Intelligence Engine

**SIH26017 — Predictive Analytics System for Early Detection of Land Acquisition Delays**

Phase 3 Machine Learning Predictive Analytics Engine and FastAPI Backend for LandGuard AI. Delivers calibrated delay probability predictions, 0–100 normalized risk scoring, categorical risk categorization (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), expected delay duration regression in months/days, Explainable AI (XAI) feature attribution, dynamic AI recommendations, route-wise multi-criteria risk alignment comparison (Routes A/B/C/D), what-if policy intervention simulations, and database persistence.

---

## 1. System Architecture & Directory Layout

```
backend/
├── app/
│   ├── main.py                   # FastAPI application & startup lifecycle
│   ├── core/
│   │   ├── config.py             # App configuration & environment settings
│   │   └── security.py           # JWT generation, password hashing & RBAC
│   ├── db/
│   │   ├── database.py           # SQLAlchemy session & Base engine
│   │   ├── seed.py               # 10 projects, 40 routes, 130+ parcels & stakeholders seed
│   │   └── models/
│   │       ├── risk.py           # RiskPrediction & RiskFactor database models
│   │       ├── project.py        # Infrastructure Project entity
│   │       ├── route.py          # Route Alignment entity
│   │       ├── parcel.py         # Cadastral Parcel entity
│   │       ├── stakeholder.py    # Landowner / Stakeholder entity
│   │       ├── document.py       # Legal & Survey Document entity
│   │       ├── field_verification.py # On-ground GPS verification task
│   │       ├── citizen_report.py # Grievance report entity
│   │       ├── notification.py   # System notice entity
│   │       ├── user.py           # RBAC User entity
│   │       └── audit.py          # Immutable Audit Log entity
│   ├── ml/                       # Phase 3 Machine Learning Engine
│   │   ├── __init__.py
│   │   ├── dataset.py            # 12,000+ synthetic correlated case generator
│   │   ├── preprocess.py         # Data preprocessing, imputation & scaling pipeline
│   │   ├── train.py              # ML training, model evaluation & serialization
│   │   ├── predict.py            # Production inference engine (delay prob, risk score, delay duration)
│   │   ├── explain.py            # Explainable AI (XAI) feature attribution & percentage drivers
│   │   ├── recommend.py          # AI Actionable Recommendation engine
│   │   ├── simulate.py           # What-If policy simulation engine
│   │   └── route_eval.py         # Route-wise multi-criteria evaluation engine
│   ├── schemas/
│   │   ├── ml.py                 # Pydantic schemas for ML predict, info, train
│   │   ├── risk.py               # Risk schemas
│   │   └── ...
│   ├── services/
│   │   ├── risk_service.py       # Live DB feature extraction & ML inference bridge
│   │   ├── spatial_service.py    # Spatial corridor buffer & parcel intersection
│   │   └── audit_service.py      # Audit trail logging
│   └── api/
│       ├── deps.py
│       └── routes/
│           ├── ml.py             # ML API routes (/ml/predict, /ml/model-info, /ml/simulate)
│           ├── risk.py           # Project risk (/projects/{id}/risk, explain, recalculate, what-if)
│           ├── routes.py         # Route alignments & route evaluation (/projects/{id}/routes/evaluate)
│           └── ...
├── data/
│   └── historical_land_acquisitions.csv  # 12,000-record correlated historical dataset
├── ml/
│   └── models/                   # Serialized ML artifacts
│       ├── classifier.joblib     # Trained RandomForestClassifier
│       ├── regressor.joblib      # Trained RandomForestRegressor
│       ├── preprocessor.joblib   # Fitted ColumnTransformer pipeline
│       ├── metrics.json          # Complete validation metrics & feature importances
│       └── feature_names.json    # Transformed feature column mapping
├── scripts/
│   ├── generate_dataset.py       # CLI dataset generation tool
│   ├── train_models.py           # CLI model training & evaluation tool
│   ├── test_ml_suite.py          # 24 automated Phase 3 ML tests
│   └── test_api.py               # 20 Phase 2 backend verification tests
├── tests/
│   └── test_ml_engine.py         # Pytest verification suite
└── requirements.txt
```

---

## 2. Machine Learning Predictive Engine

### A. Synthetic Historical Dataset Generation (`backend/app/ml/dataset.py`)
- **Dataset Size**: 12,000 simulated land acquisition cases modeled on Indian infrastructure acquisition patterns (NHAI / LARR 2013).
- **Correlated Variables**:
  - **Project Features**: `project_type`, `land_area_acres`, `affected_families`, `affected_parcels`, `project_complexity`, `district`, `state`, `historical_performance_score`.
  - **Acquisition Features**: `compensation_completion_pct`, `approval_completion_pct`, `documentation_completion_pct`, `possession_pct`, `rehabilitation_progress_pct`, `stakeholder_response_rate`.
  - **Risk Features**: `legal_disputes_count`, `disputed_parcels_count`, `pending_approvals_count`, `incomplete_documents_count`, `unresolved_grievances_count`, `administrative_bottlenecks_score`, `field_verification_delay_days`.
  - **Time Features**: `planned_duration_months`, `elapsed_duration_months`, `avg_approval_time_days`, `avg_verification_time_days`, `avg_stakeholder_response_days`.
  - **Route Features**: `route_affected_parcel_count`, `route_land_area_acres`, `route_affected_households`, `route_complexity_score`, `route_legal_dispute_exposure`, `estimated_acquisition_cost_cr`.
- **Targets**:
  - `delayed` (0 or 1 binary classification target, base positive rate ~42%).
  - `actual_delay_months` (continuous regression target, 0.0 to 18.0 months).
  - `actual_delay_days` (`actual_delay_months * 30.0`).

### B. Preprocessing Pipeline (`backend/app/ml/preprocess.py`)
- **Numerical Features (29)**: `SimpleImputer(strategy='median')` followed by `StandardScaler()`.
- **Categorical Features (3)**: `SimpleImputer(strategy='most_frequent')` followed by `OneHotEncoder(handle_unknown='ignore')`.
- Zero data leakage: Pipeline is fitted strictly on the 80% training split and transformed on the 20% test split.

### C. Model Architecture & Evaluation Metrics (`backend/app/ml/train.py`)
- **Classifier**: `RandomForestClassifier(n_estimators=100, max_depth=12, min_samples_split=5, random_state=42)`
  - **Accuracy**: **95.63%**
  - **Precision**: **94.84%**
  - **Recall**: **94.74%**
  - **F1 Score**: **0.9479**
  - **ROC-AUC**: **0.9935**
- **Regressor**: `RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42)`
  - **Mean Absolute Error (MAE)**: **0.8043 months** (~24 days)
  - **Root Mean Squared Error (RMSE)**: **1.4343 months**
  - **R² Score**: **0.8665 (86.7% variance explained)**

---

## 3. Risk Scoring & Categorization Formula

The system derives a normalized risk score on a 0–100 scale from the calibrated model probability:
$$\text{Risk Score} = \text{round}(\text{delay\_probability} \times 100)$$

### Risk Categories (Official SIH26017 Standards):
| Risk Score | Risk Category | Risk Band | Trend Status | Typical Action Required |
|---|---|---|---|---|
| **0 – 24** | `LOW` | `low` (Green `#4fbf7c`) | Stable | Routine monitoring |
| **25 – 49** | `MEDIUM` | `medium` (Yellow `#e8d15c`) | Moderate | Expedite documentation & survey |
| **50 – 74** | `HIGH` | `high` (Orange `#f0a742`) | Elevated | Senior officer intervention |
| **75 – 100** | `CRITICAL` | `critical` (Red `#ef5b5b`) | Escalating | Immediate SLAC & RDO special sitting |

---

## 4. Explainable AI (XAI) & Dynamic Recommendations

### A. Explainable Feature Attribution (`backend/app/ml/explain.py`)
Provides per-prediction mathematical attribution across 5 core risk categories:
- **Legal Disputes** (Cadastral title conflicts, disputed survey plots)
- **Pending Statutory Approvals** (Forest NOC, canal clearances, SLAC permissions)
- **Compensation Progress** (Award determination and escrow disbursals)
- **Documentation Completion** (Encumbrance certificates, 15-year chain of title)
- **Stakeholder Friction** (Notice acknowledgment response latency)

Returns ranked drivers with contribution badges (e.g. `Cadastral Title Disputes (+32%)`, `Pending Statutory Approvals (+24%)`).

### B. Actionable Recommendations (`backend/app/ml/recommend.py`)
Generates targeted corrective measures based on active bottlenecks:
- **Disputes**: *"Convene Special Revenue Divisional Officer (RDO) sittings for accelerated title deed dispute settlement."*
- **Documentation**: *"Initiate automated cadastral OCR processing to resolve pending survey discrepancies."*
- **Compensation**: *"Fast-track Section 19/23 compensation awards and initiate Direct Benefit Transfer (DBT)."*
- **Approvals**: *"Elevate pending inter-departmental clearances to State Land Acquisition Committee (SLAC)."*
- **Stakeholders**: *"Deploy village-level field officers for in-person Section 11(1) notice explanation."*

---

## 5. Route-Wise Multi-Criteria Optimization (`backend/app/ml/route_eval.py`)

For candidate corridor alignments (Route A, Route B, Route C, Route D), the AI evaluates:
1. Route-specific delay probability and expected delay duration using the ML model.
2. Multi-criteria composite objective score (0–100, Higher = Better):
   - **Delay Risk Inversion (40%)**: Lower delay probability yields higher score.
   - **Cost Efficiency (25%)**: Lower estimated acquisition cost yields higher score.
   - **Land Impact (20%)**: Fewer affected parcels and lower land area yields higher score.
   - **Stakeholder Ease (15%)**: Fewer affected households yields higher score.
3. Automatically designates `aiRecommended = true` for the route with the highest overall score.

---

## 6. What-If Policy Simulation Engine (`backend/app/ml/simulate.py`)

Allows project directors to test policy interventions interactively:
- `resolve_disputes`: Simulates fast-track mediation (disputed parcels = 0).
- `resolve_documents`: Simulates automated OCR (doc completion = 98%).
- `more_field_officers`: Simulates dedicated survey units (field verification delay = 4 days).
- `more_verification_capacity`: Simulates single-window statutory clearances (bottlenecks score = 15).
- `alternate_route`: Simulates AI corridor optimization (compensation = 95%).

Computes simulated risk score, delay probability, expected delay, and saved timeline months **without altering the live database**.

---

## 7. Continuous Learning & Retraining Workflow

When new infrastructure projects reach completion:
```
New Completed Acquisition Cases
              ↓
Automated Data Validation & Schema Enforcement
              ↓
Training Dataset Augmentation (`backend/data/`)
              ↓
Model Retraining (`python -m backend.app.ml.train`)
              ↓
Validation Threshold Check (Accuracy > 90%, ROC-AUC > 0.95, MAE < 1.5 mo)
              ↓
Artifact Serialization (`backend/ml/models/`)
              ↓
Zero-Downtime Hot Reload in FastAPI Cache
```

---

## 8. Running the Backend & Verification Tests

### 1. Run Complete 24-Test ML Verification Suite:
```bash
python backend/scripts/test_ml_suite.py
```
Or via pytest:
```bash
python -m pytest backend/tests/test_ml_engine.py
```

### 2. Run 20-Test Backend API Regression Suite:
```bash
python backend/scripts/test_api.py
```

### 3. Start the Backend API Server:
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 9. API Reference Summary

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | System health check |
| `GET` | `/api/v1/projects/{id}/risk` | ML delay probability, risk score, category, expected delay, drivers & recommendations |
| `GET` | `/api/v1/projects/{id}/risk/factors` | Ranked contributing factors with mitigations |
| `GET` | `/api/v1/projects/{id}/risk/drivers` | Top explainable AI delay drivers |
| `GET` | `/api/v1/projects/{id}/risk/explain` | Full XAI breakdown and decision support statement |
| `POST` | `/api/v1/projects/{id}/risk/recalculate` | Triggers live ML re-evaluation and persists to database |
| `POST` | `/api/v1/projects/{id}/what-if` | Runs What-If policy lever simulation |
| `POST` | `/api/v1/projects/{id}/routes/evaluate` | Evaluates candidate routes (A/B/C/D) and ranks by AI score |
| `POST` | `/api/v1/ml/predict` | Direct feature-based inference endpoint |
| `GET` | `/api/v1/ml/model-info` | Returns model version, training timestamp, evaluation metrics, and feature importances |
| `POST` | `/api/v1/ml/train` | Triggers retraining pipeline |
| `POST` | `/api/v1/ml/simulate` | Standalone feature simulation endpoint |
