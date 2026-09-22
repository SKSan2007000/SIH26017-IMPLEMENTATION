import sys
import os
import types

# Ensure backend and repository root are in Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(backend_dir)
for p in [root_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Create module alias so 'import app...' and 'import backend.app...' both resolve identically
try:
    import backend.app
except ImportError:
    try:
        import app as app_module
        backend_pkg = types.ModuleType("backend")
        backend_pkg.app = app_module
        sys.modules["backend"] = backend_pkg
        sys.modules["backend.app"] = app_module
    except Exception as e:
        print(f"Notice: backend module alias initialization: {e}")

from backend.app.main import app
from backend.app.db.database import init_db, engine

# Initialize database schema and baseline demo users on cold start
try:
    init_db(engine)
except Exception as e:
    print(f"Notice during main.py init_db: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

