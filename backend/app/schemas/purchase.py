from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from decimal import Decimal


class PurchaseOrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: Optional[Decimal] = None
    is_gift: bool = False


class PurchaseOrderItemResponse(BaseModel):
    id: int
    order_id: int
    product_id: int
    product_name: Optional[str] = None
    product_spec: Optional[str] = None
    product_unit: Optional[str] = None
    quantity: int
    unit_price: Decimal
    subtotal: Decimal
    is_gift: bool

    model_config = {"from_attributes": True}


class PurchaseOrderCreate(BaseModel):
    warehouse_id: int
    items: List[PurchaseOrderItemCreate]
    supplier_name: Optional[str] = None
    supplier_phone: Optional[str] = None
    remark: Optional[str] = None


class PurchaseOrderResponse(BaseModel):
    id: int
    order_no: str
    supplier_name: Optional[str] = None
    supplier_phone: Optional[str] = None
    warehouse_id: int
    warehouse_name: Optional[str] = None
    total_amount: Decimal
    total_quantity: int
    gift_quantity: int
    status: str
    remark: Optional[str] = None
    created_at: datetime
    items: List[PurchaseOrderItemResponse] = []

    model_config = {"from_attributes": True}
