from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    APP_NAME: str = "亚星电子销售管理系统"
    APP_VERSION: str = "1.0.0"

    DATABASE_PATH: str = "./data/yaxing.db"
    DATABASE_URL: str = ""

    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"
    JWT_SECRET: str = "yaxing-sales-jwt-secret-change-in-production"
    JWT_EXPIRES_IN: int = 604800  # 7 days in seconds

    API_HOST: str = "127.0.0.1"
    API_PORT: int = 8001
    API_PREFIX: str = "/api/v1"

    BACKUP_DIR: str = "./backups"
    BACKUP_RETENTION_DAYS: int = 30

    DEFAULT_REGION_PROVINCE: str = "江苏省"
    DEFAULT_REGION_CITY: str = "苏州市"
    DEFAULT_REGION_DISTRICT: str = "吴中区"
    DEFAULT_REGION_TOWN: str = "临湖镇"

    SHOP_NAME: str = "亚星电子经营部"
    SHOP_ADDRESS: str = "苏州市吴中区临湖镇塘桥路18号"
    SHOP_PHONE: str = "138-0000-0000"

    def model_post_init(self, __context):
        if not self.DATABASE_URL:
            self.DATABASE_URL = f"sqlite:///{self.DATABASE_PATH}"

    model_config = {"env_file": "../.env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
