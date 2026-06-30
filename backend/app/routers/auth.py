from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import json

from app.database import get_db
from app.schemas.common import Token, ResponseModel
from app.config import settings
from app.services.auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    oauth2_scheme
)
from app.models.user import User
from app.services.log import log_operation

router = APIRouter()


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """用户登录"""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(seconds=settings.JWT_EXPIRES_IN)
    )

    # 记录登录日志
    log_operation(db, user.id, "登录", f"用户 {user.username} 登录成功")

    return Token(access_token=access_token, token_type="bearer")


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """用户登出"""
    log_operation(db, current_user.id, "登出", f"用户 {current_user.username} 登出")
    return ResponseModel(message="登出成功")


@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """获取当前用户信息"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "name": current_user.name or current_user.username,
        "created_at": current_user.created_at.isoformat()
    }