from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.database import Base


class OperationLog(Base):
    __tablename__ = "operation_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, comment="操作人ID")
    operation_type = Column(String(50), index=True, comment="操作类型（入库/出库/修改/删除）")
    operation_detail = Column(String(255), comment="操作详情")
    before_data = Column(Text, comment="操作前数据（JSON）")
    after_data = Column(Text, comment="操作后数据（JSON）")
    created_at = Column(DateTime, default=datetime.utcnow, comment="操作时间")