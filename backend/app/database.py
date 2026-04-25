from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pathlib import Path

from app.config import settings

DATABASE_PATH = Path(settings.DATABASE_PATH)
DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from app.models import (
        user,
        brand,
        category,
        product,
        warehouse,
        inventory,
        customer,
        sales_order,
        old_appliance,
        operation_log
    )
    from app.models.user import User
    from app.services.auth import get_password_hash

    Base.metadata.create_all(bind=engine)

    # 自动迁移：为已有表添加缺失的列
    _migrate_add_columns(engine)

    # 创建默认管理员用户
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.username == settings.ADMIN_USERNAME).first()
        if not admin_user:
            admin_user = User(
                username=settings.ADMIN_USERNAME,
                hashed_password=get_password_hash(settings.ADMIN_PASSWORD)
            )
            db.add(admin_user)
            db.commit()
            print(f"默认管理员用户已创建: {settings.ADMIN_USERNAME}")
    except Exception as e:
        print(f"创建默认管理员用户失败: {e}")
    finally:
        db.close()


def _migrate_add_columns(engine):
    """为已有表自动添加新列，SQLite 不支持 ALTER ADD COLUMN 如果列已存在则跳过"""
    import sqlalchemy
    new_columns = [
        ("products", "barcode", sqlalchemy.String(50)),
        ("sales_orders", "customer_name", sqlalchemy.String(100)),
        ("sales_orders", "customer_phone", sqlalchemy.String(20)),
        ("sales_orders", "customer_address", sqlalchemy.String(500)),
        ("sales_order_items", "product_name", sqlalchemy.String(200)),
        ("sales_order_items", "product_spec", sqlalchemy.String(100)),
        ("sales_order_items", "product_unit", sqlalchemy.String(20)),
    ]
    with engine.connect() as conn:
        for table, column, col_type in new_columns:
            try:
                col_type_str = col_type().compile(dialect=engine.dialect)
                conn.execute(sqlalchemy.text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type_str}"))
                conn.commit()
            except Exception:
                pass