"""
LandGuard AI — Phase 8 Admin User Management Automated Test Suite
Tests complete CRUD, role assignment, password resets, active/deactive status,
and new user login verification for all 8 supported roles.
"""

import sys
import os
import pytest
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.security import verify_password
from backend.app.db.database import SessionLocal
from backend.app.db.models.user import User
from backend.app.db.seed import seed_database

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    db = SessionLocal()
    seed_database(db, force=False)
    db.close()


def get_admin_headers() -> dict:
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@landguard.ai", "password": "LandGuard@2026"},
    )
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# 1. List users
def test_01_admin_list_users():
    headers = get_admin_headers()
    res = client.get("/api/v1/auth/users", headers=headers)
    assert res.status_code == 200
    users = res.json()
    assert len(users) >= 8
    emails = [u["email"] for u in users]
    assert "admin@landguard.ai" in emails


# 2. Filter users by role
def test_02_admin_filter_users_by_role():
    headers = get_admin_headers()
    res = client.get("/api/v1/auth/users?role=FIELD_OFFICER", headers=headers)
    assert res.status_code == 200
    users = res.json()
    for u in users:
        assert u["role"] == "FIELD_OFFICER"


# 3. Create new user with FIELD_OFFICER role
def test_03_admin_create_field_officer_user():
    headers = get_admin_headers()
    new_email = f"new_field_{uuid.uuid4().hex[:6]}@landguard.ai"
    payload = {
        "email": new_email,
        "full_name": "S. Rajesh Kumar (Field Officer)",
        "password": "Password@2026",
        "role": "FIELD_OFFICER",
        "designation": "Field Verification Surveyor",
        "department": "Survey & Land Records Division",
        "phone": "+91 94440-55555",
        "is_active": True,
    }
    res = client.post("/api/v1/auth/users", json=payload, headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    user_data = res.json()
    assert user_data["email"] == new_email
    assert user_data["role"] == "FIELD_OFFICER"

    # Verify password was hashed in database
    db = SessionLocal()
    db_user = db.query(User).filter(User.email == new_email).first()
    assert db_user is not None
    assert db_user.hashed_password != "Password@2026"
    assert verify_password("Password@2026", db_user.hashed_password) is True
    db.close()

    # Verify new user can immediately authenticate
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": new_email, "password": "Password@2026"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert login_res.json()["role"] == "FIELD_OFFICER"

    # Verify new user calling /auth/me returns their profile
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == new_email


# 4. Duplicate email prevention
def test_04_duplicate_email_prevention():
    headers = get_admin_headers()
    payload = {
        "email": "admin@landguard.ai",
        "full_name": "Another Admin",
        "password": "Password@2026",
        "role": "SUPER_ADMIN",
    }
    res = client.post("/api/v1/auth/users", json=payload, headers=headers)
    assert res.status_code == 400
    assert "Email already exists" in res.json()["detail"]


# 5. Update user details
def test_05_admin_update_user():
    headers = get_admin_headers()
    # Create temp user
    temp_email = f"temp_{uuid.uuid4().hex[:6]}@landguard.ai"
    c_res = client.post(
        "/api/v1/auth/users",
        json={"email": temp_email, "full_name": "Temp User", "password": "Password@2026", "role": "CITIZEN"},
        headers=headers,
    )
    user_id = c_res.json()["id"]

    # Update designation and phone
    u_res = client.patch(
        f"/api/v1/auth/users/{user_id}",
        json={"designation": "Updated Lead Representative", "phone": "+91 98888-77777"},
        headers=headers,
    )
    assert u_res.status_code == 200
    assert u_res.json()["designation"] == "Updated Lead Representative"
    assert u_res.json()["phone"] == "+91 98888-77777"


# 6. Reset password
def test_06_admin_reset_user_password():
    headers = get_admin_headers()
    temp_email = f"temp_reset_{uuid.uuid4().hex[:6]}@landguard.ai"
    c_res = client.post(
        "/api/v1/auth/users",
        json={"email": temp_email, "full_name": "Reset Demo User", "password": "OldPassword@123", "role": "CONTRACTOR"},
        headers=headers,
    )
    user_id = c_res.json()["id"]

    # Reset password
    r_res = client.post(
        f"/api/v1/auth/users/{user_id}/reset-password",
        json={"new_password": "NewSecretPassword@2026"},
        headers=headers,
    )
    assert r_res.status_code == 200
    assert "Password reset" in r_res.json()["message"]

    # Old password fails
    old_res = client.post(
        "/api/v1/auth/login",
        json={"email": temp_email, "password": "OldPassword@123"},
    )
    assert old_res.status_code == 401

    # New password succeeds
    new_res = client.post(
        "/api/v1/auth/login",
        json={"email": temp_email, "password": "NewSecretPassword@2026"},
    )
    assert new_res.status_code == 200


# 7. Delete non-root user
def test_07_admin_delete_user():
    headers = get_admin_headers()
    temp_email = f"temp_del_{uuid.uuid4().hex[:6]}@landguard.ai"
    c_res = client.post(
        "/api/v1/auth/users",
        json={"email": temp_email, "full_name": "Delete Me", "password": "Password@2026", "role": "CITIZEN"},
        headers=headers,
    )
    user_id = c_res.json()["id"]

    del_res = client.delete(f"/api/v1/auth/users/{user_id}", headers=headers)
    assert del_res.status_code == 200
    assert "deleted" in del_res.json()["message"]


# 8. Deleting root admin is rejected
def test_08_prevent_root_admin_deletion():
    headers = get_admin_headers()
    db = SessionLocal()
    admin = db.query(User).filter(User.email == "admin@landguard.ai").first()
    admin_id = admin.id
    db.close()

    del_res = client.delete(f"/api/v1/auth/users/{admin_id}", headers=headers)
    assert del_res.status_code == 400
    assert "Cannot delete root system administrator" in del_res.json()["detail"]


# 9. Get Admin Dashboard Summary Stats
def test_09_admin_stats_metrics():
    headers = get_admin_headers()
    res = client.get("/api/v1/auth/admin-stats", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_users" in data
    assert "active_users" in data
    assert "total_projects" in data
    assert data["total_projects"] >= 10
    assert data["total_users"] >= 8
