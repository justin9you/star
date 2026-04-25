from datetime import datetime
from sqlalchemy import Column, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), index=True, nullable=False, comment="商品ID")
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), index=True, nullable=False, comment="仓库ID")
    quantity = Column(Integer, default=0, comment="库存数量")
    min_quantity = Column(Integer, default=10, comment="最低库存预警")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = relationship("Product", back_populates="inventory_items")
    warehouse = relationship("Warehouse", back_populates="inventory_items")