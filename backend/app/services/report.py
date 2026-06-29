from datetime import datetime, date, timedelta
from typing import Optional
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.sales_order import SalesOrder, SalesOrderItem, OrderPayment
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.old_appliance import OldAppliance
from app.services import inventory as inventory_service


def get_daily_sales(db: Session, target_date: Optional[date] = None) -> dict:
    """今日销售统计"""
    if not target_date:
        target_date = date.today()

    start = datetime.combine(target_date, datetime.min.time())
    end = datetime.combine(target_date, datetime.max.time())

    orders = db.query(SalesOrder).filter(
        SalesOrder.status == "有效",
        SalesOrder.created_at >= start,
        SalesOrder.created_at <= end
    ).all()

    total_orders = len(orders)
    total_amount = sum(float(o.final_amount) for o in orders)
    subsidy_amount = sum(float(o.subsidy_amount or 0) for o in orders)
    total_quantity = 0
    for o in orders:
        for item in o.items:
            total_quantity += item.quantity

    # 今日实收金额（从付款记录统计，排除已作废订单的付款）
    payments = db.query(OrderPayment).join(
        SalesOrder, OrderPayment.order_id == SalesOrder.id
    ).filter(
        SalesOrder.status == "有效",
        OrderPayment.created_at >= start,
        OrderPayment.created_at <= end
    ).all()
    paid_amount = sum(float(p.amount) for p in payments)

    return {
        "date": target_date.isoformat(),
        "total_quantity": total_quantity,
        "total_orders": total_orders,
        "total_amount": Decimal(str(total_amount)),
        "subsidy_amount": Decimal(str(subsidy_amount)),
        "paid_amount": Decimal(str(paid_amount))
    }


def get_profit_stats(db: Session, start_date: date, end_date: date) -> dict:
    """利润统计"""
    start = datetime.combine(start_date, datetime.min.time())
    end = datetime.combine(end_date, datetime.max.time())

    orders = db.query(SalesOrder).filter(
        SalesOrder.status == "有效",
        SalesOrder.created_at >= start,
        SalesOrder.created_at <= end
    ).all()

    revenue = Decimal("0")
    cost = Decimal("0")

    for o in orders:
        # 店里真实收入 = 客户实付 + 国补返款（= 总额 - 优惠），否则利润会被国补低估
        revenue += o.final_amount + (o.subsidy_amount or Decimal("0"))
        for item in o.items:
            # 优先用成交时的成本快照；旧数据无快照时回退到当前进货价
            if item.cost_price is not None and item.cost_price > 0:
                cost += item.cost_price * item.quantity
            else:
                product = db.query(Product).filter(Product.id == item.product_id).first()
                if product:
                    cost += product.purchase_price * item.quantity

    gross_profit = revenue - cost
    gross_margin = float(gross_profit / revenue * 100) if revenue > 0 else 0

    return {
        "date": start_date.isoformat(),
        "revenue": revenue,
        "cost": cost,
        "gross_profit": gross_profit,
        "gross_margin": gross_margin
    }


def get_top_products(db: Session, limit: int = 10, start_date: Optional[date] = None,
                      end_date: Optional[date] = None) -> list[dict]:
    """热销商品排行"""
    query = db.query(
        SalesOrderItem.product_id,
        func.sum(SalesOrderItem.quantity).label("total_quantity"),
        func.sum(SalesOrderItem.subtotal).label("total_amount")
    ).join(SalesOrder).filter(SalesOrder.status == "有效")

    if start_date:
        query = query.filter(SalesOrder.created_at >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.filter(SalesOrder.created_at <= datetime.combine(end_date, datetime.max.time()))

    results = query.group_by(SalesOrderItem.product_id).order_by(func.sum(SalesOrderItem.quantity).desc()).limit(limit).all()

    top_products = []
    for r in results:
        product = db.query(Product).filter(Product.id == r.product_id).first()
        top_products.append({
            "product_id": r.product_id,
            "product_name": product.name if product else "未知",
            "total_quantity": r.total_quantity,
            "total_amount": float(r.total_amount)
        })

    return top_products


def get_inventory_report(db: Session, warehouse_id: Optional[int] = None) -> list[dict]:
    """库存报表"""
    items, _ = inventory_service.get_inventory_list(db, page=1, page_size=1000, warehouse_id=warehouse_id)
    return items


def get_old_appliance_report(db: Session, start_date: Optional[date] = None,
                              end_date: Optional[date] = None) -> list[dict]:
    """旧货报表"""
    query = db.query(OldAppliance)

    if start_date:
        query = query.filter(OldAppliance.recycle_date >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.filter(OldAppliance.recycle_date <= datetime.combine(end_date, datetime.max.time()))

    items = query.order_by(OldAppliance.id.desc()).all()

    result = []
    for item in items:
        wh = inventory_service.get_warehouse(db, item.warehouse_id) if item.warehouse_id else None
        result.append({
            "id": item.id,
            "category": item.category,
            "brand": item.brand,
            "condition": item.condition,
            "recycle_price": float(item.recycle_price),
            "warehouse_name": wh.name if wh else None,
            "recycle_date": item.recycle_date.date().isoformat() if item.recycle_date else None,
            "remark": item.remark
        })

    return result