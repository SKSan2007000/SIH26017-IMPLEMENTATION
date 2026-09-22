import os
import json
from typing import List, Union, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def get_default_db_url() -> str:
    """Resolve database URL from various production environment variable names."""
    url = (
        os.environ.get("DATABASE_URL")
        or os.environ.get("POSTGRES_URL")
        or os.environ.get("POSTGRES_PRISMA_URL")
        or os.environ.get("POSTGRES_URL_NON_POOLING")
        or "sqlite:///./landguard.db"
    )
    # SQLAlchemy 2.0 requires postgresql:// instead of postgres://
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


def get_default_secret_key() -> str:
    """Resolve JWT secret key from environment."""
    return (
        os.environ.get("SECRET_KEY")
        or os.environ.get("JWT_SECRET")
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

    # Database URL: default SQLite for instant portability, or PostgreSQL+PostGIS
    DATABASE_URL: str = get_default_db_url()

    # CORS origins
    BACKEND_CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, str) and v.startswith("["):
            try:
                return json.loads(v)
            except Exception:
                return ["http://localhost:3000", "http://127.0.0.1:3000"]
        elif isinstance(v, list):
            return v
        return ["http://localhost:3000", "http://127.0.0.1:3000"]

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


settings = Settings()

