from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.schemas.common import ResponseModel, PaginationModel
from app.schemas.inventory import (
    BrandCreate, BrandUpdate, BrandResponse,
    CategoryCreate, CategoryUpdate, CategoryResponse,
    ProductCreate, ProductUpdate, ProductResponse,
    WarehouseCreate, WarehouseUpdate, WarehouseResponse,
    InventoryResponse, StockInRequest
)
from app.services import inventory as inventory_service
from app.services.auth import get_current_user
from app.models.user import User

router = APIRouter()


# ==================== 品牌管理 ====================
@router.post("/brands", response_model=ResponseModel)
async def create_brand(brand: BrandCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        result = inventory_service.create_brand(db, brand.name, brand.code, brand.remark, current_user.id)
        return ResponseModel(data={"id": result.id, "name": result.name, "code": result.code}, message="品牌创建成功")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/brands")
async def list_brands(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    db: Session = Depends(get_db)
):
    items, total = inventory_service.get_brands(db, page, page_size, keyword)
    return {
        "items": [{"id": i.id, "name": i.name, "code": i.code, "status": i.status, "remark": i.remark, "created_at": i.created_at.isoformat()} for i in items],
        "total": total, "page": page, "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.get("/brands/{brand_id}", response_model=ResponseModel)
async def get_brand(brand_id: int, db: Session = Depends(get_db)):
    brand = inventory_service.get_brand(db, brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="品牌不存在")
    return ResponseModel(data={"id": brand.id, "name": brand.name, "code": brand.code, "status": brand.status, "remark": brand.remark, "created_at": brand.created_at.isoformat()})


@router.put("/brands/{brand_id}", response_model=ResponseModel)
async def update_brand(brand_id: int, brand: BrandUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        result = inventory_service.update_brand(db, brand_id, brand.name, brand.code, brand.status, brand.remark, current_user.id)
        return ResponseModel(message="品牌更新成功")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/brands/{brand_id}", response_model=ResponseModel)
async def delete_brand(brand_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        inventory_service.delete_brand(db, brand_id, current_user.id)
        return ResponseModel(message="品牌删除成功")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== 电器类型管理 ====================
@router.post("/categories", response_model=ResponseModel)
async def create_category(category: CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        result = inventory_service.create_category(db, category.name, category.code, category.parent_id, category.sort or 0, current_user.id)
        return ResponseModel(data={"id": result.id, "name": result.name, "code": result.code}, message="类型创建成功")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/categories")
async def list_categories(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=100),
    parent_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    items, total = inventory_service.get_categories(db, page, page_size, parent_id)
    return {
        "items": [{"id": i.id, "name": i.name, "code": i.code, "parent_id": i.parent_id, "sort": i.sort, "status": i.status, "created_at": i.created_at.isoformat()} for i in items],
        "total": total, "page": page, "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.get("/categories/tree")
async def get_category_tree(db: Session = Depends(get_db)):
    tree = inventory_service.get_category_tree(db)
    return ResponseModel(data=tree)


@router.get("/categories/{category_id}", response_model=ResponseModel)
async def get_category(category_id: int, db: Session = Depends(get_db)):
    cat = inventory_service.get_category(db, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="类型不存在")
    return ResponseModel(data={"id": cat.id, "name": cat.name, "code": cat.code, "parent_id": cat.parent_id, "sort": cat.sort, "status": cat.status})


@router.put("/categories/{category_id}", response_model=ResponseModel)
async def update_category(category_id: int, category: CategoryUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        result = inventory_service.update_category(db, category_id, category.name, category.code, category.parent_id, category.sort, category.status, current_user.id)
        return ResponseModel(message="类型更新成功")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/categories/{category_id}", response_model=ResponseModel)
async def delete_category(category_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        inventory_service.delete_category(db, category_id, current_user.id)
        return ResponseModel(message="类型删除成功")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== 仓库管理 ====================
@router.post("/warehouses", response_model=ResponseModel)
async def create_warehouse(warehouse: WarehouseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        result = inventory_service.create_warehouse(db, warehouse.name, warehouse.type or "主仓", warehouse.address, warehouse.manager, warehouse.phone, current_user.id)
        return ResponseModel(data={"id": result.id, "name": result.name, "type": result.type}, message="仓库创建成功")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/warehouses")
async def list_warehouses(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    warehouse_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    items, total = inventory_service.get_warehouses(db, page, page_size, warehouse_type)
    return {
        "items": [{"id": i.id, "name": i.name, "type": i.type, "address": i.address, "manager": i.manager, "phone": i.phone, "status": i.status, "created_at": i.created_at.isoformat()} for i in items],
        "total": total, "page": page, "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.get("/warehouses/{warehouse_id}", response_model=ResponseModel)
async def get_warehouse(warehouse_id: int, db: Session = Depends(get_db)):
    wh = inventory_service.get_warehouse(db, warehouse_id)
    if not wh:
        raise HTTPException(status_code=404, detail="仓库不存在")
    return ResponseModel(data={"id": wh.id, "name": wh.name, "type": wh.type, "address": wh.address, "manager": wh.manager, "phone": wh.phone, "status": wh.status})


@router.put("/warehouses/{warehouse_id}", response_model=ResponseModel)
async def update_warehouse(warehouse_id: int, warehouse: WarehouseUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        result = inventory_service.update_warehouse(db, warehouse_id, warehouse.name, warehouse.type, warehouse.address, warehouse.manager, warehouse.phone, warehouse.status, current_user.id)
        return ResponseModel(message="仓库更新成功")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/warehouses/{warehouse_id}", response_model=ResponseModel)
async def delete_warehouse(warehouse_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        inventory_service.delete_warehouse(db, warehouse_id, current_user.id)
        return ResponseModel(message="仓库删除成功")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== 商品管理 ====================
@router.post("/products", response_model=ResponseModel)
async def create_product(product: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        result = inventory_service.create_product(db, product.name, product.brand_id, product.category_id,
                                                   product.purchase_price, product.sale_price, product.unit or "台",
                                                   product.spec, product.remark, current_user.id)
        return ResponseModel(data={"id": result.id, "name": result.name, "qr_code": result.qr_code}, message="商品创建成功")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/products")
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    brand_id: Optional[int] = None,
    category_id: Optional[int] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db)
):
    items, total = inventory_service.get_products(db, page, page_size, brand_id, category_id, keyword)
    result_items = []
    for i in items:
        brand = inventory_service.get_brand(db, i.brand_id)
        cat = inventory_service.get_category(db, i.category_id)
        result_items.append({
            "id": i.id, "name": i.name, "brand_id": i.brand_id, "category_id": i.category_id,
            "brand_name": brand.name if brand else "未知", "category_name": cat.name if cat else "未知",
            "spec": i.spec, "purchase_price": float(i.purchase_price), "sale_price": float(i.sale_price),
            "unit": i.unit, "qr_code": i.qr_code, "barcode": i.barcode, "remark": i.remark, "created_at": i.created_at.isoformat()
        })
    return {"items": result_items, "total": total, "page": page, "page_size": page_size, "total_pages": (total + page_size - 1) // page_size}


@router.get("/products/{product_id}", response_model=ResponseModel)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    p = inventory_service.get_product(db, product_id)
    if not p:
        raise HTTPException(status_code=404, detail="商品不存在")
    brand = inventory_service.get_brand(db, p.brand_id)
    cat = inventory_service.get_category(db, p.category_id)
    return ResponseModel(data={
        "id": p.id, "name": p.name, "brand_id": p.brand_id, "category_id": p.category_id,
        "brand_name": brand.name if brand else "未知", "category_name": cat.name if cat else "未知",
        "spec": p.spec, "purchase_price": float(p.purchase_price), "sale_price": float(p.sale_price),
        "unit": p.unit, "qr_code": p.qr_code, "barcode": p.barcode, "remark": p.remark, "created_at": p.created_at.isoformat()
    })


@router.get("/products/qr/{qr_code}", response_model=ResponseModel)
async def get_product_by_qr(qr_code: str, db: Session = Depends(get_db)):
    p = inventory_service.get_product_by_qr(db, qr_code)
    if not p:
        raise HTTPException(status_code=404, detail="商品不存在")
    brand = inventory_service.get_brand(db, p.brand_id)
    cat = inventory_service.get_category(db, p.category_id)
    return ResponseModel(data={
        "id": p.id, "name": p.name, "brand_id": p.brand_id, "category_id": p.category_id,
        "brand_name": brand.name if brand else "未知", "category_name": cat.name if cat else "未知",
        "spec": p.spec, "purchase_price": float(p.purchase_price), "sale_price": float(p.sale_price),
        "unit": p.unit, "qr_code": p.qr_code, "barcode": p.barcode, "remark": p.remark
    })


@router.get("/products/scan/{code}", response_model=ResponseModel)
async def scan_product(code: str, db: Session = Depends(get_db)):
    """扫码查询商品（支持二维码和条形码），返回库存信息"""
    result = inventory_service.get_product_by_code(db, code)
    if not result:
        raise HTTPException(status_code=404, detail="商品不存在")
    return ResponseModel(data=result)


@router.put("/products/{product_id}", response_model=ResponseModel)
async def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        update_data = {k: v for k, v in product.model_dump().items() if v is not None}
        result = inventory_service.update_product(db, product_id, current_user.id, **update_data)
        return ResponseModel(message="商品更新成功")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/products/{product_id}", response_model=ResponseModel)
async def delete_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        inventory_service.delete_product(db, product_id, current_user.id)
        return ResponseModel(message="商品删除成功")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== 库存管理 ====================
@router.get("/inventory")
async def list_inventory(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    product_id: Optional[int] = None,
    warehouse_id: Optional[int] = None,
    keyword: Optional[str] = None,
    low_stock_only: bool = False,
    db: Session = Depends(get_db)
):
    items, total = inventory_service.get_inventory_list(db, page, page_size, product_id, warehouse_id, keyword, low_stock_only)
    return {"items": items, "total": total, "page": page, "page_size": page_size, "total_pages": (total + page_size - 1) // page_size}


@router.post("/inventory/stock-in", response_model=ResponseModel)
async def stock_in(request: StockInRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        result = inventory_service.stock_in(db, request.product_id, request.warehouse_id, request.quantity, request.purchase_price, current_user.id)
        return ResponseModel(data={"quantity": result.quantity}, message="入库成功")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/inventory/low-stock", response_model=ResponseModel)
async def get_low_stock_list(db: Session = Depends(get_db)):
    items = inventory_service.get_low_stock_list(db)
    return ResponseModel(data=items, message="获取成功")