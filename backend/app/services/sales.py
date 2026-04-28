from datetime import datetime, date
from typing import Optional
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.customer import Customer
from app.models.sales_order import SalesOrder, SalesOrderItem, PaymentStatus, OrderStatus, OrderPayment
from app.models.old_appliance import OldAppliance
from app.models.stock_ledger import StockLedger
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

        # 检查总库存（跨所有仓库）
        all_inv = db.query(inventory_service.Inventory).filter(
            inventory_service.Inventory.product_id == item["product_id"]
        ).all()
        total_available = sum((inv.quantity or 0) + (inv.gift_quantity or 0) for inv in all_inv)
        if total_available < item["quantity"]:
            raise ValueError(f"商品 {product.name} 库存不足（总库存 {total_available}）")

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
        db.flush()  # 获取 db_item.id 用于流水关联

        # 跨仓库扣减库存，同时记录流水
        remaining = item_data["quantity"]
        all_inv = db.query(inventory_service.Inventory).filter(
            inventory_service.Inventory.product_id == item_data["product_id"]
        ).order_by(inventory_service.Inventory.id).all()

        for inv in all_inv:
            if remaining <= 0:
                break
            available = (inv.quantity or 0) + (inv.gift_quantity or 0)
            if available <= 0:
                continue
            deduct = min(available, remaining)

            # 记录扣减前的搭送和正常库存，用于判断 is_gift
            gift_before = inv.gift_quantity or 0
            normal_before = inv.quantity or 0

            inventory_service.stock_out(db, item_data["product_id"], inv.warehouse_id, deduct, user_id, reason=f"销售出库-订单{order_no}")

            # 记录流水：判断本次扣减消耗了多少搭送和多少正常库存
            gift_consumed = gift_before - (inv.gift_quantity or 0)
            normal_consumed = normal_before - inv.quantity

            if gift_consumed > 0:
                ledger = StockLedger(
                    order_id=db_order.id,
                    order_item_id=db_item.id,
                    product_id=item_data["product_id"],
                    warehouse_id=inv.warehouse_id,
                    quantity=-gift_consumed,
                    is_gift=True,
                    reason=f"销售出库-订单{order_no}"
                )
                db.add(ledger)
            if normal_consumed > 0:
                ledger = StockLedger(
                    order_id=db_order.id,
                    order_item_id=db_item.id,
                    product_id=item_data["product_id"],
                    warehouse_id=inv.warehouse_id,
                    quantity=-normal_consumed,
                    is_gift=False,
                    reason=f"销售出库-订单{order_no}"
                )
                db.add(ledger)

            remaining -= deduct

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
    """作废订单，根据流水记录精确回滚库存到原仓库"""
    order = get_order(db, order_id)
    if not order:
        raise ValueError("订单不存在")
    if order.status == OrderStatus.CANCELLED.value:
        raise ValueError("订单已作废")

    # 根据流水记录精确回滚：从哪个仓库扣的就回到哪个仓库
    ledgers = db.query(StockLedger).filter(StockLedger.order_id == order_id).all()

    if ledgers:
        # 有流水记录，按流水精确回滚
        for ledger in ledgers:
            # 流水中的 quantity 是负数（出库），回滚时取反即为入库数量
            rollback_qty = abs(ledger.quantity)
            inventory_service.stock_in(
                db, ledger.product_id, ledger.warehouse_id, rollback_qty,
                user_id=user_id, is_gift=ledger.is_gift,
                reason=f"订单作废回滚-订单{order.order_no}"
            )
            # 记录回滚流水
            rollback_ledger = StockLedger(
                order_id=order_id,
                order_item_id=ledger.order_item_id,
                product_id=ledger.product_id,
                warehouse_id=ledger.warehouse_id,
                quantity=rollback_qty,
                is_gift=ledger.is_gift,
                reason=f"订单作废回滚-订单{order.order_no}"
            )
            db.add(rollback_ledger)
    else:
        # 兼容旧数据（没有流水记录的订单），回滚到默认仓库
        for item in order.items:
            inventory_service.stock_in(db, item.product_id, default_warehouse_id, item.quantity, user_id=user_id)

    order.status = OrderStatus.CANCELLED.value
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)

    log_operation(db, user_id, "作废订单", f"作废订单: {order.order_no}", before_data={"status": OrderStatus.ACTIVE.value}, after_data={"status": OrderStatus.CANCELLED.value})
    return order


def mark_paid(db: Session, order_id: int, user_id: int = 1) -> SalesOrder:
    """标记已付款（兼容旧逻辑，建议使用 add_payment）"""
    order = get_order(db, order_id)
    if not order:
        raise ValueError("订单不存在")

    order.payment_status = PaymentStatus.PAID.value
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)

    log_operation(db, user_id, "标记付款", f"订单 {order.order_no} 已付款")
    return order


# ==================== 付款记录 ====================

def add_payment(db: Session, order_id: int, payments: list[dict], user_id: int = 1) -> SalesOrder:
    """添加付款记录，支持组合支付"""
    order = get_order(db, order_id)
    if not order:
        raise ValueError("订单不存在")
    if order.status == OrderStatus.CANCELLED.value:
        raise ValueError("订单已作废")

    total_new = Decimal("0")
    for p in payments:
        payment = OrderPayment(
            order_id=order_id,
            payment_method=p["payment_method"],
            amount=Decimal(str(p["amount"])),
            remark=p.get("remark"),
            created_by=user_id
        )
        db.add(payment)
        total_new += Decimal(str(p["amount"]))

    db.flush()

    # 计算已支付总额
    total_paid = db.query(OrderPayment.amount).filter(
        OrderPayment.order_id == order_id
    ).all()
    total_paid_sum = sum(p[0] for p in total_paid if p[0])

    # 检查超额支付
    if total_paid_sum > order.final_amount:
        raise ValueError(f"支付金额({total_paid_sum})超过订单金额({order.final_amount})")

    # 自动更新付款状态
    if total_paid_sum >= order.final_amount:
        order.payment_status = PaymentStatus.PAID.value
    elif total_paid_sum > 0:
        order.payment_status = PaymentStatus.PARTIAL.value
    else:
        order.payment_status = PaymentStatus.UNPAID.value
    order.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(order)

    log_operation(db, user_id, "添加付款", f"订单 {order.order_no} 添加付款 {total_new} 元")
    return order


def get_payments(db: Session, order_id: int) -> list[OrderPayment]:
    """获取订单付款记录"""
    return db.query(OrderPayment).filter(OrderPayment.order_id == order_id).order_by(OrderPayment.id).all()


def get_payment_total(db: Session, order_id: int) -> Decimal:
    """获取订单已支付总额"""
    result = db.query(OrderPayment.amount).filter(OrderPayment.order_id == order_id).all()
    return sum(r[0] for r in result if r[0]) or Decimal("0")