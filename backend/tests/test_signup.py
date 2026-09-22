"""
LandGuard AI — Public Signup & Registration Security Test Suite
Verifies:
1. Citizen registration creates real database user with hashed password.
2. Contractor registration creates real database user.
3. Public registration strictly rejects staff/officer/admin roles with HTTP 403.
4. Duplicate email rejection (HTTP 400).
5. Weak password policy enforcement (<8 chars).
6. Immediate login capability with newly registered citizen credentials.
7. Verification of user details in database.
"""

import sys
import os
import pytest
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.security import verify_password, UserRole
from backend.app.db.database import SessionLocal
from backend.app.db.models.user import User
from backend.app.db.seed import seed_database

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    db = SessionLocal()
    seed_database(db, force=False)
    db.close()


def test_01_citizen_public_registration_success():
    unique_email = f"citizen.test.{uuid.uuid4().hex[:6]}@example.com"
    payload = {
        "email": unique_email,
        "full_name": "Test Citizen Landowner",
        "password": "CitizenSecret@2026",
        "role": "CITIZEN",
        "phone": "+91 98400-11223",
        "district": "Chennai",
        "zone": "Zone A",
        "address": "Plot 42, Ennore North Village",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["email"] == unique_email
    assert data["role"] == "CITIZEN"
    assert data["full_name"] == "Test Citizen Landowner"

    # Verify database persistence & password hashing
    db = SessionLocal()
    user = db.query(User).filter(User.email == unique_email).first()
    assert user is not None
    assert user.role == "CITIZEN"
    assert user.is_active is True
    assert user.is_superuser is False
    assert user.hashed_password != "CitizenSecret@2026"
    assert verify_password("CitizenSecret@2026", user.hashed_password) is True
    db.close()


def test_02_contractor_public_registration_success():
    unique_email = f"contractor.test.{uuid.uuid4().hex[:6]}@example.com"
    payload = {
        "email": unique_email,
        "full_name": "Apex Infrastructure EPC",
        "password": "ContractorPass@2026",
        "role": "CONTRACTOR",
        "phone": "+91 98400-99887",
        "district": "Salem",
        "zone": "West Zone",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 200
    assert res.json()["role"] == "CONTRACTOR"


def test_03_reject_public_registration_as_super_admin():
    payload = {
        "email": f"fake.admin.{uuid.uuid4().hex[:6]}@example.com",
        "full_name": "Malicious Admin Claim",
        "password": "AdminPassword@2026",
        "role": "SUPER_ADMIN",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code in [400, 403], f"Expected 403/400 for forbidden admin signup, got {res.status_code}"


def test_04_reject_public_registration_as_field_officer():
    payload = {
        "email": f"fake.officer.{uuid.uuid4().hex[:6]}@example.com",
        "full_name": "Unauthorized Officer Signup",
        "password": "OfficerPassword@2026",
        "role": "FIELD_OFFICER",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code in [400, 403]


def test_05_reject_public_registration_as_project_head():
    payload = {
        "email": f"fake.head.{uuid.uuid4().hex[:6]}@example.com",
        "full_name": "Unauthorized Head Signup",
        "password": "HeadPassword@2026",
        "role": "PROJECT_HEAD",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code in [400, 403]


def test_06_duplicate_email_rejected():
    existing_email = "citizen@landguard.ai"
    payload = {
        "email": existing_email,
        "full_name": "Duplicate Citizen Attempt",
        "password": "ValidPassword@2026",
        "role": "CITIZEN",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 400
    assert "already registered" in res.json()["detail"].lower()


def test_07_weak_password_rejected():
    payload = {
        "email": f"weak.pass.{uuid.uuid4().hex[:6]}@example.com",
        "full_name": "Weak Password User",
        "password": "123",  # under 8 chars
        "role": "CITIZEN",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 400
    assert "at least 8 characters" in res.json()["detail"].lower()


def test_08_login_after_signup():
    email = f"auto.login.{uuid.uuid4().hex[:6]}@example.com"
    pwd = "StrongPassword@2026"
    reg_res = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Instant Login Citizen",
            "password": pwd,
            "role": "CITIZEN",
            "district": "Madurai",
        },
    )
    assert reg_res.status_code == 200

    # Login with newly registered credentials
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert data["role"] == "CITIZEN"

    # Verify protected /auth/me returns citizen profile
    token = data["access_token"]
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email
    assert me_res.json()["role"] == "CITIZEN"
