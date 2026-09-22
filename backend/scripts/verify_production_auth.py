import sys
import os
import types

# Ensure backend and root paths are available
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
root_dir = os.path.dirname(backend_dir)
for p in [root_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi.testclient import TestClient
from backend.main import app
from backend.app.core.security import verify_password
from backend.app.db.database import SessionLocal, init_db, engine
from backend.app.db.models.user import User

client = TestClient(app)

print("=" * 60)
print("LANDGUARD PRODUCTION AUTHENTICATION & LOGIN VERIFICATION")
print("=" * 60)

# 1. Test database initialization
init_db(engine)
print("1. Database engine & tables initialized successfully.")

# 2. Test 8 RBAC Demo Users Login
test_accounts = [
    ("admin@landguard.ai", "SUPER_ADMIN", "LandGuard System Administrator"),
    ("head@landguard.ai", "PROJECT_HEAD", "Dr. A. Sundaram (DEMO)"),
    ("district@landguard.ai", "DISTRICT_OFFICER", "M. K. Revathi IAS (DEMO)"),
    ("lao@landguard.ai", "LAND_ACQUISITION_OFFICER", "K. Rajagopal (DEMO)"),
    ("field@landguard.ai", "FIELD_OFFICER", "R. Vignesh (DEMO)"),
    ("supervisor@landguard.ai", "SUPERVISOR", "P. Ananthi (DEMO)"),
    ("citizen@landguard.ai", "CITIZEN", "DEMO Citizen User"),
    ("contractor@landguard.ai", "CONTRACTOR", "DEMO Infra Consortium"),
]

for email, expected_role, expected_name in test_accounts:
    res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "LandGuard@2026"},
    )
    assert res.status_code == 200, f"Login failed for {email}: {res.status_code} {res.text}"
    data = res.json()
    assert "access_token" in data, f"No access_token for {email}"
    assert data["role"] == expected_role, f"Role mismatch: {data['role']} != {expected_role}"
    assert data["email"] == email, f"Email mismatch: {data['email']} != {email}"
    print(f" [PASS] {expected_role:<25} | {email:<25} -> 200 OK (JWT: {data['access_token'][:20]}...)")

# 3. Test Invalid Password
res_invalid_pwd = client.post(
    "/api/v1/auth/login",
    json={"email": "admin@landguard.ai", "password": "WrongPassword123!"},
)
assert res_invalid_pwd.status_code == 401, f"Expected 401 for bad password, got {res_invalid_pwd.status_code}"
print(" [PASS] Invalid password correctly rejected with 401 Unauthorized.")

# 4. Test Nonexistent User
res_nonexistent = client.post(
    "/api/v1/auth/login",
    json={"email": "nobody@nonexistent.domain", "password": "AnyPassword123!"},
)
assert res_nonexistent.status_code == 401, f"Expected 401 for nonexistent user, got {res_nonexistent.status_code}"
print(" [PASS] Nonexistent user correctly rejected with 401 Unauthorized.")

# 5. Test Authenticated User /me with Real JWT
admin_login = client.post(
    "/api/v1/auth/login",
    json={"email": "admin@landguard.ai", "password": "LandGuard@2026"},
).json()
token = admin_login["access_token"]
me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
assert me_res.status_code == 200, f"/me failed: {me_res.status_code} {me_res.text}"
me_data = me_res.json()
assert me_data["email"] == "admin@landguard.ai"
assert me_data["role"] == "SUPER_ADMIN"
print(f" [PASS] GET /api/v1/auth/me with Bearer token returned profile: {me_data['full_name']} ({me_data['role']})")

print("=" * 60)
print("ALL PRODUCTION AUTHENTICATION CHECKS PASSED WITH 100% SUCCESS!")
print("=" * 60)
