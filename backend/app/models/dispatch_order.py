from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class DispatchStatus(str, enum.Enum):
    PENDING = "待派工"
    ASSIGNED = "已派工"
    IN_PROGRESS = "进行中"
    COMPLETED = "已完成"
    CANCELLED = "已取消"


class DispatchOrder(Base):
    """派工单 - 给店内师傅使用"""
    __tablename__ = "dispatch_orders"

    id = Column(Integer, primary_key=True, index=True)
    dispatch_no = Column(String(50), unique=True, index=True, nullable=False, comment="派工单号")
    sales_order_id = Column(Integer, ForeignKey("sales_orders.id"), index=True, nullable=False, comment="销售订单ID")

    # 联系信息（可覆盖订单中的信息）
    contact_name = Column(String(100), comment="联系人姓名")
    contact_phone = Column(String(20), comment="联系电话")
    contact_address = Column(String(500), comment="安装/送货地址")

    # 派工信息
    assigned_to = Column(Integer, ForeignKey("users.id"), comment="指派师傅ID")
    assigned_at = Column(DateTime, comment="派工时间")
    status = Column(String(20), default=DispatchStatus.PENDING.value, comment="派工状态")

    # 时间记录
    started_at = Column(DateTime, comment="开始时间")
    completed_at = Column(DateTime, comment="完成时间")

    remark = Column(String(500), comment="备注")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关联
    sales_order = relationship("SalesOrder", back_populates="dispatch_orders")
    items = relationship("DispatchOrderItem", back_populates="dispatch_order", cascade="all, delete-orphan")
    technician = relationship("User", foreign_keys=[assigned_to])

    __table_args__ = (
        Index('idx_dispatch_orders_status', 'status'),
    )


class DispatchOrderItem(Base):
    """派工单商品明细 - 从销售订单中选择部分商品"""
    __tablename__ = "dispatch_order_items"

    id = Column(Integer, primary_key=True, index=True)
    dispatch_order_id = Column(Integer, ForeignKey("dispatch_orders.id"), index=True, nullable=False, comment="派工单ID")
    sales_order_item_id = Column(Integer, ForeignKey("sales_order_items.id"), nullable=False, comment="销售订单明细ID")

    # 冗余商品信息
    product_name = Column(String(200), comment="商品名称")
    product_spec = Column(String(100), comment="商品规格")
    quantity = Column(Integer, nullable=False, comment="数量")

    # 出库仓库
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), comment="出库仓库")
    warehouse_name = Column(String(100), comment="仓库名称")

    # 安装备注
    install_remark = Column(String(255), comment="安装备注")

    dispatch_order = relationship("DispatchOrder", back_populates="items")
    sales_order_item = relationship("SalesOrderItem")
    warehouse = relationship("Warehouse")