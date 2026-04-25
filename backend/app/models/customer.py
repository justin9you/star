from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), index=True, nullable=False, comment="客户姓名")
    phone = Column(String(20), index=True, nullable=False, comment="联系电话")
    province = Column(String(50), default="江苏省", comment="省")
    city = Column(String(50), default="苏州市", comment="市")
    district = Column(String(50), default="吴中区", comment="区")
    town = Column(String(50), default="临湖镇", comment="镇")
    address = Column(String(255), comment="详细地址")
    contact = Column(String(50), comment="联系人")
    remark = Column(Text, comment="备注")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sales_orders = relationship("SalesOrder", back_populates="customer")