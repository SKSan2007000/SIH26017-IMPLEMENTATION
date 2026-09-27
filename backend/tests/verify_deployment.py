import os
import sys

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_endpoints():
    print("=== LandGuard Backend Production Verification ===")
    
    # 1. Root / check
    res = client.get("/")
    print(f"1. GET / -> Status: {res.status_code}, Response: {res.json()}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    assert res.json().get("status") == "ok"
    
    # 2. Health check
    res = client.get("/health")
    print(f"2. GET /health -> Status: {res.status_code}, Response: {res.json()}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    assert res.json().get("status") == "ok"
    
    # 3. Docs and OpenAPI check
    res = client.get("/docs")
    print(f"3. GET /docs -> Status: {res.status_code}")
    assert res.status_code == 200
    
    res = client.get("/api/v1/openapi.json")
    print(f"4. GET /api/v1/openapi.json -> Status: {res.status_code}, Title: {res.json().get('info', {}).get('title')}")
    assert res.status_code == 200
    
    # 4. Auth login with admin credentials
    login_payload = {
        "email": "admin@landguard.ai",
        "password": "LandGuard@2026"
    }
    res = client.post("/api/v1/auth/login", json=login_payload)
    print(f"5. POST /api/v1/auth/login -> Status: {res.status_code}, User: {res.json().get('user', {}).get('email')}, Role: {res.json().get('user', {}).get('role')}")
    assert res.status_code == 200, f"Login failed: {res.text}"
    token = res.json().get("access_token")
    assert token, "Token missing in login response"
    
    # 5. Authenticated endpoint check: projects list
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/v1/projects/", headers=headers)
    print(f"6. GET /api/v1/projects/ -> Status: {res.status_code}, Projects count: {len(res.json()) if isinstance(res.json(), list) else 'N/A'}")
    assert res.status_code == 200

    # 6. ML Predict endpoint
    predict_payload = {
        "land_acquisition_type": "Direct Purchase",
        "total_area_ha": 45.5,
        "affected_families_count": 120,
        "dispute_count": 2,
        "state": "Maharashtra",
        "environmental_clearance_status": "Approved"
    }
    res = client.post("/api/v1/ml/predict", json=predict_payload, headers=headers)
    print(f"7. POST /api/v1/ml/predict -> Status: {res.status_code}, Risk Level: {res.json().get('risk_level')}, Delay Probability: {res.json().get('delay_probability')}")
    assert res.status_code == 200, f"ML Predict failed: {res.text}"

    # 7. ML Model info
    res = client.get("/api/v1/ml/model-info")
    print(f"8. GET /api/v1/ml/model-info -> Status: {res.status_code}, Classifier: {res.json().get('classifier', {}).get('algorithm')}")
    assert res.status_code == 200

    print("\nALL BACKEND VERIFICATION CHECKS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_endpoints()
