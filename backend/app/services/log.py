import json
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from app.models.operation_log import OperationLog


def log_operation(
    db: Session,
    user_id: int,
    operation_type: str,
    operation_detail: str,
    before_data: Optional[dict] = None,
    after_data: Optional[dict] = None
) -> OperationLog:
    """记录操作日志"""
    log = OperationLog(
        user_id=user_id,
        operation_type=operation_type,
        operation_detail=operation_detail,
        before_data=json.dumps(before_data, ensure_ascii=False) if before_data else None,
        after_data=json.dumps(after_data, ensure_ascii=False) if after_data else None,
        created_at=datetime.utcnow()
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def get_logs(
    db: Session,
    user_id: Optional[int] = None,
    operation_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    page: int = 1,
    page_size: int = 20
) -> tuple[list[OperationLog], int]:
    """查询操作日志"""
    query = db.query(OperationLog)

    if user_id:
        query = query.filter(OperationLog.user_id == user_id)
    if operation_type:
        query = query.filter(OperationLog.operation_type == operation_type)
    if start_date:
        query = query.filter(OperationLog.created_at >= start_date)
    if end_date:
        query = query.filter(OperationLog.created_at <= end_date)

    total = query.count()
    logs = query.order_by(OperationLog.created_at.desc()) \
        .offset((page - 1) * page_size) \
        .limit(page_size) \
        .all()

    return logs, total