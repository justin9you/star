from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False, comment="类型名称")
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True, index=True, comment="父级类型ID")
    code = Column(String(50), unique=True, index=True, comment="类型编码")
    sort = Column(Integer, default=0, comment="排序")
    status = Column(Boolean, default=True, comment="状态：True启用，False禁用")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    products = relationship("Product", back_populates="category")
    children = relationship("Category", backref="parent", remote_side=[id], foreign_keys=[parent_id])