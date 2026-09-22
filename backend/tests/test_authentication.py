"""
LandGuard AI — Phase 4 Dedicated Authentication Forensic Verification Suite
Tests all 22 required authentication, token lifecycle, password hashing, and seed integrity cases.
"""

import sys
import os
import pytest
from datetime import timedelta, datetime, timezone
import jwt

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.config import settings
from backend.app.core.security import (
    create_access_token,
    verify_password,
    get_password_hash,
    UserRole,
)
from backend.app.db.database import SessionLocal
from backend.app.db.models.user import User
from backend.app.db.seed import seed_database

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def ensure_seeded_db():
    db = SessionLocal()
    seed_database(db, force=False)
    db.close()


# 1. Valid admin login
def test_01_valid_admin_login():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@landguard.ai", "password": "LandGuard@2026"},
    )
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "SUPER_ADMIN"
    assert data["email"] == "admin@landguard.ai"


# 2. Invalid password
def test_02_invalid_password():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@landguard.ai", "password": "WrongPassword123!"},
    )
    assert res.status_code == 401
    assert "Incorrect email or password" in res.json()["detail"]


# 3. Invalid email format / bad domain
def test_03_invalid_email():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent_officer@nowhere.com", "password": "LandGuard@2026"},
    )
    assert res.status_code == 401


# 4. Empty password
def test_04_empty_password():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@landguard.ai", "password": ""},
    )
    assert res.status_code in [400, 422]


# 5. Empty email
def test_05_empty_email():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "", "password": "LandGuard@2026"},
    )
    assert res.status_code in [400, 422]


# 6. Missing credentials payload
def test_06_missing_credentials():
    res = client.post("/api/v1/auth/login", json={})
    assert res.status_code == 422


# 7. Token returned and format
def test_07_token_returned():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@landguard.ai", "password": "LandGuard@2026"},
    )
    assert res.status_code == 200
    token = res.json().get("access_token")
    assert token and isinstance(token, str)
    assert len(token) > 20


# 8. Token contains valid identity payload
def test_08_token_contains_valid_identity():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@landguard.ai", "password": "LandGuard@2026"},
    )
    token = res.json()["access_token"]
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert "sub" in payload
    assert payload["role"] == "SUPER_ADMIN"
    assert "exp" in payload


# 9. Current user works (/auth/me)
def test_09_current_user_works():
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@landguard.ai", "password": "LandGuard@2026"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    me = me_res.json()
    assert me["email"] == "admin@landguard.ai"
    assert me["role"] == "SUPER_ADMIN"
    assert me["full_name"] == "LandGuard System Administrator"


# 10. Protected endpoint without token returns 401
def test_10_protected_endpoint_without_token():
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401


# 11. Protected endpoint with valid token returns 200
def test_11_protected_endpoint_with_valid_token():
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "district@landguard.ai", "password": "LandGuard@2026"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/v1/auth/me", headers=headers)
    assert res.status_code == 200
    assert res.json()["role"] == "DISTRICT_OFFICER"


# 12. Invalid token returns 401
def test_12_invalid_token():
    headers = {"Authorization": "Bearer invalid_garbage_jwt_token_12345"}
    res = client.get("/api/v1/auth/me", headers=headers)
    assert res.status_code == 401


# 13. Expired token returns 401
def test_13_expired_token():
    # Generate token that expired 1 hour ago
    expired_token = create_access_token(
        subject="USR-ADMIN-00",
        role="SUPER_ADMIN",
        expires_delta=timedelta(hours=-1),
    )
    headers = {"Authorization": f"Bearer {expired_token}"}
    res = client.get("/api/v1/auth/me", headers=headers)
    assert res.status_code == 401


# 14. Logout lifecycle (client token invalidation simulation)
def test_14_logout_lifecycle():
    # Login to obtain token
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "head@landguard.ai", "password": "LandGuard@2026"},
    )
    assert res.status_code == 200
    token = res.json()["access_token"]

    # Simulating client discarding token: request without token must fail
    res_after = client.get("/api/v1/auth/me")
    assert res_after.status_code == 401


# 15. Refresh/reload behavior (token remains valid for its lifetime)
def test_15_refresh_reload_behavior():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "lao@landguard.ai", "password": "LandGuard@2026"},
    )
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # First load
    r1 = client.get("/api/v1/auth/me", headers=headers)
    assert r1.status_code == 200
    # Reload/second query
    r2 = client.get("/api/v1/auth/me", headers=headers)
    assert r2.status_code == 200
    assert r1.json()["id"] == r2.json()["id"]


# 16. Session persistence (valid token survives across multiple diverse endpoint requests)
def test_16_session_persistence():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@landguard.ai", "password": "LandGuard@2026"},
    )
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify multiple protected resources in a single session
    res1 = client.get("/api/v1/auth/me", headers=headers)
    res2 = client.get("/api/v1/auth/users", headers=headers)
    res3 = client.get("/api/v1/auth/admin-stats", headers=headers)
    assert res1.status_code == 200
    assert res2.status_code == 200
    assert res3.status_code == 200


# 17. Wrong role access: Non-admin trying to access Super Admin user management gets 403
def test_17_wrong_role_access():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "citizen@landguard.ai", "password": "LandGuard@2026"},
    )
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Citizen accessing admin user management endpoint
    admin_res = client.get("/api/v1/auth/users", headers=headers)
    assert admin_res.status_code == 403, f"Expected 403 Forbidden, got {admin_res.status_code}"


# 18. Disabled user login returns 400 Bad Request
def test_18_disabled_user_login():
    db = SessionLocal()
    # Create or update a disabled user
    disabled_email = "disabled_officer@landguard.ai"
    u = db.query(User).filter(User.email == disabled_email).first()
    if not u:
        u = User(
            id="USR-DISABLED-01",
            email=disabled_email,
            full_name="Disabled Officer Demo",
            hashed_password=get_password_hash("LandGuard@2026"),
            role="FIELD_OFFICER",
            is_active=False,
        )
        db.add(u)
    else:
        u.is_active = False
    db.commit()
    db.close()

    res = client.post(
        "/api/v1/auth/login",
        json={"email": disabled_email, "password": "LandGuard@2026"},
    )
    assert res.status_code == 400
    assert "Inactive user" in res.json()["detail"]


# 19. Nonexistent user returns 401
def test_19_nonexistent_user():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody_exists_9999@landguard.ai", "password": "AnyPassword123!"},
    )
    assert res.status_code == 401


# 20. Password hashing verification (Bcrypt check)
def test_20_password_hashing():
    raw = "SecureLandGuard@2026"
    hashed = get_password_hash(raw)
    assert hashed != raw
    assert hashed.startswith("$2b$")
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


# 21. Admin seed creates admin account with hashed password
def test_21_admin_seed():
    db = SessionLocal()
    admin = db.query(User).filter(User.email == "admin@landguard.ai").first()
    assert admin is not None
    assert admin.role == "SUPER_ADMIN"
    assert admin.is_superuser is True
    assert admin.is_active is True
    assert verify_password("LandGuard@2026", admin.hashed_password) is True
    db.close()


# 22. Duplicate admin prevention (Seed idempotency)
def test_22_duplicate_admin_prevention():
    db = SessionLocal()
    # Run seed again
    seed_database(db, force=False)
    # Count admin users
    admins = db.query(User).filter(User.email == "admin@landguard.ai").all()
    assert len(admins) == 1, f"Expected exactly 1 admin user, found {len(admins)}"
    db.close()
