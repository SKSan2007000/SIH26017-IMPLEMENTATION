import os
import json
import logging
from typing import List, Union, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("landguard.config")


def get_default_db_url() -> str:
    """Resolve database URL from various production environment variable names, normalizing postgres:// to postgresql://."""
    url = (
        os.environ.get("DATABASE_URL")
        or os.environ.get("POSTGRES_URL")
        or os.environ.get("POSTGRES_PRISMA_URL")
        or os.environ.get("POSTGRES_URL_NON_POOLING")
    )
    if url:
        # SQLAlchemy 2.0 requires postgresql:// instead of postgres://
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    is_prod = (
        os.environ.get("ENVIRONMENT", "").lower() in ["production", "prod"]
        or bool(os.environ.get("RAILWAY_ENVIRONMENT"))
        or bool(os.environ.get("RAILWAY_PROJECT_ID"))
    )
    
    if is_prod and not os.environ.get("ALLOW_SQLITE_IN_PROD"):
        logger.warning("DATABASE_URL is not set in production. Using local SQLite fallback. Set DATABASE_URL in Railway for persistent PostgreSQL.")

    # Canonical SQLite path anchored to workspace / backend root directory
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    db_path = os.path.join(base_dir, "landguard.db")
    return f"sqlite:///{db_path}"


def get_masked_db_url(url: str) -> str:
    """Returns database type and masked connection target without exposing credentials."""
    if not url:
        return "None"
    if url.startswith("sqlite"):
        return f"SQLite ({url.split('///')[-1] if '///' in url else 'local'})"
    try:
        prefix, rest = url.split("://", 1)
        if "@" in rest:
            user_part, host_part = rest.split("@", 1)
            username = user_part.split(":")[0]
            return f"{prefix}://{username}:****@{host_part}"
        return f"{prefix}://{rest}"
    except Exception:
        return "PostgreSQL (configured)"


def get_default_secret_key() -> str:
    """Resolve JWT secret key from environment."""
    return (
        os.environ.get("SECRET_KEY")
        or os.environ.get("JWT_SECRET")
        or os.environ.get("JWT_SECRET_KEY")
        or "landguard-production-jwt-signing-secret-key-2026"
    )


def get_default_algorithm() -> str:
    """Resolve JWT algorithm from environment."""
    return (
        os.environ.get("ALGORITHM")
        or os.environ.get("JWT_ALGORITHM")
        or "HS256"
    )


class Settings(BaseSettings):
    PROJECT_NAME: str = "LandGuard AI API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = get_default_secret_key()
    ALGORITHM: str = get_default_algorithm()
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours

    # Database URL: PostgreSQL+PostGIS on Railway or SQLite local fallback
    DATABASE_URL: str = get_default_db_url()

    # CORS origins
    BACKEND_CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://sih-26017-implementation-cgq5.vercel.app",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        origins: List[str] = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
            "https://sih-26017-implementation-cgq5.vercel.app",
        ]
        frontend_url = os.environ.get("FRONTEND_URL")
        if frontend_url and frontend_url not in origins:
            origins.append(frontend_url)

        env_cors = os.environ.get("CORS_ORIGINS") or os.environ.get("BACKEND_CORS_ORIGINS")
        if env_cors:
            v = env_cors

        if isinstance(v, str) and not v.startswith("["):
            for item in v.split(","):
                item_clean = item.strip()
                if item_clean and item_clean not in origins:
                    origins.append(item_clean)
            return origins
        elif isinstance(v, str) and v.startswith("["):
            try:
                parsed = json.loads(v)
                for item in parsed:
                    if item not in origins:
                        origins.append(item)
                return origins
            except Exception:
                return origins
        elif isinstance(v, list):
            for item in v:
                if item not in origins:
                    origins.append(item)
            return origins
        return origins

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


settings = Settings()
