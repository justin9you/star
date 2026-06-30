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
    except Exception:
        # 请求处理出错时回滚未提交事务，避免脏数据残留在连接上
        db.rollback()
        raise
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
        operation_log,
        purchase_order,
        stock_ledger,
        dispatch_order
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
        ("sales_orders", "subsidy_amount", sqlalchemy.Numeric(10, 2)),
        ("sales_orders", "created_by", sqlalchemy.Integer),
        ("sales_orders", "cancel_reason", sqlalchemy.String(255)),
        ("sales_orders", "cancelled_at", sqlalchemy.DateTime),
        ("sales_orders", "cancelled_by", sqlalchemy.Integer),
        ("products", "status", sqlalchemy.Boolean),
        ("sales_order_items", "product_name", sqlalchemy.String(200)),
        ("sales_order_items", "product_spec", sqlalchemy.String(100)),
        ("sales_order_items", "product_unit", sqlalchemy.String(20)),
        ("sales_order_items", "cost_price", sqlalchemy.Numeric(10, 2)),
        ("inventory", "gift_quantity", sqlalchemy.Integer),
    ]
    with engine.connect() as conn:
        for table, column, col_type in new_columns:
            try:
                # col_type 可能是类型类(如 Integer)或类型实例(如 String(50)/Numeric(10,2))
                type_obj = col_type() if isinstance(col_type, type) else col_type
                col_type_str = type_obj.compile(dialect=engine.dialect)
                conn.execute(sqlalchemy.text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type_str}"))
                conn.commit()
            except Exception:
                # 列已存在等情况跳过；ALTER 失败不影响启动
                pass

        # 回填：新增列对已有行为 NULL，需补默认值，避免被当成停用/异常
        backfills = [
            "UPDATE products SET status = 1 WHERE status IS NULL",
            "UPDATE sales_orders SET subsidy_amount = 0 WHERE subsidy_amount IS NULL",
        ]
        for sql in backfills:
            try:
                conn.execute(sqlalchemy.text(sql))
                conn.commit()
            except Exception:
                pass