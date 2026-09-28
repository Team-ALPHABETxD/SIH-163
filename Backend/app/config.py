from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "sqlite:///./sentinel.db"
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    host: str = "0.0.0.0"
    port: int = 8000
    assessment_workers: int = 1
    default_target_name: str = "Local Sentinel Sandbox"
    default_target_url: str = "http://localhost:9000"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
