@echo off
chcp 65001 >nul
echo ===================================
echo 亚星电子销售管理系统 - 开发环境
echo ===================================
echo.

REM 设置项目根目录
set PROJECT_ROOT=%~dp0..
cd /d "%PROJECT_ROOT%"

REM 检查 .env 文件
if not exist ".env" (
    echo 正在创建 .env 文件...
    copy /Y ".env.example" ".env"
)

REM 启动后端（在新窗口）
echo [1/2] 启动后端服务...
start "亚星电子 - 后端服务" cmd /k "cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

REM 等待后端启动
timeout /t 5 /nobreak >nul

REM 启动前端（在新窗口）
echo [2/2] 启动前端服务...
start "亚星电子 - 前端服务" cmd /k "cd frontend && pnpm install && pnpm dev"

echo.
echo ===================================
echo 开发环境已启动！
echo 后端地址: http://127.0.0.1:8000
echo 前端地址: http://localhost:5173
echo API 文档: http://127.0.0.1:8000/docs
echo ===================================
pause