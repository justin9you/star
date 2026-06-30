from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
from typing import List

from app.database import get_db
from app.schemas.common import ResponseModel
from app.services import backup as backup_service
from app.services.auth import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/download")
async def download_backup(filename: str, current_user: User = Depends(get_current_user)):
    """下载备份文件"""
    safe_name = Path(filename).name  # 防止路径穿越
    backup_path = Path(backup_service.get_backup_dir()) / safe_name
    if not backup_path.exists() or backup_path.suffix != ".db":
        raise HTTPException(status_code=404, detail="备份文件不存在")
    return FileResponse(path=str(backup_path), filename=safe_name, media_type="application/octet-stream")


@router.get("/list", response_model=ResponseModel)
async def list_backups(current_user: User = Depends(get_current_user)):
    backups = backup_service.list_backups()
    return ResponseModel(data=backups, message="获取成功")


@router.post("/create", response_model=ResponseModel)
async def create_backup(
    filename: str = None,
    current_user: User = Depends(get_current_user)
):
    try:
        result = backup_service.create_backup(filename)
        return ResponseModel(data=result, message="备份创建成功")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/restore", response_model=ResponseModel)
async def restore_backup(
    backup_id: int = None,
    filename: str = None,
    current_user: User = Depends(get_current_user)
):
    try:
        if not filename:
            backups = backup_service.list_backups()
            if backup_id and backup_id <= len(backups):
                filename = backups[backup_id - 1]["filename"]
            else:
                raise HTTPException(status_code=400, detail="请指定备份文件名")

        result = backup_service.restore_backup(filename)
        return ResponseModel(data=result, message="备份恢复成功")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/upload", response_model=ResponseModel)
async def upload_backup(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    from pathlib import Path
    backup_dir = Path(backup_service.get_backup_dir())
    file_path = backup_dir / file.filename

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    return ResponseModel(data={"filename": file.filename, "size": len(content)}, message="备份上传成功")


@router.delete("/{backup_id}", response_model=ResponseModel)
async def delete_backup(backup_id: int, current_user: User = Depends(get_current_user)):
    try:
        backups = backup_service.list_backups()
        if backup_id > len(backups) or backup_id < 1:
            raise HTTPException(status_code=404, detail="备份不存在")

        filename = backups[backup_id - 1]["filename"]
        result = backup_service.delete_backup(filename)
        return ResponseModel(message="备份删除成功")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))