from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.schemas.common import ResponseModel
from app.services import dispatch as dispatch_service
from app.services import inventory as inventory_service
from app.services.auth import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/", response_model=ResponseModel)
async def create_dispatch(dispatch: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """创建派工单"""
    try:
        result = dispatch_service.create_dispatch(
            db,
            sales_order_id=dispatch["sales_order_id"],
            items=dispatch.get("items", []),
            contact_name=dispatch.get("contact_name"),
            contact_phone=dispatch.get("contact_phone"),
            contact_address=dispatch.get("contact_address"),
            assigned_to=dispatch.get("assigned_to"),
            remark=dispatch.get("remark"),
            user_id=current_user.id
        )
        return ResponseModel(data={"id": result.id, "dispatch_no": result.dispatch_no}, message="派工单创建成功")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/")
async def list_dispatches(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    assigned_to: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """获取派工单列表"""
    dispatches, total = dispatch_service.get_dispatches(db, page, page_size, status, assigned_to)
    result_items = []
    for d in dispatches:
        # 获取师傅名称
        technician_name = d.technician.username if d.technician else None
        # 获取订单号
        sales_order_no = d.sales_order.order_no if d.sales_order else None
        # 获取商品明细
        items = []
        for item in d.items:
            items.append({
                "id": item.id,
                "product_name": item.product_name,
                "product_spec": item.product_spec,
                "quantity": item.quantity,
                "warehouse_id": item.warehouse_id,
                "warehouse_name": item.warehouse_name,
                "install_remark": item.install_remark
            })
        result_items.append({
            "id": d.id,
            "dispatch_no": d.dispatch_no,
            "sales_order_id": d.sales_order_id,
            "sales_order_no": sales_order_no,
            "contact_name": d.contact_name,
            "contact_phone": d.contact_phone,
            "contact_address": d.contact_address,
            "assigned_to": d.assigned_to,
            "assigned_to_name": technician_name,
            "status": d.status,
            "started_at": d.started_at.isoformat() if d.started_at else None,
            "completed_at": d.completed_at.isoformat() if d.completed_at else None,
            "remark": d.remark,
            "created_at": d.created_at.isoformat() if d.created_at else None,
            "items": items
        })
    return {"items": result_items, "total": total, "page": page, "page_size": page_size, "total_pages": (total + page_size - 1) // page_size}


@router.get("/{dispatch_id}", response_model=ResponseModel)
async def get_dispatch(dispatch_id: int, db: Session = Depends(get_db)):
    """获取派工单详情"""
    d = dispatch_service.get_dispatch(db, dispatch_id)
    if not d:
        raise HTTPException(status_code=404, detail="派工单不存在")

    technician_name = d.technician.username if d.technician else None
    sales_order_no = d.sales_order.order_no if d.sales_order else None

    items = []
    for item in d.items:
        items.append({
            "id": item.id,
            "product_name": item.product_name,
            "product_spec": item.product_spec,
            "quantity": item.quantity,
            "warehouse_id": item.warehouse_id,
            "warehouse_name": item.warehouse_name,
            "install_remark": item.install_remark
        })

    return ResponseModel(data={
        "id": d.id,
        "dispatch_no": d.dispatch_no,
        "sales_order_id": d.sales_order_id,
        "sales_order_no": sales_order_no,
        "contact_name": d.contact_name,
        "contact_phone": d.contact_phone,
        "contact_address": d.contact_address,
        "assigned_to": d.assigned_to,
        "assigned_to_name": technician_name,
        "status": d.status,
        "started_at": d.started_at.isoformat() if d.started_at else None,
        "completed_at": d.completed_at.isoformat() if d.completed_at else None,
        "remark": d.remark,
        "created_at": d.created_at.isoformat() if d.created_at else None,
        "items": items
    })


@router.put("/{dispatch_id}/status", response_model=ResponseModel)
async def update_status(dispatch_id: int, body: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """更新派工状态"""
    try:
        status = body.get("status")
        if not status:
            raise HTTPException(status_code=400, detail="状态不能为空")
        result = dispatch_service.update_dispatch_status(db, dispatch_id, status, current_user.id)
        return ResponseModel(message=f"派工单 {result.dispatch_no} 状态已更新")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{dispatch_id}/assign", response_model=ResponseModel)
async def assign_technician(dispatch_id: int, body: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """指派师傅"""
    try:
        technician_id = body.get("technician_id")
        if not technician_id:
            raise HTTPException(status_code=400, detail="师傅ID不能为空")
        result = dispatch_service.assign_technician(db, dispatch_id, technician_id, current_user.id)
        return ResponseModel(message=f"派工单 {result.dispatch_no} 已指派师傅")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{dispatch_id}/print", response_model=ResponseModel)
async def print_dispatch(dispatch_id: int, db: Session = Depends(get_db)):
    """打印派工单"""
    d = dispatch_service.get_dispatch(db, dispatch_id)
    if not d:
        raise HTTPException(status_code=404, detail="派工单不存在")

    from app.config import settings as app_settings

    technician_name = d.technician.username if d.technician else "未指派"
    sales_order_no = d.sales_order.order_no if d.sales_order else ""

    items = []
    for item in d.items:
        items.append({
            "product_name": item.product_name or "",
            "product_spec": item.product_spec or "",
            "quantity": item.quantity,
            "warehouse_name": item.warehouse_name or "",
            "install_remark": item.install_remark or ""
        })

    return ResponseModel(data={
        "shop_name": app_settings.SHOP_NAME,
        "shop_address": app_settings.SHOP_ADDRESS,
        "shop_phone": app_settings.SHOP_PHONE,
        "dispatch_no": d.dispatch_no,
        "sales_order_no": sales_order_no,
        "contact_name": d.contact_name or "",
        "contact_phone": d.contact_phone or "",
        "contact_address": d.contact_address or "",
        "assigned_to_name": technician_name,
        "status": d.status,
        "remark": d.remark or "",
        "created_at": d.created_at.strftime("%Y-%m-%d %H:%M:%S") if d.created_at else "",
        "items": items
    })