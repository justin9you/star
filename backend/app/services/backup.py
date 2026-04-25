import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional

from app.config import settings


def get_backup_dir() -> Path:
    backup_dir = Path(settings.BACKUP_DIR)
    backup_dir.mkdir(parents=True, exist_ok=True)
    return backup_dir


def create_backup(filename: Optional[str] = None) -> dict:
    """创建数据库备份"""
    db_path = Path(settings.DATABASE_PATH)
    if not db_path.exists():
        raise ValueError("数据库文件不存在")

    backup_dir = get_backup_dir()

    if not filename:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"yaxing_backup_{timestamp}.db"

    backup_path = backup_dir / filename
    shutil.copy2(db_path, backup_path)

    return {
        "filename": filename,
        "size": backup_path.stat().st_size,
        "created_at": datetime.now().isoformat(),
        "path": str(backup_path)
    }


def list_backups() -> list[dict]:
    """列出所有备份文件"""
    backup_dir = get_backup_dir()
    backups = []

    for f in sorted(backup_dir.glob("*.db"), reverse=True):
        stat = f.stat()
        backups.append({
            "filename": f.name,
            "size": stat.st_size,
            "created_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "path": str(f)
        })

    return backups


def restore_backup(filename: str) -> dict:
    """恢复备份"""
    backup_dir = get_backup_dir()
    backup_path = backup_dir / filename

    if not backup_path.exists():
        raise ValueError(f"备份文件不存在: {filename}")

    db_path = Path(settings.DATABASE_PATH)

    # 先备份当前数据库
    if db_path.exists():
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        pre_restore_backup = backup_dir / f"pre_restore_{timestamp}.db"
        shutil.copy2(db_path, pre_restore_backup)

    # 恢复备份
    shutil.copy2(backup_path, db_path)

    return {
        "filename": filename,
        "restored_at": datetime.now().isoformat(),
        "message": "数据恢复成功"
    }


def delete_backup(filename: str) -> dict:
    """删除备份文件"""
    backup_dir = get_backup_dir()
    backup_path = backup_dir / filename

    if not backup_path.exists():
        raise ValueError(f"备份文件不存在: {filename}")

    backup_path.unlink()

    return {"message": f"备份 {filename} 已删除"}


def cleanup_old_backups() -> int:
    """清理过期备份"""
    backup_dir = get_backup_dir()
    retention_days = settings.BACKUP_RETENTION_DAYS
    cutoff = datetime.now().timestamp() - (retention_days * 86400)

    deleted_count = 0
    for f in backup_dir.glob("*.db"):
        if f.stat().st_mtime < cutoff:
            f.unlink()
            deleted_count += 1

    return deleted_count