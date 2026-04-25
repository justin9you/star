from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from decimal import Decimal


# Customer schemas
class CustomerCreate(BaseModel):
    name: str
    phone: str
    province: Optional[str] = "江苏省"
    city: Optional[str] = "苏州市"
    district: Optional[str] = "吴中区"
    town: Optional[str] = "临湖镇"
    address: Optional[str] = None
    contact: Optional[str] = None
    remark: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    province: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    town: Optional[str] = None
    address: Optional[str] = None
    contact: Optional[str] = None
    remark: Optional[str] = None


class CustomerResponse(BaseModel):
    id: int
    name: str
    phone: str
    province: str
    city: str
    district: str
    town: str
    address: Optional[str] = None
    contact: Optional[str] = None
    remark: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# Sales Order Item schemas
class SalesOrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: Decimal


class SalesOrderItemResponse(BaseModel):
    id: int
    order_id: int
    product_id: int
    product_name: Optional[str] = None
    product_spec: Optional[str] = None
    product_unit: Optional[str] = None
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

    model_config = {"from_attributes": True}


# Old Appliance schema (for trade-in)
class OldApplianceCreate(BaseModel):
    category: str
    brand: Optional[str] = None
    condition: str = "旧"
    recycle_price: Decimal = Decimal("0")
    warehouse_id: Optional[int] = None
    remark: Optional[str] = None


class OldApplianceResponse(BaseModel):
    id: int
    category: str
    brand: Optional[str] = None
    condition: str
    recycle_price: Decimal
    warehouse_id: Optional[int] = None
    recycle_date: datetime
    remark: Optional[str] = None

    model_config = {"from_attributes": True}


# Sales Order schemas
class SalesOrderCreate(BaseModel):
    customer_id: int
    items: List[SalesOrderItemCreate]
    discount_amount: Optional[Decimal] = Decimal("0")
    old_appliances: Optional[List[OldApplianceCreate]] = None
    remark: Optional[str] = None


class SalesOrderUpdate(BaseModel):
    customer_id: Optional[int] = None
    items: Optional[List[SalesOrderItemCreate]] = None
    discount_amount: Optional[Decimal] = None
    payment_status: Optional[str] = None
    remark: Optional[str] = None


class SalesOrderResponse(BaseModel):
    id: int
    order_no: str
    customer_id: int
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    total_amount: Decimal
    discount_amount: Decimal
    final_amount: Decimal
    payment_status: str
    status: str
    remark: Optional[str] = None
    created_at: datetime
    items: List[SalesOrderItemResponse] = []
    old_appliances: List[OldApplianceResponse] = []

    model_config = {"from_attributes": True}