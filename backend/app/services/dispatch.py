from datetime import datetime, date
from typing import Optional
from sqlalchemy.orm import Session

from app.models.dispatch_order import DispatchOrder, DispatchOrderItem, DispatchStatus
from app.models.sales_order import SalesOrder, SalesOrderItem
from app.models.warehouse import Warehouse
from app.models.user import User
from app.services.log import log_operation


def generate_dispatch_no(db: Session) -> str:
    today = date.today().strftime("%Y%m%d")
    prefix = f"DP{today}"
    count = db.query(DispatchOrder).filter(DispatchOrder.dispatch_no.like(f"{prefix}%")).count()
    return f"{prefix}{count + 1:04d}"


def create_dispatch(db: Session, sales_order_id: int, items: list[dict],
                    contact_name: Optional[str] = None,
                    contact_phone: Optional[str] = None,
                    contact_address: Optional[str] = None,
                    assigned_to: Optional[int] = None,
                    remark: Optional[str] = None,
                    user_id: int = 1) -> DispatchOrder:
    """创建派工单"""
    order = db.query(SalesOrder).filter(SalesOrder.id == sales_order_id).first()
    if not order:
        raise ValueError("销售订单不存在")
    if order.status == "已作废":
        raise ValueError("订单已作废，无法创建派工单")

    # 默认使用订单中的联系信息
    contact_name = contact_name or order.customer_name
    contact_phone = contact_phone or order.customer_phone
    contact_address = contact_address or order.customer_address

    dispatch_no = generate_dispatch_no(db)
    status = DispatchStatus.ASSIGNED.value if assigned_to else DispatchStatus.PENDING.value

    dispatch = DispatchOrder(
        dispatch_no=dispatch_no,
        sales_order_id=sales_order_id,
        contact_name=contact_name,
        contact_phone=contact_phone,
        contact_address=contact_address,
        assigned_to=assigned_to,
        assigned_at=datetime.utcnow() if assigned_to else None,
        status=status,
        remark=remark
    )
    db.add(dispatch)
    db.flush()

    # 添加商品明细
    for item in items:
        order_item = db.query(SalesOrderItem).filter(SalesOrderItem.id == item["sales_order_item_id"]).first()
        if not order_item:
            raise ValueError(f"订单商品不存在: {item['sales_order_item_id']}")

        warehouse_name = None
        if item.get("warehouse_id"):
            warehouse = db.query(Warehouse).filter(Warehouse.id == item["warehouse_id"]).first()
            warehouse_name = warehouse.name if warehouse else None

        dispatch_item = DispatchOrderItem(
            dispatch_order_id=dispatch.id,
            sales_order_item_id=item["sales_order_item_id"],
            product_name=order_item.product_name,
            product_spec=order_item.product_spec,
            quantity=item.get("quantity", order_item.quantity),
            warehouse_id=item.get("warehouse_id"),
            warehouse_name=warehouse_name,
            install_remark=item.get("install_remark")
        )
        db.add(dispatch_item)

    db.commit()
    db.refresh(dispatch)

    log_operation(db, user_id, "创建派工单", f"创建派工单: {dispatch_no}")
    return dispatch


def get_dispatches(db: Session, page: int = 1, page_size: int = 20,
                   status: Optional[str] = None,
                   assigned_to: Optional[int] = None) -> tuple[list[DispatchOrder], int]:
    """获取派工单列表"""
    query = db.query(DispatchOrder)
    if status:
        query = query.filter(DispatchOrder.status == status)
    if assigned_to:
        query = query.filter(DispatchOrder.assigned_to == assigned_to)
    total = query.count()
    dispatches = query.order_by(DispatchOrder.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return dispatches, total


def get_dispatch(db: Session, dispatch_id: int) -> Optional[DispatchOrder]:
    """获取派工单详情"""
    return db.query(DispatchOrder).filter(DispatchOrder.id == dispatch_id).first()


def update_dispatch_status(db: Session, dispatch_id: int, status: str,
                           user_id: int = 1) -> DispatchOrder:
    """更新派工状态"""
    dispatch = get_dispatch(db, dispatch_id)
    if not dispatch:
        raise ValueError("派工单不存在")

    dispatch.status = status
    if status == DispatchStatus.IN_PROGRESS.value:
        dispatch.started_at = datetime.utcnow()
    elif status == DispatchStatus.COMPLETED.value:
        dispatch.completed_at = datetime.utcnow()

    dispatch.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(dispatch)

    log_operation(db, user_id, "更新派工状态", f"派工单 {dispatch.dispatch_no} 状态更新为 {status}")
    return dispatch


def assign_technician(db: Session, dispatch_id: int, technician_id: int,
                      user_id: int = 1) -> DispatchOrder:
    """指派师傅"""
    dispatch = get_dispatch(db, dispatch_id)
    if not dispatch:
        raise ValueError("派工单不存在")

    technician = db.query(User).filter(User.id == technician_id).first()
    if not technician:
        raise ValueError("师傅不存在")

    dispatch.assigned_to = technician_id
    dispatch.assigned_at = datetime.utcnow()
    if dispatch.status == DispatchStatus.PENDING.value:
        dispatch.status = DispatchStatus.ASSIGNED.value
    dispatch.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(dispatch)

    log_operation(db, user_id, "指派师傅", f"派工单 {dispatch.dispatch_no} 指派给 {technician.username}")
    return dispatch