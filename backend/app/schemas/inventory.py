from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from decimal import Decimal


# Brand schemas
class BrandCreate(BaseModel):
    name: str
    code: str
    remark: Optional[str] = None


class BrandUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    status: Optional[bool] = None
    remark: Optional[str] = None


class BrandResponse(BaseModel):
    id: int
    name: str
    code: str
    status: bool
    remark: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# Category schemas
class CategoryCreate(BaseModel):
    name: str
    code: str
    parent_id: Optional[int] = None
    sort: Optional[int] = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    parent_id: Optional[int] = None
    sort: Optional[int] = None
    status: Optional[bool] = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    code: str
    parent_id: Optional[int] = None
    sort: int
    status: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# Product schemas
class ProductCreate(BaseModel):
    name: str
    brand_id: int
    category_id: int
    spec: Optional[str] = None
    purchase_price: Decimal
    sale_price: Decimal
    unit: Optional[str] = "台"
    qr_code: Optional[str] = None
    barcode: Optional[str] = None
    remark: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand_id: Optional[int] = None
    category_id: Optional[int] = None
    spec: Optional[str] = None
    purchase_price: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    unit: Optional[str] = None
    qr_code: Optional[str] = None
    barcode: Optional[str] = None
    remark: Optional[str] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    brand_id: int
    category_id: int
    spec: Optional[str] = None
    purchase_price: Decimal
    sale_price: Decimal
    unit: str
    qr_code: Optional[str] = None
    barcode: Optional[str] = None
    remark: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# Warehouse schemas
class WarehouseCreate(BaseModel):
    name: str
    type: Optional[str] = "主仓"
    address: Optional[str] = None
    manager: Optional[str] = None
    phone: Optional[str] = None


class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    address: Optional[str] = None
    manager: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[bool] = None


class WarehouseResponse(BaseModel):
    id: int
    name: str
    type: str
    address: Optional[str] = None
    manager: Optional[str] = None
    phone: Optional[str] = None
    status: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# Inventory schemas
class InventoryCreate(BaseModel):
    product_id: int
    warehouse_id: int
    quantity: int = 0
    min_quantity: int = 10


class InventoryUpdate(BaseModel):
    quantity: Optional[int] = None
    min_quantity: Optional[int] = None


class InventoryResponse(BaseModel):
    id: int
    product_id: int
    warehouse_id: int
    quantity: int
    min_quantity: int
    product_name: Optional[str] = None
    warehouse_name: Optional[str] = None
    is_low_stock: Optional[bool] = None

    model_config = {"from_attributes": True}


# Stock-in schema
class StockInRequest(BaseModel):
    product_id: int
    warehouse_id: int
    quantity: int
    purchase_price: Optional[Decimal] = None