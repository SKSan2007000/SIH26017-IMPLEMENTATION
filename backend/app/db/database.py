from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from backend.app.core.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def ensure_schema_migrations(eng=None):
    """Ensures newly added columns are present in existing SQLite tables."""
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

            if "project_assignments" in tables:
                cols = [c["name"] for c in inspector.get_columns("project_assignments")]
                new_assign_cols = [
                    ("assignment_score", "FLOAT"),
                    ("assignment_reason", "TEXT"),
                    ("score_breakdown", "JSON"),
                    ("capacity_status", "VARCHAR DEFAULT 'AVAILABLE'"),
                ]
                for col_name, col_type in new_assign_cols:
                    if col_name not in cols:
                        conn.execute(text(f"ALTER TABLE project_assignments ADD COLUMN {col_name} {col_type}"))
                conn.commit()

            if "field_verifications" in tables:
                cols = [c["name"] for c in inspector.get_columns("field_verifications")]
                if "allocation_reason" not in cols:
                    conn.execute(text("ALTER TABLE field_verifications ADD COLUMN allocation_reason VARCHAR"))
                if "officer_zone" not in cols:
                    conn.execute(text("ALTER TABLE field_verifications ADD COLUMN officer_zone VARCHAR"))
                if "officer_district" not in cols:
                    conn.execute(text("ALTER TABLE field_verifications ADD COLUMN officer_district VARCHAR"))
                if "proximity_km" not in cols:
                    conn.execute(text("ALTER TABLE field_verifications ADD COLUMN proximity_km FLOAT"))
                conn.commit()

            if "notifications" in tables:
                cols = [c["name"] for c in inspector.get_columns("notifications")]
                if "title" not in cols:
                    conn.execute(text("ALTER TABLE notifications ADD COLUMN title VARCHAR DEFAULT 'Platform Notification'"))
                if "action_url" not in cols:
                    conn.execute(text("ALTER TABLE notifications ADD COLUMN action_url VARCHAR"))
                if "priority" not in cols:
                    conn.execute(text("ALTER TABLE notifications ADD COLUMN priority VARCHAR DEFAULT 'HIGH'"))
                conn.commit()
    except Exception as e:
        print(f"Warning during schema migration: {e}")


# Run migrations on import
ensure_schema_migrations(engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

