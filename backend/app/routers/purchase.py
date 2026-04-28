from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.schemas.common import ResponseModel
from app.schemas.purchase import PurchaseOrderCreate, PurchaseOrderResponse
from app.services import purchase as purchase_service
from app.services.auth import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/orders", response_model=ResponseModel)
async def create_order(order: PurchaseOrderCreate, db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    try:
        items_data = [i.model_dump() for i in order.items]
        result = purchase_service.create_purchase_order(
            db, order.warehouse_id, items_data,
            order.supplier_name, order.supplier_phone, order.remark, current_user.id
        )
        return ResponseModel(
            data={"id": result.id, "order_no": result.order_no},
            message="进货单创建成功"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/orders")
async def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    order_no: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    items, total = purchase_service.get_purchase_orders(db, page, page_size, order_no, status, start_date, end_date)

    result_items = []
    for order in items:
        order_dict = {
            "id": order.id,
            "order_no": order.order_no,
            "supplier_name": order.supplier_name,
            "supplier_phone": order.supplier_phone,
            "warehouse_id": order.warehouse_id,
            "warehouse_name": order.warehouse_name,
            "total_amount": float(order.total_amount) if order.total_amount else 0,
            "total_quantity": order.total_quantity,
            "gift_quantity": order.gift_quantity,
            "status": order.status,
            "remark": order.remark,
            "created_at": order.created_at.isoformat() if order.created_at else None,
        }
        result_items.append(order_dict)

    return {
        "items": result_items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.get("/orders/{order_id}", response_model=ResponseModel)
async def get_order(order_id: int, db: Session = Depends(get_db)):
    order = purchase_service.get_purchase_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="进货单不存在")

    items = []
    for item in order.items:
        items.append({
            "id": item.id,
            "order_id": item.order_id,
            "product_id": item.product_id,
            "product_name": item.product_name,
            "product_spec": item.product_spec,
            "product_unit": item.product_unit,
            "quantity": item.quantity,
            "unit_price": float(item.unit_price) if item.unit_price else 0,
            "subtotal": float(item.subtotal) if item.subtotal else 0,
            "is_gift": item.is_gift,
        })

    data = {
        "id": order.id,
        "order_no": order.order_no,
        "supplier_name": order.supplier_name,
        "supplier_phone": order.supplier_phone,
        "warehouse_id": order.warehouse_id,
        "warehouse_name": order.warehouse_name,
        "total_amount": float(order.total_amount) if order.total_amount else 0,
        "total_quantity": order.total_quantity,
        "gift_quantity": order.gift_quantity,
        "status": order.status,
        "remark": order.remark,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "items": items,
    }
    return ResponseModel(data=data, message="获取成功")


@router.post("/orders/{order_id}/cancel", response_model=ResponseModel)
async def cancel_order(order_id: int, db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    try:
        purchase_service.cancel_purchase_order(db, order_id, current_user.id)
        return ResponseModel(message="进货单已作废")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
