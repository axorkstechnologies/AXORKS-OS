"""
Axorks OS — Application Configuration

Reads all environment variables via Pydantic Settings.
Supports .env files for local development, platform env vars for production.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for the Axorks OS API."""

    model_config = SettingsConfigDict(
        env_file=".env.local",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────
    app_name: str = "Axorks OS"
    app_env: str = "development"  # development | staging | production | test
    app_url: str = "http://localhost:3000"
    api_prefix: str = "/api/v1"

    # ── Database (Neon PostgreSQL) ────────────────────────
    database_url: str = "postgresql+asyncpg://axorks:axorks_dev_password@localhost:5432/axorks_os"

    # ── Redis (Upstash) ──────────────────────────────────
    upstash_redis_rest_url: str = "redis://localhost:6379"
    upstash_redis_rest_token: str = ""

    # ── Authentication ───────────────────────────────────
    auth_secret: str = "change-me-in-production"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # ── CORS ─────────────────────────────────────────────
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
    ]

    # ── Email (Resend) ───────────────────────────────────
    resend_api_key: str = ""
    resend_from_email: str = "hello@axorks.com"

    # ── AI Providers ─────────────────────────────────────
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    google_ai_api_key: str = ""
    deepseek_api_key: str = ""

    # ── GitHub (Development Hub) ───────────────────────────
    github_client_id: str = ""
    github_client_secret: str = ""
    github_oauth_redirect_uri: str = "http://localhost:3000/dev/oauth/callback"
    github_webhook_secret: str = ""

    # ── Storage (Cloudinary) ─────────────────────────────
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    # ── Monitoring ───────────────────────────────────────
    sentry_dsn: str = ""

    # ── Rate Limiting ────────────────────────────────────
    rate_limit_login: int = 5  # per 15 min per IP+email
    rate_limit_api_authenticated: int = 1000  # per min per org
    rate_limit_api_unauthenticated: int = 60  # per min per IP

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"

    @property
    def is_test(self) -> bool:
        return self.app_env == "test"


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
