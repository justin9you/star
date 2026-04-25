from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.schemas.common import ResponseModel, PaginationModel
from app.schemas.sales import (
    CustomerCreate, CustomerUpdate, CustomerResponse,
    SalesOrderCreate, SalesOrderUpdate, SalesOrderResponse
)
from app.services import sales as sales_service
from app.services.auth import get_current_user
from app.models.user import User

router = APIRouter()


# ==================== 客户管理 ====================
@router.post("/customers", response_model=ResponseModel)
async def create_customer(customer: CustomerCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        result = sales_service.create_customer(
            db, customer.name, customer.phone,
            customer.province or "江苏省", customer.city or "苏州市",
            customer.district or "吴中区", customer.town or "临湖镇",
            customer.address, customer.contact, customer.remark, current_user.id
        )
        return ResponseModel(data={"id": result.id, "name": result.name}, message="客户创建成功")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/customers")
async def list_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    db: Session = Depends(get_db)
):
    items, total = sales_service.get_customers(db, page, page_size, keyword)
    return {
        "items": [{"id": i.id, "name": i.name, "phone": i.phone, "province": i.province, "city": i.city,
                    "district": i.district, "town": i.town, "address": i.address, "contact": i.contact,
                    "remark": i.remark, "created_at": i.created_at.isoformat()} for i in items],
        "total": total, "page": page, "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.get("/customers/{customer_id}", response_model=ResponseModel)
async def get_customer(customer_id: int, db: Session = Depends(get_db)):
    c = sales_service.get_customer(db, customer_id)
    if not c:
        raise HTTPException(status_code=404, detail="客户不存在")
    return ResponseModel(data={"id": c.id, "name": c.name, "phone": c.phone, "province": c.province,
                               "city": c.city, "district": c.district, "town": c.town, "address": c.address,
                               "contact": c.contact, "remark": c.remark, "created_at": c.created_at.isoformat()})


@router.put("/customers/{customer_id}", response_model=ResponseModel)
async def update_customer(customer_id: int, customer: CustomerUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        update_data = {k: v for k, v in customer.model_dump().items() if v is not None}
        sales_service.update_customer(db, customer_id, current_user.id, **update_data)
        return ResponseModel(message="客户更新成功")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/customers/{customer_id}", response_model=ResponseModel)
async def delete_customer(customer_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        sales_service.delete_customer(db, customer_id, current_user.id)
        return ResponseModel(message="客户删除成功")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== 销售开单 ====================
@router.post("/orders", response_model=ResponseModel)
async def create_order(order: SalesOrderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        items_data = [{"product_id": i.product_id, "quantity": i.quantity, "unit_price": float(i.unit_price)} for i in order.items]
        old_data = None
        if order.old_appliances:
            old_data = [o.model_dump() for o in order.old_appliances]

        result = sales_service.create_order(
            db, order.customer_id, items_data,
            order.discount_amount or 0, old_data, order.remark, current_user.id
        )
        return ResponseModel(data={"id": result.id, "order_no": result.order_no, "final_amount": float(result.final_amount)}, message="销售单创建成功")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/orders")
async def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    customer_id: Optional[int] = None,
    order_no: Optional[str] = None,
    payment_status: Optional[str] = None,
    status: Optional[str] = None,
    date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    items, total = sales_service.get_orders(db, page, page_size, customer_id, order_no, payment_status, status, date)
    result_items = []
    for o in items:
        # 优先使用快照数据，兼容旧订单回查
        customer_name = o.customer_name
        if not customer_name:
            customer = sales_service.get_customer(db, o.customer_id)
            customer_name = customer.name if customer else "未知"
        result_items.append({
            "id": o.id, "order_no": o.order_no, "customer_id": o.customer_id,
            "customer_name": customer_name,
            "total_amount": float(o.total_amount), "discount_amount": float(o.discount_amount),
            "final_amount": float(o.final_amount), "payment_status": o.payment_status,
            "status": o.status, "remark": o.remark, "created_at": o.created_at.isoformat()
        })
    return {"items": result_items, "total": total, "page": page, "page_size": page_size, "total_pages": (total + page_size - 1) // page_size}


@router.get("/orders/{order_id}", response_model=ResponseModel)
async def get_order(order_id: int, db: Session = Depends(get_db)):
    o = sales_service.get_order(db, order_id)
    if not o:
        raise HTTPException(status_code=404, detail="订单不存在")
    # 优先使用快照数据，兼容旧订单回查
    customer_name = o.customer_name
    customer_phone = o.customer_phone
    customer_address = o.customer_address
    if not customer_name:
        customer = sales_service.get_customer(db, o.customer_id)
        customer_name = customer.name if customer else "未知"
        customer_phone = customer.phone if customer else ""
        customer_address = f"{customer.province}{customer.city}{customer.district}{customer.town}{customer.address or ''}" if customer else ""

    items = []
    for i in o.items:
        # 优先使用快照数据，兼容旧订单明细
        product_name = i.product_name
        product_spec = i.product_spec
        product_unit = i.product_unit
        if not product_name:
            product = inventory_service.get_product(db, i.product_id) if hasattr(inventory_service, 'get_product') else None
            product_name = product.name if product else "未知"
            product_spec = product.spec if product else None
            product_unit = product.unit if product else None
        items.append({
            "id": i.id, "order_id": i.order_id, "product_id": i.product_id,
            "product_name": product_name, "product_spec": product_spec, "product_unit": product_unit,
            "quantity": i.quantity, "unit_price": float(i.unit_price), "subtotal": float(i.subtotal)
        })
    old_appliances = []
    for oa in o.old_appliances:
        wh = inventory_service.get_warehouse(db, oa.warehouse_id) if oa.warehouse_id else None
        old_appliances.append({
            "id": oa.id, "category": oa.category, "brand": oa.brand, "condition": oa.condition,
            "recycle_price": float(oa.recycle_price), "warehouse_name": wh.name if wh else None,
            "recycle_date": oa.recycle_date.isoformat(), "remark": oa.remark
        })
    return ResponseModel(data={
        "id": o.id, "order_no": o.order_no, "customer_id": o.customer_id,
        "customer_name": customer_name, "customer_phone": customer_phone, "customer_address": customer_address,
        "total_amount": float(o.total_amount), "discount_amount": float(o.discount_amount),
        "final_amount": float(o.final_amount), "payment_status": o.payment_status,
        "status": o.status, "remark": o.remark, "created_at": o.created_at.isoformat(),
        "items": items, "old_appliances": old_appliances
    })


from app.services import inventory as inventory_service


@router.post("/orders/{order_id}/cancel", response_model=ResponseModel)
async def cancel_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        sales_service.cancel_order(db, order_id, current_user.id)
        return ResponseModel(message="销售单已作废")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/orders/{order_id}/pay", response_model=ResponseModel)
async def mark_paid(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        sales_service.mark_paid(db, order_id, current_user.id)
        return ResponseModel(message="已标记为已付款")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/orders/{order_id}/print")
async def print_order(order_id: int, db: Session = Depends(get_db)):
    from app.config import settings as app_settings
    o = sales_service.get_order(db, order_id)
    if not o:
        raise HTTPException(status_code=404, detail="订单不存在")
    # 优先使用快照数据
    customer_name = o.customer_name or ""
    customer_phone = o.customer_phone or ""
    customer_address = o.customer_address or ""
    if not customer_name:
        customer = sales_service.get_customer(db, o.customer_id)
        customer_name = customer.name if customer else ""
        customer_phone = customer.phone if customer else ""
        customer_address = f"{customer.province}{customer.city}{customer.district}{customer.town}{customer.address or ''}" if customer else ""

    print_items = []
    for i in o.items:
        product_name = i.product_name or ""
        if not product_name:
            product = inventory_service.get_product(db, i.product_id)
            product_name = product.name if product else ""
        print_items.append({
            "product_name": product_name,
            "quantity": i.quantity,
            "unit_price": float(i.unit_price),
            "subtotal": float(i.subtotal)
        })

    return ResponseModel(data={
        "shop_name": app_settings.SHOP_NAME,
        "shop_address": app_settings.SHOP_ADDRESS,
        "shop_phone": app_settings.SHOP_PHONE,
        "order_no": o.order_no,
        "customer_name": customer_name,
        "customer_phone": customer_phone,
        "customer_address": customer_address,
        "items": print_items,
        "total_amount": float(o.total_amount),
        "discount_amount": float(o.discount_amount),
        "final_amount": float(o.final_amount),
        "created_at": o.created_at.strftime("%Y-%m-%d %H:%M:%S")
    })