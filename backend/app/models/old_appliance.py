from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class OldAppliance(Base):
    __tablename__ = "old_appliances"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("sales_orders.id"), nullable=True, index=True, comment="关联销售单ID")
    category = Column(String(100), comment="旧电器类型")
    brand = Column(String(100), comment="品牌")
    condition = Column(String(20), default="旧", comment="成色（新/旧/差）")
    recycle_price = Column(Numeric(10, 2), default=0, comment="回收价")
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), comment="归属仓库ID")
    recycle_date = Column(DateTime, default=datetime.utcnow, comment="回收日期")
    remark = Column(Text, comment="备注")
    created_at = Column(DateTime, default=datetime.utcnow)

    warehouse = relationship("Warehouse", back_populates="old_appliances")
    sales_order = relationship("SalesOrder", back_populates="old_appliances")