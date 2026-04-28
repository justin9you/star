from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class PurchaseOrderStatus(str, enum.Enum):
    COMPLETED = "已入库"
    CANCELLED = "已作废"


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, index=True, nullable=False, comment="进货单号")
    supplier_name = Column(String(100), comment="供应商名称")
    supplier_phone = Column(String(20), comment="供应商电话")
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), comment="入库仓库ID")
    warehouse_name = Column(String(100), comment="仓库名称快照")
    total_amount = Column(Numeric(10, 2), default=0, comment="总金额")
    total_quantity = Column(Integer, default=0, comment="总数量")
    gift_quantity = Column(Integer, default=0, comment="搭送数量")
    status = Column(String(20), default=PurchaseOrderStatus.COMPLETED.value, comment="状态")
    remark = Column(String(255), comment="备注")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = relationship("PurchaseOrderItem", back_populates="order", cascade="all, delete-orphan")
    warehouse = relationship("Warehouse")


class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("purchase_orders.id"), index=True, nullable=False, comment="进货单ID")
    product_id = Column(Integer, ForeignKey("products.id"), index=True, nullable=False, comment="商品ID")
    product_name = Column(String(200), comment="商品名称快照")
    product_spec = Column(String(100), comment="规格快照")
    product_unit = Column(String(20), comment="单位快照")
    quantity = Column(Integer, nullable=False, comment="数量")
    unit_price = Column(Numeric(10, 2), nullable=False, comment="单价")
    subtotal = Column(Numeric(10, 2), nullable=False, comment="小计")
    is_gift = Column(Boolean, default=False, comment="是否搭送")

    order = relationship("PurchaseOrder", back_populates="items")
    product = relationship("Product")
