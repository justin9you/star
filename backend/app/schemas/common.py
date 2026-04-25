from datetime import datetime
from typing import Optional, Generic, TypeVar, List
from pydantic import BaseModel

T = TypeVar('T')


class ResponseModel(BaseModel, Generic[T]):
    success: bool = True
    message: str = "操作成功"
    data: Optional[T] = None


class PaginationModel(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None


class IDRequest(BaseModel):
    id: int