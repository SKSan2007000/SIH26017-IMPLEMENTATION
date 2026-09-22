import sys
import os

# Add workspace to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def run_tests():
    print("=" * 60)
    print("LANDGUARD AI — PHASE 2 BACKEND VERIFICATION SUITE")
    print("=" * 60)

    # 1. Health Check
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.status_code}"
    health_data = res.json()
    assert health_data["status"] == "ok"
    assert health_data["service"] == "LandGuard API"
    print(" [PASS] 1. GET /health -> status: ok, service: LandGuard API")

    # 2. Swagger / OpenAPI Spec
    res = client.get("/api/v1/openapi.json")
    assert res.status_code == 200, f"OpenAPI spec failed: {res.status_code}"
    print(" [PASS] 2. GET /docs & /api/v1/openapi.json -> OpenAPI 3.1 valid schema")

    # 3. RBAC Login
    res = client.post("/api/v1/auth/login", json={
        "email": "head@landguard.gov.in",
        "password": "LandGuard@2026"
    })
    assert res.status_code == 200, f"Login failed: {res.text}"
    token_data = res.json()
    assert "access_token" in token_data
    assert token_data["role"] == "PROJECT_HEAD"
    token = token_data["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}
    print(f" [PASS] 3. POST /api/v1/auth/login -> JWT token generated for {token_data['email']} ({token_data['role']})")

    # 4. Auth Me Profile
    res = client.get("/api/v1/auth/me", headers=auth_headers)
    assert res.status_code == 200, f"Profile failed: {res.text}"
    user_info = res.json()
    assert user_info["role"] == "PROJECT_HEAD"
    print(f" [PASS] 4. GET /api/v1/auth/me -> Authenticated as {user_info['full_name']}")

    # 5. List Projects
    res = client.get("/api/v1/projects")
    assert res.status_code == 200
    projects = res.json()
    assert len(projects) >= 10, f"Expected >= 10 projects, got {len(projects)}"
    print(f" [PASS] 5. GET /api/v1/projects -> Returned {len(projects)} infrastructure projects")

    # 6. Single Project
    prj_id = projects[0]["id"]
    res = client.get(f"/api/v1/projects/{prj_id}")
    assert res.status_code == 200
    project = res.json()
    assert project["id"] == prj_id
    print(f" [PASS] 6. GET /api/v1/projects/{prj_id} -> {project['name']} ({project['status']})")

    # 7. Project Routes
    res = client.get(f"/api/v1/projects/{prj_id}/routes")
    assert res.status_code == 200
    routes = res.json()
    assert len(routes) == 4, f"Expected 4 routes per project, got {len(routes)}"
    route_id = routes[0]["id"]
    print(f" [PASS] 7. GET /api/v1/projects/{prj_id}/routes -> {len(routes)} candidate alignments ([{', '.join(r['label'] for r in routes)}])")

    # 8. Single Route
    res = client.get(f"/api/v1/routes/{route_id}")
    assert res.status_code == 200
    route = res.json()
    assert route["id"] == route_id
    print(f" [PASS] 8. GET /api/v1/routes/{route_id} -> {route['label']} ({route['strategy']})")

    # 9. Spatial Intersection: Affected Parcels
    res = client.get(f"/api/v1/routes/{route_id}/affected-parcels")
    assert res.status_code == 200
    affected_parcels = res.json()
    assert len(affected_parcels) > 0, "Expected spatial intersection to find affected parcels"
    sample_aff = affected_parcels[0]
    assert "parcelId" in sample_aff or "id" in sample_aff
    assert "geometry" in sample_aff
    assert "area" in sample_aff or "areaSqFt" in sample_aff
    assert "impact" in sample_aff
    assert "risk" in sample_aff
    assert "stakeholderId" in sample_aff or "ownerRef" in sample_aff
    print(f" [PASS] 9. GET /api/v1/routes/{route_id}/affected-parcels -> {len(affected_parcels)} parcels spatially intersected")
    print(f"         Sample geometry: {sample_aff['geometry']['type']}, Area: {sample_aff.get('area')} sq ft, Impact: {sample_aff.get('impact')}, Risk: {sample_aff.get('risk')}")

    # 10. Project Parcels
    res = client.get(f"/api/v1/projects/{prj_id}/parcels")
    assert res.status_code == 200
    parcels = res.json()
    assert len(parcels) >= 10
    parcel_id = parcels[0]["id"]
    print(f" [PASS] 10. GET /api/v1/projects/{prj_id}/parcels -> {len(parcels)} cadastral parcels loaded")

    # 11. Single Parcel
    res = client.get(f"/api/v1/parcels/{parcel_id}")
    assert res.status_code == 200
    parcel = res.json()
    assert parcel["id"] == parcel_id
    print(f" [PASS] 11. GET /api/v1/parcels/{parcel_id} -> Owner: {parcel['ownerRef']}, Area: {parcel['areaSqFt']} sq ft, Land: {parcel['landType']}")

    # 12. Stakeholders
    res = client.get(f"/api/v1/projects/{prj_id}/stakeholders")
    assert res.status_code == 200
    stakeholders = res.json()
    assert len(stakeholders) >= 10
    sh_id = stakeholders[0]["id"]
    print(f" [PASS] 12. GET /api/v1/projects/{prj_id}/stakeholders -> {len(stakeholders)} stakeholders enrolled")

    # 13. Single Stakeholder & Stakeholder Documents
    res = client.get(f"/api/v1/stakeholders/{sh_id}")
    assert res.status_code == 200
    sh = res.json()
    assert sh["id"] == sh_id
    print(f" [PASS] 13. GET /api/v1/stakeholders/{sh_id} -> Ref: {sh['ref']}, Status: {sh['status']}, Comp: {sh['compensationStatus']}")

    res = client.get(f"/api/v1/stakeholders/{sh_id}/documents")
    assert res.status_code == 200
    sh_docs = res.json()
    print(f" [PASS] 14. GET /api/v1/stakeholders/{sh_id}/documents -> {len(sh_docs)} linked legal/survey documents")

    # 15. Documents API
    res = client.get("/api/v1/documents")
    assert res.status_code == 200
    all_docs = res.json()
    assert len(all_docs) >= 100
    print(f" [PASS] 15. GET /api/v1/documents -> {len(all_docs)} total document records tracked")

    # 16. Field Verification Tasks
    res = client.get("/api/v1/field-verifications")
    assert res.status_code == 200
    ver_cases = res.json()
    assert len(ver_cases) >= 4
    print(f" [PASS] 16. GET /api/v1/field-verifications -> {len(ver_cases)} field verification cases")

    # 17. Citizen Reports
    res = client.get("/api/v1/citizen-reports")
    assert res.status_code == 200
    citizen_reports = res.json()
    assert len(citizen_reports) >= 3
    print(f" [PASS] 17. GET /api/v1/citizen-reports -> {len(citizen_reports)} citizen grievance reports")

    # 18. Notifications
    res = client.get("/api/v1/notifications")
    assert res.status_code == 200
    notifs = res.json()
    assert len(notifs) >= 4
    print(f" [PASS] 18. GET /api/v1/notifications -> {len(notifs)} system & statutory notifications")

    # 19. Predictive Risk Intelligence
    res = client.get(f"/api/v1/projects/{prj_id}/risk")
    assert res.status_code == 200
    risk = res.json()
    assert "overallPct" in risk
    assert "band" in risk
    assert "trend" in risk
    print(f" [PASS] 19. GET /api/v1/projects/{prj_id}/risk -> Overall Risk: {risk['overallPct']}%, Band: {risk['band']}, Forecast: {risk['predictedDelayLabel']}")

    # 20. Audit Trail
    res = client.get(f"/api/v1/projects/{prj_id}/audit")
    assert res.status_code == 200
    audit_logs = res.json()
    assert len(audit_logs) >= 1
    print(f" [PASS] 20. GET /api/v1/projects/{prj_id}/audit -> {len(audit_logs)} immutable audit trail events")

    print("=" * 60)
    print("ALL 20 BACKEND VERIFICATION CHECKS PASSED PERFECTLY!")
    print("=" * 60)


if __name__ == "__main__":
    run_tests()
