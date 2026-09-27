import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.core.config import settings
from app.db.database import SessionLocal, Base, engine
from app.db.seed import seed_database
import app.db.models


def main():
    force = "--force" in sys.argv or "-f" in sys.argv
    print("Resetting/Ensuring all database tables exist...")
    if force:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db, force=force)
        print("Done!")
    finally:
        db.close()


if __name__ == "__main__":
    main()
