from fastapi import APIRouter
from backend.app.api.routes.auth import router as auth_router
from backend.app.api.routes.projects import router as projects_router
from backend.app.api.routes.routes import router as routes_router
from backend.app.api.routes.parcels import router as parcels_router
from backend.app.api.routes.stakeholders import router as stakeholders_router
from backend.app.api.routes.documents import router as documents_router
from backend.app.api.routes.notifications import router as notifications_router
from backend.app.api.routes.field_verifications import router as field_router
from backend.app.api.routes.citizen_reports import router as citizen_router
from backend.app.api.routes.risk import router as risk_router
from backend.app.api.routes.ml import router as ml_router
from backend.app.api.routes.audit import router as audit_router
from backend.app.api.routes.workflow import router as workflow_router
from backend.app.api.routes.operations import router as operations_router
from backend.app.api.routes.contractors import router as contractors_router
from backend.app.api.routes.designs import router as designs_router
from backend.app.api.routes.portfolio import router as portfolio_router
from backend.app.api.routes.gis import router as gis_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication & RBAC"])
api_router.include_router(projects_router, prefix="/projects", tags=["Infrastructure Projects"])
api_router.include_router(gis_router, prefix="", tags=["GIS & Cadastral Geospatial"])
api_router.include_router(routes_router, prefix="", tags=["Route Alignments"])
api_router.include_router(parcels_router, prefix="", tags=["Cadastral Land Parcels"])
api_router.include_router(stakeholders_router, prefix="", tags=["Stakeholders"])
api_router.include_router(documents_router, prefix="/documents", tags=["Documents"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(field_router, prefix="/field-verifications", tags=["Field Verification"])
api_router.include_router(field_router, prefix="/field-cases", tags=["Field Cases"])
api_router.include_router(citizen_router, prefix="/citizen-reports", tags=["Citizen Reports"])
api_router.include_router(risk_router, prefix="", tags=["Predictive Risk Intelligence"])
api_router.include_router(ml_router, prefix="/ml", tags=["AI & Machine Learning Engine"])
api_router.include_router(audit_router, prefix="", tags=["Audit Logging"])
api_router.include_router(workflow_router, prefix="", tags=["Operational Workflow"])
api_router.include_router(operations_router, prefix="", tags=["Daily Operations & Automation"])
api_router.include_router(contractors_router, prefix="", tags=["Contractor Monitoring"])
api_router.include_router(designs_router, prefix="", tags=["Multi-Design & Versioning Engine"])
api_router.include_router(portfolio_router, prefix="", tags=["Multi-Project Portfolio & Workload Management"])

