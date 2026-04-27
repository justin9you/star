"""Pytest configuration and fixtures"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.brand import Brand
from app.models.category import Category
from app.models.product import Product
from app.models.warehouse import Warehouse
from app.models.inventory import Inventory
from app.models.customer import Customer
from app.models.sales_order import SalesOrder, SalesOrderItem
from app.models.old_appliance import OldAppliance
from app.models.operation_log import OperationLog
from app.services.auth import get_password_hash


# 使用 StaticPool 确保所有连接使用同一个内存数据库
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def test_db():
    """Create tables and return session"""
    # 创建所有表
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # 清理所有表
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(test_db):
    """Create test client with overridden database"""
    def override_get_db():
        try:
            yield test_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(test_db):
    """Create a test user"""
    user = User(
        username="testuser",
        hashed_password=get_password_hash("testpass123")
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)

    # 创建默认仓库（ID=1）用于销售订单
    default_wh = Warehouse(id=1, name="默认仓库", type="普通仓库")
    test_db.add(default_wh)
    test_db.commit()

    return user


@pytest.fixture
def auth_token(client, test_user):
    """Get authentication token"""
    response = client.post("/api/v1/auth/login", data={
        "username": "testuser",
        "password": "testpass123"
    })
    return response.json()["access_token"]


@pytest.fixture
def auth_headers(auth_token):
    """Get authentication headers"""
    return {"Authorization": f"Bearer {auth_token}"}