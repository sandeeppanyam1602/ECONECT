from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./econect_dev.db"
    SECRET_KEY: str = "sih-2026-dev-secret-key-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    AI_MODE: str = "DEMO_FALLBACK"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    class Config:
        env_file = ".env"

settings = Settings()
