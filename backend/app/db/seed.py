import uuid
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from backend.app.core.security import get_password_hash, UserRole
from backend.app.db.models.user import User
from backend.app.db.models.project import Project
from backend.app.db.models.route import Route
from backend.app.db.models.parcel import Parcel
from backend.app.db.models.stakeholder import Stakeholder
from backend.app.db.models.document import Document
from backend.app.db.models.field_verification import FieldVerification
from backend.app.db.models.citizen_report import CitizenReport
from backend.app.db.models.notification import Notification
from backend.app.db.models.risk import RiskPrediction, RiskFactor
from backend.app.db.models.audit import AuditLog
from backend.app.db.models.officer_performance import OfficerProfile
from backend.app.db.models.contractor import ContractorWorkPackage
from backend.app.db.models.government_alert import GovernmentAlert
from backend.app.db.models.stakeholder_benefit import StakeholderBenefitRecord
from backend.app.db.models.design import (
    Design,
    DesignVersion,
    DesignChangeRequest,
    ProjectAssignment,
    DesignPackage,
)

logger = logging.getLogger("landguard.seed")


def seed_demo_users(db: Session):
    """Idempotently creates or updates all 18 standard RBAC demo accounts."""
    demo_users = [
        # Official prompt requested admin demo account
        ("admin@landguard.ai", "LandGuard System Administrator", UserRole.SUPER_ADMIN, "Super Administrator", "Central Administration", "admin-00"),
        ("admin@landguard.gov.in", "System Administrator", UserRole.SUPER_ADMIN, "Chief Information Officer", "Central Administration", "admin-01"),
        # Other role demo accounts (@landguard.ai & @landguard.gov.in)
        ("head@landguard.ai", "Dr. A. Sundaram (DEMO)", UserRole.PROJECT_HEAD, "Project Director — National Corridors", "National Corridors Division", "head-00"),
        ("head@landguard.gov.in", "Dr. A. Sundaram (DEMO)", UserRole.PROJECT_HEAD, "Project Director — National Corridors", "National Corridors Division", "head-01"),
        ("district@landguard.ai", "M. K. Revathi IAS (DEMO)", UserRole.DISTRICT_OFFICER, "District Collector — Chennai", "District Administration Chennai", "dist-00"),
        ("district@landguard.gov.in", "M. K. Revathi IAS (DEMO)", UserRole.DISTRICT_OFFICER, "District Collector — Chennai", "District Administration Chennai", "dist-01"),
        ("lao@landguard.ai", "K. Rajagopal (DEMO)", UserRole.LAND_ACQUISITION_OFFICER, "Special LAO — Corridor Division", "Land Acquisition Wing", "lao-00"),
        ("lao@landguard.gov.in", "K. Rajagopal (DEMO)", UserRole.LAND_ACQUISITION_OFFICER, "Special LAO — Corridor Division", "Land Acquisition Wing", "lao-01"),
        ("field@landguard.ai", "R. Vignesh (DEMO)", UserRole.FIELD_OFFICER, "Senior Field Surveyor", "Field Cadastral Survey Division", "field-00"),
        ("field@landguard.gov.in", "R. Vignesh (DEMO)", UserRole.FIELD_OFFICER, "Senior Field Surveyor", "Field Cadastral Survey Division", "field-01"),
        ("supervisor@landguard.ai", "P. Ananthi (DEMO)", UserRole.SUPERVISOR, "Cadastral Verification Supervisor", "Quality & Verification Wing", "sup-00"),
        ("supervisor@landguard.gov.in", "P. Ananthi (DEMO)", UserRole.SUPERVISOR, "Cadastral Verification Supervisor", "Quality & Verification Wing", "sup-01"),
        ("citizen@landguard.ai", "DEMO Citizen User", UserRole.CITIZEN, "Land Owner Representative", "Citizen Services", "cit-00"),
        ("citizen@landguard.demo", "DEMO Citizen User", UserRole.CITIZEN, "Land Owner Representative", "Citizen Services", "cit-01"),
        ("citizen@landguard.gov.in", "DEMO Citizen User", UserRole.CITIZEN, "Land Owner Representative", "Citizen Services", "cit-02"),
        ("contractor@landguard.ai", "DEMO Infra Consortium", UserRole.CONTRACTOR, "EPC Highway Contractor", "Contractor Infrastructure Operations", "con-00"),
        ("contractor@landguard.demo", "DEMO Infra Consortium", UserRole.CONTRACTOR, "EPC Highway Contractor", "Contractor Infrastructure Operations", "con-01"),
        ("contractor@landguard.gov.in", "DEMO Infra Consortium", UserRole.CONTRACTOR, "EPC Highway Contractor", "Contractor Infrastructure Operations", "con-02"),
    ]

    for email, name, role, desig, dept, uid in demo_users:
        existing = db.query(User).filter(User.email == email.lower().strip()).first()
        if not existing:
            u = User(
                id=f"USR-{uid.upper()}",
                email=email.lower().strip(),
                full_name=name,
                hashed_password=get_password_hash("LandGuard@2026"),
                role=role.value,
                designation=desig,
                department=dept,
                phone="+91 94440-12345",
                is_active=True,
                is_superuser=(role == UserRole.SUPER_ADMIN),
            )
            db.add(u)
        else:
            existing.hashed_password = get_password_hash("LandGuard@2026")
            existing.role = role.value
            existing.is_active = True
            existing.is_superuser = (role == UserRole.SUPER_ADMIN)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logger.warning(f"Notice during demo users commit: {e}")


def seed_database(db: Session, force: bool = False):
    # Clear existing if force
    if force:
        try:
            db.query(DesignPackage).delete()
            db.query(DesignChangeRequest).delete()
            db.query(DesignVersion).delete()
            db.query(Design).delete()
            db.query(ProjectAssignment).delete()
            db.query(StakeholderBenefitRecord).delete()
            db.query(GovernmentAlert).delete()
            db.query(ContractorWorkPackage).delete()
            db.query(OfficerProfile).delete()
            db.query(AuditLog).delete()
            db.query(RiskFactor).delete()
            db.query(RiskPrediction).delete()
            db.query(Notification).delete()
            db.query(CitizenReport).delete()
            db.query(FieldVerification).delete()
            db.query(Document).delete()
            db.query(Stakeholder).delete()
            db.query(Parcel).delete()
            db.query(Route).delete()
            db.query(Project).delete()
            db.query(User).delete()
            db.commit()
        except Exception as e:
            db.rollback()
            logger.warning(f"Notice during force delete: {e}")

    # 1. Always ensure all demo users exist
    seed_demo_users(db)

    # Check if projects are already seeded
    if not force:
        try:
            if db.query(Project).count() >= 10:
                return
        except Exception:
            pass

    print("Seeding LandGuard AI database with 10 projects, 40 routes, multi-designs, 120+ parcels & stakeholders...")

    # 2. 10 SYNTHETIC INFRASTRUCTURE PROJECTS
    projects_data = [
        {
            "id": "PRJ-1042",
            "name": "Chennai-Bengaluru Industrial Corridor (DEMO)",
            "type": "Expressway / Highway",
            "state": "Tamil Nadu",
            "district": "Chennai",
            "status": "Land Acquisition",
            "coords": [80.237, 13.087],
            "start_location": "Chennai Port Junction (DEMO)",
            "destination": "Ennore Industrial Belt (DEMO)",
            "estimated_budget_cr": 4820.0,
            "target_completion": "2027-03-31",
            "required_land_area_acres": 240.0,
            "current_stage_index": 3,
            "bottleneck_stage_index": 4,
            "selected_route_id": "RT-1042-C",
        },
        {
            "id": "PRJ-1088",
            "name": "Salem Outer Ring Road Expressway (DEMO)",
            "type": "Ring Road / Bypass",
            "state": "Tamil Nadu",
            "district": "Salem",
            "status": "Impact Analysis",
            "coords": [78.146, 11.664],
            "start_location": "Omalur Junction (DEMO)",
            "destination": "Seelanaickenpatti Interchange (DEMO)",
            "estimated_budget_cr": 2150.0,
            "target_completion": "2026-11-30",
            "required_land_area_acres": 180.0,
            "current_stage_index": 2,
            "bottleneck_stage_index": 3,
            "selected_route_id": "RT-1088-A",
        },
        {
            "id": "PRJ-1015",
            "name": "Coimbatore-Pollachi Multi-Modal Logistics Belt (DEMO)",
            "type": "Freight Corridor",
            "state": "Tamil Nadu",
            "district": "Coimbatore",
            "status": "Documentation",
            "coords": [76.955, 11.016],
            "start_location": "Eachanari Industrial Gate (DEMO)",
            "destination": "Kinathukadavu Freight Terminal (DEMO)",
            "estimated_budget_cr": 1680.0,
            "target_completion": "2027-06-30",
            "required_land_area_acres": 140.0,
            "current_stage_index": 4,
            "bottleneck_stage_index": 4,
            "selected_route_id": "RT-1015-B",
        },
        {
            "id": "PRJ-1092",
            "name": "Madurai-Tuticorin High-Speed Freight Spur (DEMO)",
            "type": "Port Connectivity",
            "state": "Tamil Nadu",
            "district": "Madurai",
            "status": "Stakeholder Verification",
            "coords": [78.119, 9.925],
            "start_location": "Kappalur Industrial Hub (DEMO)",
            "destination": "Aruppukkottai Bypass (DEMO)",
            "estimated_budget_cr": 3200.0,
            "target_completion": "2027-12-31",
            "required_land_area_acres": 310.0,
            "current_stage_index": 3,
            "bottleneck_stage_index": 5,
            "selected_route_id": "RT-1092-C",
        },
        {
            "id": "PRJ-1033",
            "name": "Tiruchirappalli Suburban Bypass Viaduct (DEMO)",
            "type": "Elevated Expressway",
            "state": "Tamil Nadu",
            "district": "Tiruchirappalli",
            "status": "Land Identification",
            "coords": [78.704, 10.790],
            "start_location": "Samayapuram Toll Plaza (DEMO)",
            "destination": "Thuvakudi Industrial Estate (DEMO)",
            "estimated_budget_cr": 1450.0,
            "target_completion": "2026-08-31",
            "required_land_area_acres": 110.0,
            "current_stage_index": 1,
            "bottleneck_stage_index": 2,
            "selected_route_id": "RT-1033-A",
        },
        {
            "id": "PRJ-1055",
            "name": "Hosur-Dharmapuri Tech Corridor Bypass (DEMO)",
            "type": "Expressway / Highway",
            "state": "Tamil Nadu",
            "district": "Krishnagiri",
            "status": "Land Acquisition",
            "coords": [77.825, 12.740],
            "start_location": "SIPCOT Industrial Complex (DEMO)",
            "destination": "Rayakottai Road Junction (DEMO)",
            "estimated_budget_cr": 2840.0,
            "target_completion": "2027-09-30",
            "required_land_area_acres": 195.0,
            "current_stage_index": 3,
            "bottleneck_stage_index": 4,
            "selected_route_id": "RT-1055-C",
        },
        {
            "id": "PRJ-1066",
            "name": "Bengaluru Peripheral Satellite Ring Road Link (DEMO)",
            "type": "Ring Road / Bypass",
            "state": "Karnataka",
            "district": "Bengaluru Rural",
            "status": "Stakeholder Verification",
            "coords": [77.594, 12.971],
            "start_location": "Doddaballapur Interchange (DEMO)",
            "destination": "Devanahalli Airport Hub (DEMO)",
            "estimated_budget_cr": 5400.0,
            "target_completion": "2028-02-28",
            "required_land_area_acres": 360.0,
            "current_stage_index": 2,
            "bottleneck_stage_index": 4,
            "selected_route_id": "RT-1066-C",
        },
        {
            "id": "PRJ-1077",
            "name": "Pune-Nashik Semi High-Speed Rail Freight Feeder (DEMO)",
            "type": "Freight Corridor",
            "state": "Maharashtra",
            "district": "Pune",
            "status": "Documentation",
            "coords": [73.856, 18.520],
            "start_location": "Chakan MIDC Node (DEMO)",
            "destination": "Narayangaon Logistics Park (DEMO)",
            "estimated_budget_cr": 3950.0,
            "target_completion": "2027-11-30",
            "required_land_area_acres": 275.0,
            "current_stage_index": 4,
            "bottleneck_stage_index": 5,
            "selected_route_id": "RT-1077-A",
        },
        {
            "id": "PRJ-1081",
            "name": "Kochi-Coimbatore Industrial Spine Spur (DEMO)",
            "type": "Port Connectivity",
            "state": "Kerala",
            "district": "Ernakulam",
            "status": "Land Identification",
            "coords": [76.267, 9.931],
            "start_location": "Vallarpadam ICTT (DEMO)",
            "destination": "Kalamassery Industrial Cluster (DEMO)",
            "estimated_budget_cr": 1850.0,
            "target_completion": "2026-10-31",
            "required_land_area_acres": 125.0,
            "current_stage_index": 1,
            "bottleneck_stage_index": 3,
            "selected_route_id": "RT-1081-C",
        },
        {
            "id": "PRJ-1099",
            "name": "Hyderabad Outer Regional Corridor Link (DEMO)",
            "type": "Expressway / Highway",
            "state": "Telangana",
            "district": "Rangareddy",
            "status": "Impact Analysis",
            "coords": [78.486, 17.385],
            "start_location": "Shamshabad Airport Expressway (DEMO)",
            "destination": "Pharma City Hub (DEMO)",
            "estimated_budget_cr": 4600.0,
            "target_completion": "2027-08-31",
            "required_land_area_acres": 290.0,
            "current_stage_index": 2,
            "bottleneck_stage_index": 4,
            "selected_route_id": "RT-1099-C",
        },
    ]

    for pdata in projects_data:
        p = Project(**pdata)
        db.add(p)

    db.flush()

    # 3. 40 ROUTE ALIGNMENTS (4 routes per project: Route A, B, C, D)
    route_templates = [
        ("Route A", "Minimum Land Impact", 41.2, 4920.0, 72, False, 18, 22),
        ("Route B", "Minimum Cost Alignment", 38.6, 4210.0, 68, False, 32, 45),
        ("Route C", "AI Delay-Optimized Alignment", 39.8, 4450.0, 94, True, 12, 14),
        ("Route D", "Maximum Multi-Modal Connectivity", 44.5, 5280.0, 61, False, 48, 62),
    ]

    for p_idx, pdata in enumerate(projects_data):
        pid = pdata["id"]
        cx, cy = pdata["coords"]
        for idx, (label, strategy, dist_base, cost_base, score, ai_rec, delay_mo, delay_pct) in enumerate(route_templates):
            offset = (idx - 1.5) * 0.004
            path = [
                [round(cx - 0.025, 6), round(cy - 0.018 + offset, 6)],
                [round(cx - 0.012, 6), round(cy - 0.007 + offset * 0.8, 6)],
                [round(cx + 0.000, 6), round(cy + 0.003 + offset * 0.5, 6)],
                [round(cx + 0.015, 6), round(cy + 0.014 + offset * 0.9, 6)],
                [round(cx + 0.028, 6), round(cy + 0.026 + offset, 6)],
            ]
            aff_ids = [f"P-{(p_idx * 15) + 101 + i + idx*2}" for i in range(8 + idx * 2)]
            r = Route(
                id=f"RT-{pid.replace('PRJ-', '')}-{'ABCD'[idx]}",
                project_id=pid,
                label=label,
                strategy=strategy,
                path=path,
                distance_km=round(dist_base + (p_idx * 1.5), 1),
                affected_parcels=len(aff_ids),
                affected_parcel_ids=aff_ids,
                stakeholders=len(aff_ids) + 3,
                estimated_cost_cr=round(cost_base * (1.0 + (p_idx * 0.05)), 1),
                estimated_delay_months=delay_mo,
                delay_probability_pct=delay_pct,
                infrastructure_impact="Low" if idx == 2 else ("Medium" if idx == 0 else "High"),
                overall_score=score,
                ai_recommended=ai_rec,
                corridor_width_meters=32.0,
                lanes=6,
            )
            db.add(r)

    # 4. 130+ CADASTRAL LAND PARCELS & 130+ STAKEHOLDERS (Synthetic Demo Data)
    global_parcel_idx = 1
    for p_idx, pdata in enumerate(projects_data):
        pid = pdata["id"]
        cx, cy = pdata["coords"]
        num_parcels = 14 if p_idx == 0 else 13

        for local_idx in range(1, num_parcels + 1):
            p_id = f"P-{100 + global_parcel_idx}"
            owner_ref = f"DEMO OWNER-{global_parcel_idx:03d}"
            
            # Position around project coords along corridor
            step = (local_idx - num_parcels / 2.0)
            dx = step * 0.0022 + ((global_parcel_idx * 7) % 11 - 5) * 0.0004
            dy = step * 0.0018 + ((global_parcel_idx * 13) % 11 - 5) * 0.0004
            coords = [round(cx + dx, 6), round(cy + dy, 6)]

            # 4-point polygon boundary around centroid
            poly = [
                [round(coords[0] - 0.0005, 6), round(coords[1] - 0.0004, 6)],
                [round(coords[0] + 0.0006, 6), round(coords[1] - 0.0003, 6)],
                [round(coords[0] + 0.0005, 6), round(coords[1] + 0.0005, 6)],
                [round(coords[0] - 0.0004, 6), round(coords[1] + 0.0004, 6)],
                [round(coords[0] - 0.0005, 6), round(coords[1] - 0.0004, 6)],
            ]

            is_disp = (global_parcel_idx % 7 == 0)
            imp = "high" if is_disp or global_parcel_idx % 4 == 0 else ("affected" if global_parcel_idx % 2 == 0 else "potential")
            r_band = "critical" if is_disp else ("high" if imp == "high" else ("medium" if imp == "affected" else "low"))
            area_sqft = 7500 + ((global_parcel_idx * 830) % 22000)

            parcel = Parcel(
                id=p_id,
                project_id=pid,
                route_ids=[f"RT-{pid.replace('PRJ-', '')}-C", f"RT-{pid.replace('PRJ-', '')}-A"],
                coords=coords,
                polygon_coords=poly,
                area_sq_ft=area_sqft,
                impact=imp,
                land_type="Government" if global_parcel_idx % 5 == 0 else "Private",
                owner_ref=owner_ref,
                verification="VERIFIED" if global_parcel_idx % 3 == 0 else ("AWAITING SUPERVISOR VERIFICATION" if global_parcel_idx % 4 == 0 else "PENDING"),
                acquisition_status="IN PROGRESS" if global_parcel_idx % 2 == 0 else ("NOTICE ISSUED" if global_parcel_idx % 3 == 0 else "NOT STARTED"),
                response_status="DISPUTED" if is_disp else ("RECEIVED" if global_parcel_idx % 2 == 0 else "PENDING"),
                notification_status="DELIVERED" if global_parcel_idx % 2 == 0 else "SENT",
                documents_complete=4 if global_parcel_idx % 3 == 0 else (2 if global_parcel_idx % 2 == 0 else 1),
                documents_required=4,
                disputed=is_disp,
                risk_contribution=r_band,
                structures_present=(global_parcel_idx % 3 != 0),
                structure_type="Residential House" if global_parcel_idx % 2 == 0 else "Commercial Shed",
            )
            db.add(parcel)

            # Stakeholder
            fictional_first_names = ["K.", "M.", "S.", "A.", "R.", "V.", "P.", "T."]
            fictional_last_names = ["Subramanian", "Narayanan", "Murugan", "Ramanathan", "Krishnan", "Sundaram", "Chandran", "Perumal"]
            fn = fictional_first_names[global_parcel_idx % len(fictional_first_names)]
            ln = fictional_last_names[global_parcel_idx % len(fictional_last_names)]

            sh = Stakeholder(
                id=f"SH-{global_parcel_idx:03d}",
                ref=owner_ref,
                name=f"{owner_ref} ({fn} {ln} - Demo)",
                project_id=pid,
                parcel_id=p_id,
                parcel_ids=[p_id],
                contact_ref=f"+91 98XXX-XX{global_parcel_idx:03d}",
                status="Disputed" if is_disp else ("Verified" if global_parcel_idx % 3 == 0 else "Pending"),
                response_status="DISPUTED" if is_disp else ("RECEIVED" if global_parcel_idx % 2 == 0 else "PENDING"),
                notification_status="DELIVERED" if global_parcel_idx % 2 == 0 else "SENT",
                documents_complete=(global_parcel_idx % 3 == 0),
                documents_count=4 if global_parcel_idx % 3 == 0 else 2,
                documents_required=4,
                compensation_status="Disbursement Pending" if global_parcel_idx % 4 == 0 else "Not Initiated",
                last_contact="2026-08-28",
                preferred_language="Tamil" if p_idx < 6 else ("Kannada" if p_idx == 6 else "Marathi"),
            )
            db.add(sh)

            # Document
            doc_type = "Ownership" if global_parcel_idx % 3 == 0 else ("Survey" if global_parcel_idx % 2 == 0 else "Legal")
            doc = Document(
                id=f"DOC-{global_parcel_idx:03d}",
                parcel_id=p_id,
                project_id=pid,
                stakeholder_id=sh.id,
                type=doc_type,
                status="Verified" if global_parcel_idx % 3 == 0 else "Uploaded",
                verification_status="VERIFIED" if global_parcel_idx % 3 == 0 else "PENDING",
                file_size="2.6 MB",
                ocr={
                    "extractedFields": {"surveyNo": f"SY-{100+global_parcel_idx}/1A", "owner": owner_ref, "extent": f"{area_sqft/43560.0:.2f} acres"},
                    "confidencePct": 95.2,
                    "humanVerified": (global_parcel_idx % 3 == 0),
                },
            )
            db.add(doc)

            global_parcel_idx += 1

    # 5. FIELD VERIFICATION RECORDS
    field_cases = [
        ("VER-01", "P-101", "PRJ-1042", "OFF-08", "R. Vignesh", "Ennore Sector 3 Cadastral Zone", "Critical", "2026-09-15", "In Progress", 6, 2, "Disputed boundary marker identified along water channel"),
        ("VER-02", "P-104", "PRJ-1042", "OFF-12", "P. Ananthi", "Manali Express Link Survey Grid", "High", "2026-09-18", "Assigned", 3, 0, "Structural assessment for commercial shed encroachment"),
        ("VER-03", "P-108", "PRJ-1042", "OFF-08", "R. Vignesh", "Madhavaram Junction Interchange", "Critical", "2026-09-12", "Awaiting Supervisor Verification", 8, 3, "Survey tree count and residential dwelling valuation completed"),
        ("VER-04", "P-115", "PRJ-1088", "OFF-04", "K. Rajagopal", "Omalur Highway Extension Sector", "Medium", "2026-09-22", "Verified", 4, 1, "Boundary confirmed with adjacent revenue records"),
        ("VER-05", "P-128", "PRJ-1015", "OFF-08", "R. Vignesh", "Eachanari Logistics Grid", "High", "2026-09-25", "In Progress", 5, 2, "Industrial setback measurement verification"),
        ("VER-06", "P-142", "PRJ-1092", "OFF-12", "P. Ananthi", "Kappalur Freight Section", "Medium", "2026-09-28", "Assigned", 2, 0, "Agricultural tenancy survey cross-check"),
    ]
    for cid, pid, prjid, offref, offname, loc, pri, ddl, stat, ph, vid, obs in field_cases:
        fv = FieldVerification(
            id=cid,
            parcel_id=pid,
            project_id=prjid,
            officer_ref=offref,
            officer_name=offname,
            location=loc,
            priority=pri,
            deadline=ddl,
            status=stat,
            verification_status="VERIFIED" if stat == "Verified" else "PENDING",
            gps_captured=True,
            gps_coordinates=[80.237, 13.087],
            photos_count=ph,
            videos_count=vid,
            photo_evidence_ref=f"photo_evidence_{cid.lower()}.jpg",
            video_evidence_ref=f"video_survey_{cid.lower()}.mp4",
            observation=obs,
            supervisor_decision="APPROVED" if stat == "Verified" else ("PENDING" if "Supervisor" in stat else None),
            assigned_date="2026-08-20",
        )
        db.add(fv)

    # 6. CITIZEN GRIEVANCE REPORTS
    citizen_reps = [
        ("CR-01", "PRJ-1042", "Ennore North Village Gate", "Boundary survey peg placed 4 meters inside private agricultural boundary without prior notice.", "Boundary Grievance", True, False, "Under Review", "2026-08-27", "Field officer assigned for re-verification"),
        ("CR-02", "PRJ-1042", "Kosasthalaiyar River Bank", "Proposed viaduct pier location overlaps seasonal irrigation canal culvert.", "Waterbody Protection", True, True, "Verified", "2026-08-29", "Culvert redesign requested to technical team"),
        ("CR-03", "PRJ-1088", "Omalur Highway Extension", "Request for dedicated pedestrian underpass near government higher secondary school.", "Access Road Request", False, False, "Planned", "2026-08-25", "Integrated into revision C alignment"),
        ("CR-04", "PRJ-1015", "Pollachi Road Km 18", "Tree compensation evaluation did not record 40 mature coconut palms on survey plot.", "Compensation Evaluation", True, False, "Under Review", "2026-08-30", "Agricultural officer scheduled for tree census"),
    ]
    for cid, prjid, loc, desc, cat, hp, hv, stat, subat, resp in citizen_reps:
        cr = CitizenReport(
            id=cid,
            project_id=prjid,
            location=loc,
            description=desc,
            category=cat,
            report_type=cat,
            citizen_ref="DEMO CITIZEN",
            has_photo=hp,
            has_video=hv,
            status=stat,
            submitted_at=subat,
            response_note=resp,
        )
        db.add(cr)

    # 7. SYSTEM NOTIFICATIONS
    notifs = [
        ("NTF-01", "Critical Delay Risk", "RISK_INCREASE", "Critical", "Disputed title claim on Parcel P-108 threatens 4.5 month delay on Section 2 viaduct", "PRJ-1042", "P-108", "Project Director", "2026-08-31T14:30:00Z"),
        ("NTF-02", "Legal Dispute", "NOTICE", "High", "Active injunction petition filed in Madurai Sub-Court regarding survey parcel P-101", "PRJ-1042", "P-101", "Legal Officer", "2026-08-30T11:15:00Z"),
        ("NTF-03", "Document Missing", "DOCUMENT_PENDING", "Medium", "Encumbrance Certificate (15-year) pending from 6 landholders in Sector 4", "PRJ-1042", "P-105", "LAO Division", "2026-08-29T09:45:00Z"),
        ("NTF-04", "Field Task", "FIELD_VERIFICATION", "Low", "Field verification completed for 12 parcels along Samayapuram Bypass", "PRJ-1033", "P-150", "Field Team", "2026-08-28T16:20:00Z"),
        ("NTF-05", "Assignment", "PROJECT_ASSIGNMENT", "Medium", "New corridor alignment review assigned for Hosur-Dharmapuri Tech Corridor", "PRJ-1055", None, "Dr. A. Sundaram", "2026-08-31T10:00:00Z"),
    ]
    for nid, cat, n_type, sev, msg, prjid, parid, recip, ts in notifs:
        n = Notification(
            id=nid,
            category=cat,
            type=n_type,
            severity=sev,
            message=msg,
            project_id=prjid,
            parcel_id=parid,
            recipient=recip,
            channel="In-App",
            timestamp=ts,
            read=False,
        )
        db.add(n)

    # 8. PREDICTIVE RISK SCORES & RISK FACTORS FOR ALL 10 PROJECTS
    risk_data = [
        ("PRJ-1042", 87, "critical", "+5.2 months", 91, [42, 54, 68, 76, 87], "Escalating", 24, 31),
        ("PRJ-1088", 68, "high", "+3.8 months", 86, [38, 48, 56, 64, 68], "Escalating", 20, 25),
        ("PRJ-1015", 52, "medium", "+2.4 months", 83, [32, 40, 46, 50, 52], "Moderate", 18, 21),
        ("PRJ-1092", 74, "high", "+4.1 months", 88, [45, 52, 60, 69, 74], "Escalating", 28, 33),
        ("PRJ-1033", 38, "low", "+0.8 months", 89, [25, 28, 32, 36, 38], "Stable", 16, 17),
        ("PRJ-1055", 79, "critical", "+4.6 months", 90, [40, 50, 62, 71, 79], "Escalating", 22, 28),
        ("PRJ-1066", 64, "high", "+3.2 months", 85, [35, 42, 51, 58, 64], "Moderate", 26, 30),
        ("PRJ-1077", 48, "medium", "+1.9 months", 82, [30, 36, 42, 45, 48], "Stable", 24, 26),
        ("PRJ-1081", 58, "medium", "+2.7 months", 84, [34, 41, 49, 54, 58], "Moderate", 18, 21),
        ("PRJ-1099", 71, "high", "+3.9 months", 87, [44, 51, 59, 66, 71], "Escalating", 24, 29),
    ]

    for prjid, overall, band, delay_lbl, conf, trend, tr_stat, orig_mo, pred_mo in risk_data:
        categories = [
            {"name": "Legal Dispute", "pct": min(95, overall + 8)},
            {"name": "Documentation", "pct": min(95, overall - 4)},
            {"name": "Compensation", "pct": min(95, overall - 12)},
            {"name": "Approval", "pct": min(95, overall + 2)},
            {"name": "Stakeholder Response", "pct": min(95, overall - 6)},
        ]
        drivers = [
            {"label": "Cadastral Title Disputes in Corridor Section", "contributionPct": 32},
            {"label": "Environmental NOC / Canal Clearance Latency", "contributionPct": 24},
            {"label": "Unresponsive Stakeholder Notice Acknowledgments", "contributionPct": 18},
        ]
        rp = RiskPrediction(
            id=f"RISK-{prjid}",
            project_id=prjid,
            overall_pct=overall,
            band=band,
            predicted_delay_label=delay_lbl,
            confidence_pct=conf,
            trend=trend,
            trend_status=tr_stat,
            categories=categories,
            drivers=drivers,
            original_completion_months=orig_mo,
            predicted_completion_months=pred_mo,
            delay_probability=round(overall / 100.0, 2),
            risk_score=overall,
            risk_category=band.upper(),
            expected_delay_months=float(delay_lbl.replace("+", "").replace(" months", "")),
            expected_delay_days=int(float(delay_lbl.replace("+", "").replace(" months", "")) * 30),
            model_version="1.0.0-rf",
            recommendations=[
                {
                    "id": "REC-01",
                    "category": "Legal & Title",
                    "priority": "Critical" if overall >= 75 else "High",
                    "title": "Prioritize Fast-Track Mediation on Disputed Parcels",
                    "action": "Convene Special Revenue Divisional Officer (RDO) sittings for accelerated title deed dispute settlement.",
                    "estimatedRiskReductionPct": 18,
                    "affectedParcelsCount": 3,
                },
                {
                    "id": "REC-02",
                    "category": "Documentation",
                    "priority": "High",
                    "title": "Enable AI Automated Document Verification & OCR",
                    "action": "Initiate automated cadastral OCR processing to resolve pending survey and ownership record discrepancies.",
                    "estimatedRiskReductionPct": 14,
                    "affectedParcelsCount": 8,
                },
            ],
            prediction_metadata={"seeded": True},
        )
        db.add(rp)

        # Risk Factors
        rf1 = RiskFactor(
            id=f"RF-{prjid}-01",
            project_id=prjid,
            prediction_id=f"RISK-{prjid}",
            factor_name="Multiple Disputed Title Deeds",
            category="Legal",
            score=float(min(95, overall + 5)),
            weight=1.5,
            description="Competing heir claims on ancestral agricultural parcels",
            mitigation="Fast-track Revenue Divisional Officer (RDO) special inquiry sitting",
        )
        rf2 = RiskFactor(
            id=f"RF-{prjid}-02",
            project_id=prjid,
            prediction_id=f"RISK-{prjid}",
            factor_name="Canal Crossing Statutory Clearance",
            category="Environmental",
            score=float(min(90, overall - 8)),
            weight=1.2,
            description="Water Resource Department permission pending for viaduct piers",
            mitigation="Submit revised hydraulic clearance flow modeling data",
        )
        db.add(rf1)
        db.add(rf2)

    # 9. AUDIT LOGS FOR PROJECTS
    audit_samples = [
        ("PRJ-1042", "Project Director", "PROJECT_CREATED", "Project", "PRJ-1042", "Project Initialized", "System", "Chennai-Bengaluru corridor setup"),
        ("PRJ-1042", "GIS Team", "ROUTE_CREATED", "Route", "RT-1042-C", "Route C AI Alignment Created", "Route Selection", "Optimized path generated"),
        ("PRJ-1042", "LAO Officer", "NOTICE_SENT", "Stakeholder", "SH-001", "Section 11(1) Notice Sent", "Compensation", "Dispatched to DEMO OWNER-001"),
        ("PRJ-1042", "R. Vignesh", "FIELD_VERIFIED", "FieldVerification", "VER-01", "Boundary verification recorded", "Verification", "GPS coords captured"),
    ]
    for prjid, actr, actn, ent, entid, lbl, cat, det in audit_samples:
        log = AuditLog(
            id=f"AUD-{uuid.uuid4().hex[:6].upper()}",
            project_id=prjid,
            actor=actr,
            action=actn,
            entity=ent,
            entity_id=entid,
            label=lbl,
            category=cat,
            details=det,
            time="11:30:00",
            date="2026-08-30",
        )
        db.add(log)

    # 10. OFFICER PERFORMANCE & INCENTIVE PROFILES
    officer_seeds = [
        ("OFF-01", "R. Vignesh (Senior Field Officer)", "FIELD_OFFICER", "Chennai", "South Zone", 320, 28, 26, 85.0, 97.5, 96.0, True, 1, "Diamond"),
        ("OFF-02", "S. Priya (Cadastral Surveyor)", "SURVEY_OFFICER", "Salem", "West Zone", 240, 22, 20, 92.0, 96.0, 94.0, True, 2, "Platinum"),
        ("OFF-03", "K. Ananth (Special LAO)", "LAND_ACQUISITION_OFFICER", "Madurai", "South Zone", 195, 18, 16, 110.0, 94.0, 91.0, True, 1, "Gold"),
        ("OFF-04", "M. Karthik (Legal Specialist)", "LEGAL_OFFICER", "Chennai", "South Zone", 280, 25, 24, 75.0, 98.0, 97.0, True, 0, "Platinum"),
        ("OFF-05", "D. Selvi (Field Verification Lead)", "FIELD_OFFICER", "Coimbatore", "West Zone", 160, 15, 13, 115.0, 93.0, 89.0, True, 2, "Gold"),
        ("OFF-06", "T. Natarajan (Cadastral Supervisor)", "SUPERVISOR", "Tiruchirappalli", "Central Zone", 210, 30, 29, 60.0, 99.0, 98.0, True, 1, "Platinum"),
    ]
    for oid, name, role, dist, zone, pts, comp, ont, resp, acc, sla, avail, wl, tier in officer_seeds:
        op = OfficerProfile(
            id=oid,
            name=name,
            role=role,
            district=dist,
            zone=zone,
            total_points=pts,
            completed_tasks=comp,
            on_time_tasks=ont,
            avg_response_time_sec=resp,
            verification_accuracy_pct=acc,
            sla_compliance_pct=sla,
            is_available=avail,
            current_workload=wl,
            active_district=dist,
            points_tier=tier,
        )
        db.add(op)

    # 11. CONTRACTOR WORK PACKAGES
    contractor_seeds = [
        ("PKG-1042-01", "PRJ-1042", "Larsen & Toubro Infra Consortium", "EPC-LNT01", "Package 1: Earthwork & Viaduct Foundation (Km 0-25)", 45.0, 42.0, -3.0, "IN_PROGRESS", "LOW", "2026-06-01", "2027-12-31"),
        ("PKG-1042-02", "PRJ-1042", "Tata Projects Infrastructure Ltd", "EPC-TATA02", "Package 2: Elevated Superstructure & Deck Slabs (Km 25-50)", 30.0, 22.0, -8.0, "DELAYED", "HIGH", "2026-07-15", "2028-03-31"),
        ("PKG-1088-01", "PRJ-1088", "Afcons Infrastructure Ltd", "EPC-AFCON1", "Salem Ring Road Civil Structures Package", 20.0, 20.0, 0.0, "IN_PROGRESS", "LOW", "2026-08-01", "2027-09-30"),
    ]
    for pid, prjid, cname, cref, pkgname, pl, act, var, stat, drisk, asgn, tgt in contractor_seeds:
        cwp = ContractorWorkPackage(
            id=pid,
            project_id=prjid,
            contractor_name=cname,
            contractor_ref=cref,
            package_name=pkgname,
            planned_progress_pct=pl,
            actual_progress_pct=act,
            variance_pct=var,
            status=stat,
            delay_risk=drisk,
            assigned_date=asgn,
            target_date=tgt,
        )
        db.add(cwp)

    # 12. GOVERNMENT ALERTS
    gov_seeds = [
        ("GOV-ALT-01", "PRJ-1042", "Chennai-Bengaluru Industrial Corridor", 87, "Critical cadastral title dispute cluster threatening 5.2 month corridor viaduct delay", "Ennore North Section 2", 14, 45, "Convene Special RDO inquiry sitting and fast-track SLAC clearance", "District Revenue Administration & NHAI Special Cell", "CRITICAL", "ACTIVE"),
        ("GOV-ALT-02", "PRJ-1055", "Hosur-Dharmapuri Tech Corridor", 79, "Environmental canal crossing clearance latency exceeding statutory window by 45 days", "Kosasthalaiyar River Viaduct", 8, 20, "Elevate hydraulic clearance flow model to State Environmental Authority", "State Environmental Clearance Authority", "HIGH", "ACTIVE"),
    ]
    for gid, prjid, pname, rscore, rsn, area, pcount, pop, rec_act, auth, sev, stat in gov_seeds:
        ga = GovernmentAlert(
            id=gid,
            project_id=prjid,
            project_name=pname,
            risk_score=rscore,
            reason=rsn,
            affected_area=area,
            affected_parcels_count=pcount,
            affected_population=pop,
            recommended_action=rec_act,
            responsible_authority=auth,
            severity=sev,
            status=stat,
        )
        db.add(ga)

    # 13. STAKEHOLDER PARTICIPATION BENEFIT
    benefit_seeds = [
        ("BEN-01", "SH-001", "PRJ-1042", "DEMO OWNER-001", "DEMO PARTICIPATION / EMPLOYMENT BENEFIT", "Field Support", "ACTIVE", 15000.0, "2026-08-01", "2026-12-31", "Local cadastral boundary verification facilitation"),
        ("BEN-02", "SH-002", "PRJ-1042", "DEMO OWNER-002", "DEMO PARTICIPATION / EMPLOYMENT BENEFIT", "Survey Assistance", "ACTIVE", 18000.0, "2026-08-15", "2027-01-31", "Agricultural parcel peg survey logistics support"),
    ]
    for bid, shid, prjid, oref, btype, cat, stat, stp, sdate, edate, nts in benefit_seeds:
        sbr = StakeholderBenefitRecord(
            id=bid,
            stakeholder_id=shid,
            project_id=prjid,
            owner_ref=oref,
            benefit_type=btype,
            category=cat,
            status=stat,
            stipend_amount_inr=stp,
            start_date=sdate,
            end_date=edate,
            notes=nts,
        )
        db.add(sbr)

    # 14. PHASE 6 MULTI-DESIGN ALTERNATIVES & VERSIONING
    from backend.app.services.design_service import generate_ai_designs, approve_design_version
    primary_project_ids = ["PRJ-1042", "PRJ-1088", "PRJ-1015", "PRJ-1092", "PRJ-1033"]
    for pid in primary_project_ids:
        generate_ai_designs(db, project_id=pid, count=4)

    # Approve Design D for PRJ-1042
    approve_design_version(db, design_id="DSG-PRJ-1042-D", approved_by="Dr. A. Sundaram (Project Director)")

    # 15. PROJECT-SPECIFIC RBAC ASSIGNMENTS
    assignment_seeds = [
        ("ASN-1042-01", "PRJ-1042", "head-01", "Dr. A. Sundaram (DEMO)", "PROJECT_HEAD", "Project Director — National Corridors"),
        ("ASN-1042-02", "PRJ-1042", "dist-01", "M. K. Revathi IAS (DEMO)", "DISTRICT_OFFICER", "District Collector — Chennai"),
        ("ASN-1042-03", "PRJ-1042", "field-01", "R. Vignesh (DEMO)", "FIELD_OFFICER", "Senior Field Surveyor"),
        ("ASN-1042-04", "PRJ-1042", "con-01", "Larsen & Toubro Infra Consortium", "CONTRACTOR", "EPC Highway Contractor"),
        ("ASN-1088-01", "PRJ-1088", "head-01", "Dr. A. Sundaram (DEMO)", "PROJECT_HEAD", "Project Director"),
        ("ASN-1088-02", "PRJ-1088", "field-02", "S. Prakash (DEMO)", "FIELD_OFFICER", "Field Surveyor"),
        ("ASN-1088-03", "PRJ-1088", "con-02", "Afcons Infrastructure Ltd", "CONTRACTOR", "EPC Highway Contractor"),
        ("ASN-1015-01", "PRJ-1015", "field-01", "R. Vignesh (DEMO)", "FIELD_OFFICER", "Senior Field Surveyor"),
        ("ASN-1015-02", "PRJ-1015", "con-01", "Larsen & Toubro Infra Consortium", "CONTRACTOR", "EPC Highway Contractor"),
    ]
    for aid, prjid, uid, uname, role, desig in assignment_seeds:
        pa = ProjectAssignment(
            id=aid,
            project_id=prjid,
            user_id=uid,
            user_name=uname,
            role=role,
            designation=desig,
            status="ACTIVE",
        )
        db.add(pa)

    # 16. CONTRACTOR DESIGN CHANGE REQUEST
    cr_seed = DesignChangeRequest(
        id="CR-PRJ-1042-01",
        project_id="PRJ-1042",
        design_id="DSG-PRJ-1042-D",
        version_id="VER-DSG-PRJ-1042-D-V1",
        contractor_id="con-01",
        contractor_name="Larsen & Toubro Infra Consortium",
        title="Viaduct Alignment Shift at Km 14 to avoid Waterbody Canal",
        reason="Ground soil probe revealed high water table at Pier 42-48. Minor 35m northern shift saves ₹14 Cr in deep piling foundations.",
        requested_modifications={"shiftDirection": "North", "offsetMeters": 35.0, "affectedPiers": "42-48"},
        proposed_geometry=[
            [80.222, 13.067],
            [80.235, 13.098],
            [80.248, 13.135],
            [80.264, 13.175],
            [80.278, 13.205],
        ],
        officer_review_status="PENDING",
        ai_impact_analysis={
            "costDeltaCr": -14.2,
            "riskDeltaPct": -6,
            "timeDeltaMonths": -1.0,
            "newScore": 96,
            "recommendation": "Favorable — Reduces Foundation Risk and Piling Delay",
        },
    )
    db.add(cr_seed)

    db.commit()
    print("Database seeding completed successfully with 10 projects, multi-designs, versioning, 130+ parcels, officer profiles, contractors, and alerts.")

