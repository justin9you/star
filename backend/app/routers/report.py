from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
import io

from app.database import get_db
from app.schemas.common import ResponseModel
from app.schemas.report import DateRangeRequest
from app.services import report as report_service
from app.services.auth import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/daily-sales", response_model=ResponseModel)
async def get_daily_sales(
    target_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    result = report_service.get_daily_sales(db, target_date)
    return ResponseModel(data=result, message="获取成功")


@router.get("/profit", response_model=ResponseModel)
async def get_profit(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    if not start_date:
        start_date = date.today()
    if not end_date:
        end_date = date.today()
    result = report_service.get_profit_stats(db, start_date, end_date)
    return ResponseModel(data=result, message="获取成功")


@router.get("/top-products", response_model=ResponseModel)
async def get_top_products(
    limit: int = Query(10, ge=1, le=50),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    result = report_service.get_top_products(db, limit, start_date, end_date)
    return ResponseModel(data=result, message="获取成功")


@router.get("/inventory", response_model=ResponseModel)
async def get_inventory_report(
    warehouse_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    result = report_service.get_inventory_report(db, warehouse_id)
    return ResponseModel(data=result, message="获取成功")


@router.get("/old-appliances", response_model=ResponseModel)
async def get_old_appliance_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    result = report_service.get_old_appliance_report(db, start_date, end_date)
    return ResponseModel(data=result, message="获取成功")


@router.post("/export")
async def export_report(
    request: DateRangeRequest,
    report_type: str = Query(..., description="报表类型：sales/profit/inventory/old_appliances"),
    format: str = Query("xlsx", description="导出格式：xlsx/csv"),
    db: Session = Depends(get_db)
):
    from fastapi.responses import StreamingResponse
    from openpyxl import Workbook

    data = []
    filename = f"{report_type}_report"

    if report_type == "sales":
        data = [report_service.get_daily_sales(db, request.start_date)]
        filename = f"sales_{request.start_date.isoformat()}"
    elif report_type == "profit":
        data = [report_service.get_profit_stats(db, request.start_date, request.end_date)]
        filename = f"profit_{request.start_date.isoformat()}_{request.end_date.isoformat()}"
    elif report_type == "inventory":
        data = report_service.get_inventory_report(db)
        filename = "inventory_report"
    elif report_type == "old_appliances":
        data = report_service.get_old_appliance_report(db, request.start_date, request.end_date)
        filename = f"old_appliances_{request.start_date.isoformat()}"

    if format == "csv":
        import csv
        output = io.StringIO()
        if data:
            writer = csv.DictWriter(output, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8-sig')),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}.csv"}
        )
    else:
        wb = Workbook()
        ws = wb.active
        ws.title = report_type

        if data:
            headers = list(data[0].keys())
            ws.append(headers)
            for row in data:
                ws.append(list(row.values()))

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)

        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}.xlsx"}
        )