import os
import shutil
import logging
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

logger = logging.getLogger("landguard.db")

db_url = settings.DATABASE_URL

if os.environ.get("VERCEL") and db_url.startswith("sqlite"):
    tmp_db_path = "/tmp/landguard.db"
    if not os.path.exists(tmp_db_path):
        possible_srcs = [
            os.path.abspath("landguard.db"),
            os.path.abspath("backend/landguard.db"),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "landguard.db")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "landguard.db")),
        ]
        for src in possible_srcs:
            if os.path.exists(src) and os.path.isfile(src):
                try:
                    shutil.copy2(src, tmp_db_path)
                    logger.info(f"Copied base database from {src} to {tmp_db_path}")
                    break
                except Exception as e:
                    logger.warning(f"Notice: SQLite /tmp initialization: {e}")
    db_url = f"sqlite:///{tmp_db_path}"

connect_args = {}
engine_kwargs = {"echo": False}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False, "timeout": 30}
    engine_kwargs["connect_args"] = connect_args
else:
    # PostgreSQL production pool settings
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(
    db_url,
    **engine_kwargs,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

_db_initialized = False


def ensure_schema_migrations(eng=None):
    """Ensures newly added columns are present in existing database tables."""
    target_engine = eng or engine
    try:
        inspector = inspect(target_engine)
        tables = inspector.get_table_names()
        with target_engine.connect() as conn:
            if "users" in tables:
                cols = [c["name"] for c in inspector.get_columns("users")]
                if "district" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN district VARCHAR"))
                if "zone" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN zone VARCHAR"))
                if "address" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN address VARCHAR"))
                conn.commit()

            if "projects" in tables:
                cols = [c["name"] for c in inspector.get_columns("projects")]
                new_project_cols = [
                    ("workflow_state", "VARCHAR DEFAULT 'PLANNING'"),
                    ("overall_progress", "FLOAT DEFAULT 25.0"),
                    ("land_acquisition_progress", "FLOAT DEFAULT 30.0"),
                    ("construction_progress", "FLOAT DEFAULT 0.0"),
                    ("parcels_count", "INTEGER DEFAULT 0"),
                    ("stakeholders_count", "INTEGER DEFAULT 0"),
                    ("active_contractor_id", "VARCHAR"),
                    ("description", "VARCHAR"),
                    ("taluk", "VARCHAR"),
                    ("city", "VARCHAR"),
                    ("priority", "VARCHAR DEFAULT 'HIGH'"),
                    ("corridor_length_km", "FLOAT"),
                    ("right_of_way_m", "FLOAT"),
                    ("project_head_id", "VARCHAR"),
                    ("district_officer_id", "VARCHAR"),
                    ("lao_id", "VARCHAR"),
                    ("field_officer_id", "VARCHAR"),
                    ("supervisor_id", "VARCHAR"),
                ]
                for col_name, col_type in new_project_cols:
                    if col_name not in cols:
                        conn.execute(text(f"ALTER TABLE projects ADD COLUMN {col_name} {col_type}"))
                conn.commit()

            if "parcels" in tables:
                cols = [c["name"] for c in inspector.get_columns("parcels")]
                new_parcel_cols = [
                    ("workflow_status", "VARCHAR DEFAULT 'IDENTIFIED'"),
                    ("response_status", "VARCHAR DEFAULT 'PENDING'"),
                    ("notification_status", "VARCHAR DEFAULT 'NOT SENT'"),
                    ("verification", "VARCHAR DEFAULT 'PENDING'"),
                    ("acquisition_status", "VARCHAR DEFAULT 'NOT STARTED'"),
                    ("polygon_coords", "JSON"),
                    ("structures_present", "BOOLEAN DEFAULT FALSE"),
                    ("structure_type", "VARCHAR"),
                    ("disputed", "BOOLEAN DEFAULT FALSE"),
                    ("risk_contribution", "VARCHAR DEFAULT 'low'"),
                    ("area_sq_ft", "FLOAT DEFAULT 10000.0"),
                    ("documents_complete", "INTEGER DEFAULT 0"),
                    ("documents_required", "INTEGER DEFAULT 4"),
                ]
                for col_name, col_type in new_parcel_cols:
                    if col_name not in cols:
                        conn.execute(text(f"ALTER TABLE parcels ADD COLUMN {col_name} {col_type}"))
                conn.commit()

            if "documents" in tables:
                cols = [c["name"] for c in inspector.get_columns("documents")]
                new_doc_cols = [
                    ("file_url", "VARCHAR"),
                    ("verification_status", "VARCHAR DEFAULT 'PENDING'"),
                ]
                for col_name, col_type in new_doc_cols:
                    if col_name not in cols:
                        conn.execute(text(f"ALTER TABLE documents ADD COLUMN {col_name} {col_type}"))
                conn.commit()

            if "project_assignments" in tables:
                cols = [c["name"] for c in inspector.get_columns("project_assignments")]
                new_assign_cols = [
                    ("assignment_score", "FLOAT"),
                    ("assignment_reason", "TEXT"),
                    ("score_breakdown", "JSON"),
                    ("capacity_status", "VARCHAR DEFAULT 'AVAILABLE'"),
                    ("assigned_at", "DATETIME"),
                ]
                for col_name, col_type in new_assign_cols:
                    if col_name not in cols:
                        conn.execute(text(f"ALTER TABLE project_assignments ADD COLUMN {col_name} {col_type}"))
                conn.commit()

            if "field_verifications" in tables:
                cols = [c["name"] for c in inspector.get_columns("field_verifications")]
                new_fv_cols = [
                    ("task_created_at", "DATETIME"),
                    ("accepted_at", "DATETIME"),
                    ("completed_at", "DATETIME"),
                    ("deadline_at", "DATETIME"),
                    ("response_time_seconds", "FLOAT"),
                    ("completion_time_seconds", "FLOAT"),
                    ("sla_status", "VARCHAR DEFAULT 'ON_TIME'"),
                    ("sla_seconds_allowed", "INTEGER DEFAULT 300"),
                    ("escalation_level", "VARCHAR DEFAULT 'NONE'"),
                    ("escalated_at", "DATETIME"),
                    ("escalation_reason", "VARCHAR"),
                    ("verification_status", "VARCHAR DEFAULT 'PENDING'"),
                    ("gps_captured", "BOOLEAN DEFAULT TRUE"),
                    ("gps_coordinates", "JSON"),
                    ("photos_count", "INTEGER DEFAULT 0"),
                    ("videos_count", "INTEGER DEFAULT 0"),
                    ("photo_evidence_ref", "VARCHAR"),
                    ("video_evidence_ref", "VARCHAR"),
                    ("assigned_date", "VARCHAR"),
                    ("completed_date", "VARCHAR"),
                    ("allocation_reason", "VARCHAR"),
                    ("officer_zone", "VARCHAR"),
                    ("officer_district", "VARCHAR"),
                    ("proximity_km", "FLOAT"),
                    ("supervisor_decision", "VARCHAR"),
                    ("observation", "TEXT"),
                ]
                for col_name, col_type in new_fv_cols:
                    if col_name not in cols:
                        conn.execute(text(f"ALTER TABLE field_verifications ADD COLUMN {col_name} {col_type}"))
                conn.commit()

            if "risk_predictions" in tables:
                cols = [c["name"] for c in inspector.get_columns("risk_predictions")]
                new_rp_cols = [
                    ("delay_probability", "FLOAT DEFAULT 0.50"),
                    ("risk_score", "INTEGER DEFAULT 50"),
                    ("risk_category", "VARCHAR DEFAULT 'MEDIUM'"),
                    ("expected_delay_months", "FLOAT DEFAULT 3.5"),
                    ("expected_delay_days", "INTEGER DEFAULT 105"),
                    ("model_version", "VARCHAR DEFAULT '1.0.0-rf'"),
                    ("recommendations", "JSON"),
                    ("prediction_metadata", "JSON"),
                    ("predicted_at", "DATETIME"),
                ]
                for col_name, col_type in new_rp_cols:
                    if col_name not in cols:
                        conn.execute(text(f"ALTER TABLE risk_predictions ADD COLUMN {col_name} {col_type}"))
                conn.commit()

            if "officer_profiles" in tables:
                cols = [c["name"] for c in inspector.get_columns("officer_profiles")]
                new_op_cols = [
                    ("points_tier", "VARCHAR DEFAULT 'Gold'"),
                    ("active_district", "VARCHAR DEFAULT 'Chennai'"),
                    ("current_workload", "INTEGER DEFAULT 0"),
                    ("is_available", "BOOLEAN DEFAULT TRUE"),
                ]
                for col_name, col_type in new_op_cols:
                    if col_name not in cols:
                        conn.execute(text(f"ALTER TABLE officer_profiles ADD COLUMN {col_name} {col_type}"))
                conn.commit()

            if "notifications" in tables:
                cols = [c["name"] for c in inspector.get_columns("notifications")]
                new_notif_cols = [
                    ("title", "VARCHAR DEFAULT 'Platform Notification'"),
                    ("action_url", "VARCHAR"),
                    ("priority", "VARCHAR DEFAULT 'HIGH'"),
                ]
                for col_name, col_type in new_notif_cols:
                    if col_name not in cols:
                        conn.execute(text(f"ALTER TABLE notifications ADD COLUMN {col_name} {col_type}"))
                conn.commit()
    except Exception as e:
        logger.warning(f"Warning during schema migration: {e}")



def init_db(target_engine=None):
    """Initializes schema and ensures demo seed data is present."""
    global _db_initialized
    eng = target_engine or engine
    try:
        # Import all models to register them with Base.metadata
        import app.db.models  # noqa: F401
        Base.metadata.create_all(bind=eng)
        ensure_schema_migrations(eng)
        
        # Verify demo user presence
        from app.db.models.user import User
        from app.db.seed import seed_database
        
        db = SessionLocal()
        try:
            admin_user = db.query(User).filter(User.email == "admin@landguard.ai").first()
            if not admin_user:
                logger.info("Initializing baseline database with demo users & projects...")
                seed_database(db, force=False)
        finally:
            db.close()
            
        _db_initialized = True
    except Exception as e:
        logger.error(f"Error initializing database: {e}", exc_info=True)


# Note: DB initialization runs cleanly in FastAPI lifespan or lazily in get_db
# init_db(engine) removed from top-level to prevent blocking module import


def get_db():
    global _db_initialized
    if not _db_initialized:
        try:
            init_db(engine)
        except Exception as e:
            logger.warning(f"Lazy init_db in get_db exception: {e}")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


