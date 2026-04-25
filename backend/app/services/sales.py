from datetime import datetime, date
from typing import Optional
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.customer import Customer
from app.models.sales_order import SalesOrder, SalesOrderItem, PaymentStatus, OrderStatus
from app.models.old_appliance import OldAppliance
from app.services import inventory as inventory_service
from app.services.log import log_operation


# ==================== 客户管理 ====================

def create_customer(db: Session, name: str, phone: str,
                    province: str = "江苏省", city: str = "苏州市",
                    district: str = "吴中区", town: str = "临湖镇",
                    address: Optional[str] = None, contact: Optional[str] = None,
                    remark: Optional[str] = None, user_id: int = 1) -> Customer:
    customer = Customer(
        name=name, phone=phone,
        province=province, city=city, district=district, town=town,
        address=address, contact=contact, remark=remark
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)

    log_operation(db, user_id, "创建客户", f"创建客户: {name}", after_data={"id": customer.id, "name": name, "phone": phone})
    return customer


def get_customers(db: Session, page: int = 1, page_size: int = 20,
                  keyword: Optional[str] = None) -> tuple[list[Customer], int]:
    query = db.query(Customer)
    if keyword:
        query = query.filter(or_(Customer.name.contains(keyword), Customer.phone.contains(keyword)))
    total = query.count()
    customers = query.order_by(Customer.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return customers, total


def get_customer(db: Session, customer_id: int) -> Optional[Customer]:
    return db.query(Customer).filter(Customer.id == customer_id).first()


def update_customer(db: Session, customer_id: int, user_id: int = 1, **kwargs) -> Customer:
    customer = get_customer(db, customer_id)
    if not customer:
        raise ValueError("客户不存在")

    for key, value in kwargs.items():
        if value is not None and hasattr(customer, key):
            setattr(customer, key, value)

    customer.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(customer)

    log_operation(db, user_id, "更新客户", f"更新客户: {customer.name}")
    return customer


def delete_customer(db: Session, customer_id: int, user_id: int = 1) -> None:
    customer = get_customer(db, customer_id)
    if not customer:
        raise ValueError("客户不存在")

    order_count = db.query(SalesOrder).filter(SalesOrder.customer_id == customer_id).count()
    if order_count > 0:
        raise ValueError(f"该客户有 {order_count} 个订单，无法删除")

    log_operation(db, user_id, "删除客户", f"删除客户: {customer.name}")
    db.delete(customer)
    db.commit()


# ==================== 销售订单 ====================

def generate_order_no(db: Session) -> str:
    today = date.today().strftime("%Y%m%d")
    prefix = f"SO{today}"
    count = db.query(SalesOrder).filter(SalesOrder.order_no.like(f"{prefix}%")).count()
    return f"{prefix}{count + 1:04d}"


def create_order(db: Session, customer_id: int, items: list[dict],
                 discount_amount: Decimal = Decimal("0"),
                 old_appliances: Optional[list[dict]] = None,
                 remark: Optional[str] = None, user_id: int = 1,
                 default_warehouse_id: int = 1) -> SalesOrder:
    """创建销售订单，自动扣减库存，保存客户和商品快照"""

    # 验证客户
    customer = get_customer(db, customer_id)
    if not customer:
        raise ValueError("客户不存在")

    # 构建客户完整地址快照
    customer_address = f"{customer.province}{customer.city}{customer.district}{customer.town}{customer.address or ''}"

    # 验证库存并计算金额
    total_amount = Decimal("0")
    order_items = []

    for item in items:
        product = inventory_service.get_product(db, item["product_id"])
        if not product:
            raise ValueError(f"商品不存在: {item['product_id']}")

        # 检查库存
        inv = db.query(inventory_service.Inventory).filter(
            inventory_service.Inventory.product_id == item["product_id"],
            inventory_service.Inventory.warehouse_id == default_warehouse_id
        ).first()

        if not inv or inv.quantity < item["quantity"]:
            raise ValueError(f"商品 {product.name} 库存不足")

        unit_price = Decimal(str(item["unit_price"]))
        subtotal = unit_price * item["quantity"]
        total_amount += subtotal

        # 保存商品快照信息
        order_items.append({
            "product_id": item["product_id"],
            "product_name": product.name,
            "product_spec": product.spec,
            "product_unit": product.unit,
            "quantity": item["quantity"],
            "unit_price": unit_price,
            "subtotal": subtotal
        })

    final_amount = total_amount - discount_amount
    order_no = generate_order_no(db)

    # 创建订单（包含客户快照）
    db_order = SalesOrder(
        order_no=order_no,
        customer_id=customer_id,
        customer_name=customer.name,
        customer_phone=customer.phone,
        customer_address=customer_address,
        total_amount=total_amount,
        discount_amount=discount_amount,
        final_amount=final_amount,
        payment_status=PaymentStatus.UNPAID.value,
        status=OrderStatus.ACTIVE.value,
        remark=remark
    )
    db.add(db_order)
    db.flush()  # 获取 order.id

    # 创建订单明细（包含商品快照）并扣减库存
    for item_data in order_items:
        db_item = SalesOrderItem(
            order_id=db_order.id,
            product_id=item_data["product_id"],
            product_name=item_data["product_name"],
            product_spec=item_data["product_spec"],
            product_unit=item_data["product_unit"],
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            subtotal=item_data["subtotal"]
        )
        db.add(db_item)

        # 扣减库存
        inventory_service.stock_out(db, item_data["product_id"], default_warehouse_id, item_data["quantity"], user_id, f"销售出库-订单{order_no}")

    # 处理旧电器入库
    if old_appliances:
        old_warehouse = inventory_service.get_default_old_warehouse(db)
        for old in old_appliances:
            db_old = OldAppliance(
                order_id=db_order.id,
                category=old["category"],
                brand=old.get("brand"),
                condition=old.get("condition", "旧"),
                recycle_price=Decimal(str(old.get("recycle_price", 0))),
                warehouse_id=old_warehouse.id,
                remark=old.get("remark")
            )
            db.add(db_old)

    db.commit()
    db.refresh(db_order)

    log_operation(db, user_id, "创建订单", f"创建订单: {order_no}", after_data={"order_no": order_no, "total": float(total_amount)})
    return db_order


def get_orders(db: Session, page: int = 1, page_size: int = 20,
               customer_id: Optional[int] = None, order_no: Optional[str] = None,
               payment_status: Optional[str] = None, status: Optional[str] = None,
               order_date: Optional[str] = None) -> tuple[list[SalesOrder], int]:
    query = db.query(SalesOrder)
    if customer_id:
        query = query.filter(SalesOrder.customer_id == customer_id)
    if order_no:
        query = query.filter(SalesOrder.order_no.contains(order_no))
    if payment_status:
        query = query.filter(SalesOrder.payment_status == payment_status)
    if status:
        query = query.filter(SalesOrder.status == status)
    if order_date:
        # 按日期筛选（只匹配年月日）
        query = query.filter(SalesOrder.created_at.startswith(order_date))
    total = query.count()
    orders = query.order_by(SalesOrder.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return orders, total


def get_order(db: Session, order_id: int) -> Optional[SalesOrder]:
    return db.query(SalesOrder).filter(SalesOrder.id == order_id).first()


def cancel_order(db: Session, order_id: int, user_id: int = 1, default_warehouse_id: int = 1) -> SalesOrder:
    """作废订单，恢复库存"""
    order = get_order(db, order_id)
    if not order:
        raise ValueError("订单不存在")
    if order.status == OrderStatus.CANCELLED.value:
        raise ValueError("订单已作废")

    # 恢复库存
    for item in order.items:
        inventory_service.stock_in(db, item.product_id, default_warehouse_id, item.quantity, user_id=user_id)

    order.status = OrderStatus.CANCELLED.value
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)

    log_operation(db, user_id, "作废订单", f"作废订单: {order.order_no}", before_data={"status": OrderStatus.ACTIVE.value}, after_data={"status": OrderStatus.CANCELLED.value})
    return order


def mark_paid(db: Session, order_id: int, user_id: int = 1) -> SalesOrder:
    """标记已付款"""
    order = get_order(db, order_id)
    if not order:
        raise ValueError("订单不存在")

    order.payment_status = PaymentStatus.PAID.value
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)

    log_operation(db, user_id, "标记付款", f"订单 {order.order_no} 已付款")
    return order