from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, Numeric, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), index=True, nullable=False, comment="商品名称")
    brand_id = Column(Integer, ForeignKey("brands.id"), index=True, comment="品牌ID")
    category_id = Column(Integer, ForeignKey("categories.id"), index=True, comment="类型ID")
    spec = Column(String(100), comment="规格（如：200L/1.5匹/8kg）")
    purchase_price = Column(Numeric(10, 2), nullable=False, comment="进货价")
    sale_price = Column(Numeric(10, 2), nullable=False, comment="销售价")
    unit = Column(String(20), default="台", comment="单位（台/套/件）")
    qr_code = Column(String(100), unique=True, index=True, comment="唯一二维码")
    barcode = Column(String(50), index=True, comment="条形码")
    status = Column(Boolean, default=True, comment="状态：True上架，False停用")
    remark = Column(Text, comment="备注")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    brand = relationship("Brand", back_populates="products")
    category = relationship("Category", back_populates="products")
    inventory_items = relationship("Inventory", back_populates="product")
    order_items = relationship("SalesOrderItem", back_populates="product")