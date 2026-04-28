from datetime import datetime, date
from typing import Optional
from sqlalchemy.orm import Session
from decimal import Decimal

from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
from app.services import inventory as inventory_service
from app.services.log import log_operation


def generate_purchase_order_no(db: Session) -> str:
    """生成进货单号: PO{YYYYMMDD}{NNNN}"""
    today = date.today().strftime("%Y%m%d")
    prefix = f"PO{today}"
    count = db.query(PurchaseOrder).filter(PurchaseOrder.order_no.like(f"{prefix}%")).count()
    return f"{prefix}{count + 1:04d}"


def create_purchase_order(db: Session, warehouse_id: int, items: list[dict],
                          supplier_name: Optional[str] = None,
                          supplier_phone: Optional[str] = None,
                          remark: Optional[str] = None,
                          user_id: int = 1) -> PurchaseOrder:
    """
    创建进货单并自动入库
    MVP: 创建即入库，状态=已入库
    """
    warehouse = inventory_service.get_warehouse(db, warehouse_id)
    if not warehouse:
        raise ValueError("仓库不存在")

    total_amount = Decimal("0")
    total_quantity = 0
    gift_count = 0
    order_items = []

    for item in items:
        product = inventory_service.get_product(db, item["product_id"])
        if not product:
            raise ValueError(f"商品不存在: {item['product_id']}")

        is_gift = item.get("is_gift", False)
        unit_price = Decimal("0") if is_gift else Decimal(str(item.get("unit_price") or product.purchase_price or 0))
        quantity = item["quantity"]
        subtotal = unit_price * quantity

        if is_gift:
            gift_count += quantity
        else:
            total_amount += subtotal
        total_quantity += quantity

        order_items.append({
            "product_id": product.id,
            "product_name": product.name,
            "product_spec": product.spec,
            "product_unit": product.unit,
            "quantity": quantity,
            "unit_price": unit_price,
            "subtotal": subtotal,
            "is_gift": is_gift
        })

    order_no = generate_purchase_order_no(db)

    db_order = PurchaseOrder(
        order_no=order_no,
        supplier_name=supplier_name,
        supplier_phone=supplier_phone,
        total_amount=total_amount,
        total_quantity=total_quantity,
        gift_quantity=gift_count,
        status=PurchaseOrderStatus.COMPLETED.value,
        warehouse_id=warehouse_id,
        warehouse_name=warehouse.name,
        remark=remark
    )
    db.add(db_order)
    db.flush()

    for item_data in order_items:
        db_item = PurchaseOrderItem(order_id=db_order.id, **item_data)
        db.add(db_item)

        # 入库
        inventory_service.stock_in(
            db,
            item_data["product_id"],
            warehouse_id,
            item_data["quantity"],
            item_data["unit_price"] if not item_data["is_gift"] else None,
            user_id,
            is_gift=item_data["is_gift"],
            reason=f"采购入库-{order_no}"
        )

    db.commit()
    db.refresh(db_order)

    log_operation(db, user_id, "创建进货单", f"创建进货单: {order_no}",
                  after_data={"order_no": order_no, "total": float(total_amount), "gift_count": gift_count})
    return db_order


def get_purchase_orders(db: Session, page: int = 1, page_size: int = 20,
                        order_no: Optional[str] = None, status: Optional[str] = None,
                        start_date: Optional[str] = None, end_date: Optional[str] = None) -> tuple[list[PurchaseOrder], int]:
    """进货单列表查询"""
    query = db.query(PurchaseOrder)

    if order_no:
        query = query.filter(PurchaseOrder.order_no.contains(order_no))
    if status:
        query = query.filter(PurchaseOrder.status == status)
    if start_date:
        query = query.filter(PurchaseOrder.created_at >= start_date)
    if end_date:
        query = query.filter(PurchaseOrder.created_at < end_date)

    total = query.count()
    items = query.order_by(PurchaseOrder.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def get_purchase_order(db: Session, order_id: int) -> Optional[PurchaseOrder]:
    """获取进货单详情"""
    return db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()


def get_purchase_order_by_no(db: Session, order_no: str) -> Optional[PurchaseOrder]:
    """根据单号获取进货单"""
    return db.query(PurchaseOrder).filter(PurchaseOrder.order_no == order_no).first()


def cancel_purchase_order(db: Session, order_id: int, user_id: int = 1) -> PurchaseOrder:
    """作废进货单 - 反向出库"""
    order = get_purchase_order(db, order_id)
    if not order:
        raise ValueError("进货单不存在")
    if order.status == PurchaseOrderStatus.CANCELLED.value:
        raise ValueError("进货单已作废")

    # 反向出库
    for item in order.items:
        inventory_service.stock_out(
            db,
            item.product_id,
            order.warehouse_id,
            item.quantity,
            user_id,
            is_gift=item.is_gift,
            reason=f"作废进货单-{order.order_no}"
        )

    order.status = PurchaseOrderStatus.CANCELLED.value
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)

    log_operation(db, user_id, "作废进货单", f"作废进货单: {order.order_no}",
                  before_data={"status": PurchaseOrderStatus.COMPLETED.value},
                  after_data={"status": PurchaseOrderStatus.CANCELLED.value})
    return order
