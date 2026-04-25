from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False, comment="仓库名称")
    type = Column(String(50), default="主仓", comment="仓库类型（主仓/分店仓/旧货专用仓）")
    address = Column(String(255), comment="仓库地址")
    manager = Column(String(50), comment="负责人")
    phone = Column(String(20), comment="联系电话")
    status = Column(Boolean, default=True, comment="状态：True启用，False禁用")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    inventory_items = relationship("Inventory", back_populates="warehouse")
    old_appliances = relationship("OldAppliance", back_populates="warehouse")