"""
Global settings and environment variable management.

Provides centralized configuration using Pydantic Settings for type-safe
environment variable handling with validation and defaults.
"""

from functools import lru_cache
from typing import Optional
from pydantic import Field, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    app_name: str = Field(default="Digital Agency AI Platform", env="APP_NAME")
    app_env: str = Field(default="development", env="APP_ENV")
    debug: bool = Field(default=True, env="DEBUG")
    secret_key: str = Field(..., env="SECRET_KEY")

    # API Server
    api_host: str = Field(default="0.0.0.0", env="API_HOST")
    api_port: int = Field(default=8000, env="API_PORT")
    api_workers: int = Field(default=4, env="API_WORKERS")

    # Anthropic Claude API
    anthropic_api_key: str = Field(..., env="ANTHROPIC_API_KEY")
    claude_model: str = Field(
        default="claude-sonnet-4-5-20250929", env="CLAUDE_MODEL"
    )
    claude_max_tokens: int = Field(default=4096, env="CLAUDE_MAX_TOKENS")
    claude_temperature: float = Field(default=0.7, env="CLAUDE_TEMPERATURE")

    # Database
    database_url: str = Field(..., env="DATABASE_URL")
    database_pool_size: int = Field(default=10, env="DATABASE_POOL_SIZE")
    database_max_overflow: int = Field(default=20, env="DATABASE_MAX_OVERFLOW")

    # Redis
    redis_url: str = Field(..., env="REDIS_URL")
    redis_password: Optional[str] = Field(default=None, env="REDIS_PASSWORD")
    redis_db: int = Field(default=0, env="REDIS_DB")

    # Celery
    celery_broker_url: str = Field(..., env="CELERY_BROKER_URL")
    celery_result_backend: str = Field(..., env="CELERY_RESULT_BACKEND")
    celery_task_always_eager: bool = Field(
        default=False, env="CELERY_TASK_ALWAYS_EAGER"
    )
    celery_max_tasks_per_child: int = Field(
        default=1000, env="CELERY_MAX_TASKS_PER_CHILD"
    )
    celery_task_time_limit: int = Field(default=600, env="CELERY_TASK_TIME_LIMIT")
    celery_task_soft_time_limit: int = Field(
        default=540, env="CELERY_TASK_SOFT_TIME_LIMIT"
    )

    # HubSpot
    hubspot_api_key: Optional[str] = Field(default=None, env="HUBSPOT_API_KEY")
    hubspot_portal_id: Optional[str] = Field(default=None, env="HUBSPOT_PORTAL_ID")

    # Google Services
    google_api_key: Optional[str] = Field(default=None, env="GOOGLE_API_KEY")
    google_client_id: Optional[str] = Field(default=None, env="GOOGLE_CLIENT_ID")
    google_client_secret: Optional[str] = Field(
        default=None, env="GOOGLE_CLIENT_SECRET"
    )
    google_analytics_id: Optional[str] = Field(
        default=None, env="GOOGLE_ANALYTICS_ID"
    )

    # Slack
    slack_webhook_url: Optional[str] = Field(default=None, env="SLACK_WEBHOOK_URL")
    slack_bot_token: Optional[str] = Field(default=None, env="SLACK_BOT_TOKEN")
    slack_channel: str = Field(default="#notifications", env="SLACK_CHANNEL")

    # Email
    email_provider: str = Field(default="sendgrid", env="EMAIL_PROVIDER")
    sendgrid_api_key: Optional[str] = Field(default=None, env="SENDGRID_API_KEY")
    smtp_host: Optional[str] = Field(default=None, env="SMTP_HOST")
    smtp_port: Optional[int] = Field(default=587, env="SMTP_PORT")
    smtp_user: Optional[str] = Field(default=None, env="SMTP_USER")
    smtp_password: Optional[str] = Field(default=None, env="SMTP_PASSWORD")

    # Security
    encryption_key: str = Field(..., env="ENCRYPTION_KEY")
    jwt_secret_key: str = Field(..., env="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(
        default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES"
    )

    # Rate Limiting
    rate_limit_enabled: bool = Field(default=True, env="RATE_LIMIT_ENABLED")
    rate_limit_per_minute: int = Field(default=60, env="RATE_LIMIT_PER_MINUTE")
    rate_limit_per_hour: int = Field(default=1000, env="RATE_LIMIT_PER_HOUR")

    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_format: str = Field(default="json", env="LOG_FORMAT")
    log_file_path: str = Field(
        default="/var/log/digital-agency/app.log", env="LOG_FILE_PATH"
    )

    # Feature Flags
    enable_experimental_features: bool = Field(
        default=False, env="ENABLE_EXPERIMENTAL_FEATURES"
    )
    enable_agent_learning: bool = Field(default=True, env="ENABLE_AGENT_LEARNING")
    enable_auto_scaling: bool = Field(default=False, env="ENABLE_AUTO_SCALING")

    # Agent Configuration
    max_concurrent_agents: int = Field(default=10, env="MAX_CONCURRENT_AGENTS")
    agent_timeout_seconds: int = Field(default=300, env="AGENT_TIMEOUT_SECONDS")
    agent_retry_attempts: int = Field(default=3, env="AGENT_RETRY_ATTEMPTS")
    agent_backoff_multiplier: int = Field(default=2, env="AGENT_BACKOFF_MULTIPLIER")

    # Monitoring
    sentry_dsn: Optional[str] = Field(default=None, env="SENTRY_DSN")

    # AWS
    aws_access_key_id: Optional[str] = Field(default=None, env="AWS_ACCESS_KEY_ID")
    aws_secret_access_key: Optional[str] = Field(
        default=None, env="AWS_SECRET_ACCESS_KEY"
    )
    aws_s3_bucket: Optional[str] = Field(default=None, env="AWS_S3_BUCKET")
    aws_region: str = Field(default="us-east-1", env="AWS_REGION")

    @validator("app_env")
    def validate_app_env(cls, v):
        """Validate application environment."""
        allowed_envs = ["development", "staging", "production", "testing"]
        if v not in allowed_envs:
            raise ValueError(f"app_env must be one of {allowed_envs}")
        return v

    @validator("log_level")
    def validate_log_level(cls, v):
        """Validate log level."""
        allowed_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in allowed_levels:
            raise ValueError(f"log_level must be one of {allowed_levels}")
        return v.upper()

    @validator("claude_temperature")
    def validate_temperature(cls, v):
        """Validate Claude temperature parameter."""
        if not 0.0 <= v <= 1.0:
            raise ValueError("claude_temperature must be between 0.0 and 1.0")
        return v

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.app_env == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.app_env == "development"

    @property
    def is_testing(self) -> bool:
        """Check if running in testing environment."""
        return self.app_env == "testing"

    class Config:
        """Pydantic configuration."""

        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "allow"  # Allow extra fields from .env file


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.

    Returns:
        Settings: Application settings singleton
    """
    return Settings()
