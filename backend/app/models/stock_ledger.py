from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Index
from sqlalchemy.orm import relationship
from app.database import Base


class StockLedger(Base):
    """库存流水表 - 记录每笔出入库明细，支持精确回滚"""
    __tablename__ = "stock_ledger"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("sales_orders.id"), index=True, comment="关联订单ID")
    order_item_id = Column(Integer, ForeignKey("sales_order_items.id"), index=True, comment="关联订单明细ID")
    product_id = Column(Integer, ForeignKey("products.id"), index=True, nullable=False, comment="商品ID")
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False, comment="仓库ID")
    quantity = Column(Integer, nullable=False, comment="数量（正数入库，负数出库）")
    is_gift = Column(Boolean, default=False, comment="是否搭送库存")
    reason = Column(String(100), comment="原因：销售出库/订单作废回滚等")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")

    # 关联关系
    order = relationship("SalesOrder", back_populates="stock_ledgers")
    order_item = relationship("SalesOrderItem", back_populates="stock_ledgers")
    product = relationship("Product")
    warehouse = relationship("Warehouse")

    __table_args__ = (
        Index('idx_stock_ledger_order_product', 'order_id', 'product_id'),
    )