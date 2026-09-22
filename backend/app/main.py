import sys
import os
import types

# Ensure backend and repository root are in Python path
app_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(app_dir)
root_dir = os.path.dirname(backend_dir)
for p in [root_dir, backend_dir, app_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.app.core.config import settings
from backend.app.db.database import engine, Base, SessionLocal, init_db
import backend.app.db.models  # load all models
from backend.app.db.seed import seed_database
from backend.app.api.routes import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and auto-seed if empty
    init_db(engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield
    # Shutdown logic if needed


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Predictive Analytics System for Early Detection of Land Acquisition Delays (SIH26017) — Backend API",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS: support origins from settings, local dev ports, origin regex, methods, headers, and preflight max_age
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
if isinstance(settings.BACKEND_CORS_ORIGINS, list):
    for o in settings.BACKEND_CORS_ORIGINS:
        if o not in origins:
            origins.append(o)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:[0-9]+)?|https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,
)


@app.get("/health", tags=["System Health"])
@app.get("/api/backend/health", tags=["System Health"])
def health_check():
    return {"status": "ok", "service": "LandGuard API"}


# Include routes on standard paths and Vercel Services /api/backend path
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(api_router, prefix="/api")
app.include_router(api_router, prefix="/api/backend/v1")
app.include_router(api_router, prefix="/api/backend/api/v1")
app.include_router(api_router, prefix="/api/backend")
app.include_router(api_router, prefix="")



import os
from fastapi.staticfiles import StaticFiles

# Mount static files directory for evidence photos & design packages (serverless safe)
UPLOAD_DIR = os.environ.get("UPLOAD_DIR")
if not UPLOAD_DIR:
    if os.environ.get("VERCEL"):
        UPLOAD_DIR = "/tmp/landguard_uploads"
    else:
        UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "uploads"))

try:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
except Exception as e:
    print(f"Notice: Static upload directory mounting: {e}")



# Preflight options handler
@app.options("/{rest_of_path:path}", include_in_schema=False)
async def preflight_handler(rest_of_path: str):
    return Response(status_code=200)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
