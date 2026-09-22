import os
import sys

# Ensure backend root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from fastapi.testclient import TestClient
from backend.app.main import app

def test():
    client = TestClient(app)
    
    # 1. Health
    res = client.get("/health")
    assert res.status_code == 200
    health = res.json()
    print(f"[HEALTH] {health}")
        
    # 2. Login
    res = client.post("/api/v1/auth/login", json={"email": "admin@landguard.ai", "password": "LandGuard@2026"})
    assert res.status_code == 200
    login = res.json()
    token = login["access_token"]
    print(f"[AUTH LOGIN] User: {login['full_name']} | Role: {login['role']}")

    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Auth Me
    res = client.get("/api/v1/auth/me", headers=headers)
    assert res.status_code == 200
    me = res.json()
    print(f"[AUTH ME] Email: {me['email']} | FullName: {me['full_name']}")

    # 4. Projects
    res = client.get("/api/v1/projects")
    assert res.status_code == 200
    projects = res.json()
    print(f"[PROJECTS] Total: {len(projects)} | First: {projects[0]['name']} ({projects[0]['id']})")

    # 5. Single Project
    res = client.get("/api/v1/projects/PRJ-1042")
    assert res.status_code == 200
    p = res.json()
    print(f"[PROJECT PRJ-1042] Budget: INR {p['estimatedBudgetCr']} Cr | State: {p['state']} | Parcels: {p['parcelsCount']}")

    # 6. Routes
    res = client.get("/api/v1/projects/PRJ-1042/routes")
    assert res.status_code == 200
    routes = res.json()
    print(f"[ROUTES] Total: {len(routes)} | Route C AI Rec: {routes[2]['aiRecommended']} | Score: {routes[2]['overallScore']}")

    # 7. Parcels
    res = client.get("/api/v1/projects/PRJ-1042/parcels")
    assert res.status_code == 200
    parcels = res.json()
    print(f"[PARCELS] Total for PRJ-1042: {len(parcels)} | First: {parcels[0]['id']} ({parcels[0]['ownerRef']})")

    # 8. Single Parcel
    res = client.get("/api/v1/parcels/P-101")
    assert res.status_code == 200
    parcel = res.json()
    print(f"[PARCEL P-101] LandType: {parcel['landType']} | Impact: {parcel['impact']} | Disputed: {parcel['disputed']}")

    # 9. Stakeholders
    res = client.get("/api/v1/projects/PRJ-1042/stakeholders")
    assert res.status_code == 200
    stakeholders = res.json()
    print(f"[STAKEHOLDERS] Total for PRJ-1042: {len(stakeholders)} | First: {stakeholders[0]['name']}")

    # 10. Notifications
    res = client.get("/api/v1/notifications")
    assert res.status_code == 200
    notifs = res.json()
    print(f"[NOTIFICATIONS] Total: {len(notifs)} | First: {notifs[0]['message'][:45]}...")

    # 11. Field Verifications
    res = client.get("/api/v1/field-verifications")
    assert res.status_code == 200
    cases = res.json()
    print(f"[FIELD CASES] Total: {len(cases)} | First: {cases[0]['id']} ({cases[0]['status']})")

    # 12. Citizen Reports
    res = client.get("/api/v1/citizen-reports")
    assert res.status_code == 200
    reports = res.json()
    print(f"[CITIZEN REPORTS] Total: {len(reports)} | First: {reports[0]['category']}")

    # 13. Risk
    res = client.get("/api/v1/projects/PRJ-1042/risk")
    assert res.status_code == 200
    risk = res.json()
    print(f"[RISK] PRJ-1042 Overall: {risk['overallPct']}% | Band: {risk['band']} | Delay: {risk['predictedDelayLabel']}")

    # 14. Risk Factors
    res = client.get("/api/v1/projects/PRJ-1042/risk/factors")
    assert res.status_code == 200
    factors = res.json()
    print(f"[RISK FACTORS] Total: {len(factors)} | Factor 1: {factors[0]['factorName']}")

    # 15. What-If
    res = client.post("/api/v1/projects/PRJ-1042/what-if", json={"leverIds": ["resolve_documents", "resolve_disputes"]})
    assert res.status_code == 200
    levers = res.json()
    print(f"[WHAT-IF] Simulated Levers: {len(levers)} | Lever 1: {levers[0]['label']} -> {levers[0]['resultingRiskPct']}%")
    print("ALL ENDPOINT CHECKS PASSED PERFECTLY!")

if __name__ == "__main__":
    test()

