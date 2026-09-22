"""
LandGuard AI — 2D GIS & 3D Digital Twin Integration Test Suite
Verifies:
1. Unified GeoJSON FeatureCollection generation with strict [lon, lat] coordinate ordering.
2. Route alignment, corridor ribbon, and cadastral parcel serialization.
3. Granular parcel delay risk analytics and drivers.
4. Officer assignment to parcel verification workflow.
5. Parcel verification sign-off and automatic live project risk recalculation.
6. Route GIS geometry extraction.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.database import SessionLocal
from backend.app.db.seed import seed_database
from backend.app.db.models.project import Project
from backend.app.db.models.parcel import Parcel
from backend.app.db.models.route import Route
from backend.app.db.models.audit import AuditLog

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    db = SessionLocal()
    seed_database(db, force=False)
    db.close()


def test_01_project_gis_feature_collection_schema():
    """Verifies that /api/v1/projects/{id}/gis returns a fully-hydrated valid GeoJSON FeatureCollection."""
    res = client.get("/api/v1/projects/PRJ-1042/gis")
    assert res.status_code == 200
    fc = res.json()

    assert fc["type"] == "FeatureCollection"
    assert "metadata" in fc
    assert fc["metadata"]["projectId"] == "PRJ-1042"
    assert fc["metadata"]["routesCount"] >= 4
    assert fc["metadata"]["parcelsCount"] >= 10

    features = fc["features"]
    assert len(features) >= 15

    entity_types = {f["properties"]["entityType"] for f in features}
    assert "PROJECT" in entity_types
    assert "ROUTE" in entity_types
    assert "CORRIDOR_RIBBON" in entity_types
    assert "PARCEL" in entity_types
    assert "RISK_BUFFER" in entity_types
    assert "WATERWAY" in entity_types
    assert "RAILWAY" in entity_types


def test_02_geojson_coordinate_ordering_and_geometry():
    """Strictly verifies that all GeoJSON coordinates follow [longitude, latitude] in India bounds."""
    res = client.get("/api/v1/projects/PRJ-1042/gis")
    assert res.status_code == 200
    fc = res.json()

    for feat in fc["features"]:
        geom = feat["geometry"]
        gtype = geom["type"]
        coords = geom["coordinates"]

        if gtype == "Point":
            lon, lat = coords[0], coords[1]
            assert 68.0 <= lon <= 98.0, f"Invalid longitude {lon} for {feat['properties']}"
            assert 6.0 <= lat <= 38.0, f"Invalid latitude {lat} for {feat['properties']}"
        elif gtype == "LineString":
            assert len(coords) >= 2
            for pt in coords:
                lon, lat = pt[0], pt[1]
                assert 68.0 <= lon <= 98.0
                assert 6.0 <= lat <= 38.0
        elif gtype == "Polygon":
            assert len(coords) >= 1
            for ring in coords:
                assert len(ring) >= 4, "Polygon ring must have at least 4 coordinates (closed loop)"
                assert ring[0] == ring[-1], "Polygon must be closed (first coordinate equals last)"


def test_03_parcel_properties_and_risk_scoring():
    """Verifies that each parcel feature includes risk score, status, assigned officer, and color."""
    res = client.get("/api/v1/projects/PRJ-1042/gis")
    assert res.status_code == 200
    fc = res.json()

    parcels = [f for f in fc["features"] if f["properties"]["entityType"] == "PARCEL"]
    assert len(parcels) >= 10

    for p in parcels:
        props = p["properties"]
        assert "id" in props
        assert "ownerRef" in props
        assert "areaSqFt" in props
        assert "riskScore" in props
        assert 0 <= props["riskScore"] <= 100
        assert "riskLevel" in props
        assert "assignedOfficer" in props
        assert "color" in props
        assert props["color"].startswith("#")


def test_04_parcel_risk_analytics_endpoint():
    """Verifies /api/v1/parcels/{id}/risk returns drivers and delay estimation."""
    res = client.get("/api/v1/parcels/P-101/risk")
    assert res.status_code == 200
    data = res.json()

    assert data["parcelId"] == "P-101"
    assert "riskScore" in data
    assert "riskBand" in data
    assert "estimatedDelayMonths" in data
    assert "drivers" in data
    assert "recommendations" in data
    assert len(data["recommendations"]) >= 1


def test_05_assign_officer_to_parcel_workflow():
    """Verifies assigning an officer updates field verification and creates an audit log."""
    res = client.post("/api/v1/parcels/P-101/assign-officer", json={
        "officerRef": "OFF-08",
        "officerName": "R. Vignesh",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["officerName"] == "R. Vignesh"

    # Verify audit log in db
    db = SessionLocal()
    try:
        audit = db.query(AuditLog).filter(
            AuditLog.entity_id == "P-101",
            AuditLog.action == "OFFICER_ASSIGNED"
        ).first()
        assert audit is not None
        assert "R. Vignesh" in audit.label
    finally:
        db.close()


def test_06_verify_parcel_recalculates_risk():
    """Verifies that completing parcel verification marks status VERIFIED and recalculates project risk."""
    res = client.post("/api/v1/parcels/P-101/verify", json={"notes": "Peg survey validated"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["verification"] == "VERIFIED"
    assert "projectRisk" in data
    assert "overallPct" in data["projectRisk"]


def test_07_route_gis_geometry_endpoint():
    """Verifies /api/v1/routes/{id}/gis returns route LineString and corridor ribbon polygon."""
    res = client.get("/api/v1/routes/RT-1042-C/gis")
    assert res.status_code == 200
    data = res.json()

    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 2
    geoms = {f["geometry"]["type"] for f in data["features"]}
    assert "LineString" in geoms
    assert "Polygon" in geoms
