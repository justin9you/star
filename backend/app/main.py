from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db
from app.routers import auth, inventory, sales, report, backup


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    yield
    # Shutdown


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3352", "http://127.0.0.1:3352"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_PREFIX}/auth", tags=["认证"])
app.include_router(inventory.router, prefix=f"{settings.API_PREFIX}/inventory", tags=["库存管理"])
app.include_router(sales.router, prefix=f"{settings.API_PREFIX}/sales", tags=["销售管理"])
app.include_router(report.router, prefix=f"{settings.API_PREFIX}/report", tags=["报表统计"])
app.include_router(backup.router, prefix=f"{settings.API_PREFIX}/backup", tags=["数据备份"])


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}