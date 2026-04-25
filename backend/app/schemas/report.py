from datetime import date
from typing import List, Optional
from pydantic import BaseModel
from decimal import Decimal


class DailySalesResponse(BaseModel):
    date: date
    total_quantity: int
    total_orders: int
    total_amount: Decimal


class ProfitResponse(BaseModel):
    date: date
    revenue: Decimal
    cost: Decimal
    gross_profit: Decimal
    gross_margin: float


class TopProductResponse(BaseModel):
    product_id: int
    product_name: str
    total_quantity: int
    total_amount: Decimal


class InventoryReportResponse(BaseModel):
    warehouse_id: int
    warehouse_name: str
    product_id: int
    product_name: str
    quantity: int
    min_quantity: int
    is_low_stock: bool


class OldApplianceReportResponse(BaseModel):
    id: int
    category: str
    brand: Optional[str] = None
    condition: str
    recycle_price: Decimal
    warehouse_name: Optional[str] = None
    recycle_date: date


class DateRangeRequest(BaseModel):
    start_date: date
    end_date: date