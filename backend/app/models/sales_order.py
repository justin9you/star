from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class PaymentStatus(str, enum.Enum):
    UNPAID = "未付款"
    PARTIAL = "部分付款"
    PAID = "已付款"


class OrderStatus(str, enum.Enum):
    ACTIVE = "有效"
    CANCELLED = "已作废"


class PaymentMethod(str, enum.Enum):
    CASH = "现金"
    DIGITAL_RMB = "数字人民币"
    WECHAT = "微信"
    ALIPAY = "支付宝"
    CREDIT_CARD = "信用卡"
    BANK_TRANSFER = "银行转账"
    OTHER = "其他"


class SalesOrder(Base):
    __tablename__ = "sales_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, index=True, nullable=False, comment="订单号")
    customer_id = Column(Integer, ForeignKey("customers.id"), index=True, nullable=False, comment="客户ID")
    # 冗余客户信息（下单时快照，不受后续修改影响）
    customer_name = Column(String(100), comment="客户姓名")
    customer_phone = Column(String(20), comment="客户电话")
    customer_address = Column(String(500), comment="客户完整地址")
    # 金额信息
    total_amount = Column(Numeric(10, 2), default=0, comment="总金额")
    discount_amount = Column(Numeric(10, 2), default=0, comment="优惠金额")
    subsidy_amount = Column(Numeric(10, 2), default=0, comment="国补金额（政府返款，客户少付）")
    final_amount = Column(Numeric(10, 2), default=0, comment="最终金额（客户实付=总额-优惠-国补）")
    payment_status = Column(String(20), default=PaymentStatus.UNPAID.value, comment="收款状态")
    status = Column(String(20), default=OrderStatus.ACTIVE.value, comment="订单状态")
    remark = Column(String(255), comment="备注")
    created_at = Column(DateTime, default=datetime.utcnow, comment="开单时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("Customer", back_populates="sales_orders")
    items = relationship("SalesOrderItem", back_populates="order", cascade="all, delete-orphan")
    old_appliances = relationship("OldAppliance", back_populates="sales_order")
    stock_ledgers = relationship("StockLedger", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("OrderPayment", back_populates="order", cascade="all, delete-orphan")
    dispatch_orders = relationship("DispatchOrder", back_populates="sales_order")


class OrderPayment(Base):
    """订单付款记录 - 支持多种支付方式组合"""
    __tablename__ = "order_payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("sales_orders.id"), index=True, nullable=False, comment="订单ID")
    payment_method = Column(String(20), nullable=False, comment="支付方式")
    amount = Column(Numeric(10, 2), nullable=False, comment="支付金额")
    remark = Column(String(255), comment="备注")
    created_at = Column(DateTime, default=datetime.utcnow, comment="支付时间")
    created_by = Column(Integer, ForeignKey("users.id"), comment="操作人ID")

    order = relationship("SalesOrder", back_populates="payments")
    creator = relationship("User")


class SalesOrderItem(Base):
    __tablename__ = "sales_order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("sales_orders.id"), index=True, nullable=False, comment="订单ID")
    product_id = Column(Integer, ForeignKey("products.id"), index=True, nullable=False, comment="商品ID")
    # 冗余商品信息（下单时快照，不受后续修改影响）
    product_name = Column(String(200), comment="商品名称")
    product_spec = Column(String(100), comment="商品规格")
    product_unit = Column(String(20), comment="商品单位")
    # 数量和金额
    quantity = Column(Integer, nullable=False, comment="数量")
    unit_price = Column(Numeric(10, 2), nullable=False, comment="单价")
    cost_price = Column(Numeric(10, 2), default=0, comment="成交时进货成本快照")
    subtotal = Column(Numeric(10, 2), nullable=False, comment="小计")

    order = relationship("SalesOrder", back_populates="items")
    product = relationship("Product", back_populates="order_items")
    stock_ledgers = relationship("StockLedger", back_populates="order_item", cascade="all, delete-orphan")