@echo off
chcp 65001 >nul
echo ===================================
echo 亚星电子销售管理系统 - 打包脚本
echo ===================================
echo.

REM 设置项目根目录
set PROJECT_ROOT=%~dp0..
cd /d "%PROJECT_ROOT%"

REM 1. 构建前端
echo [1/3] 构建前端...
cd frontend
call pnpm install
call pnpm build
if errorlevel 1 (
    echo 前端构建失败！
    pause
    exit /b 1
)
cd ..

REM 2. 安装后端依赖并打包
echo [2/3] 构建后端...
cd backend
pip install -r requirements.txt
pip install pyinstaller
pyinstaller --onefile --name yaxing-server --distpath ../dist --workpath ../build/temp --specpath ../build app/main.py
if errorlevel 1 (
    echo 后端构建失败！
    pause
    exit /b 1
)
cd ..

REM 3. 组装发布包
echo [3/3] 组装发布包...
if not exist "dist\yaxing-sales-system" mkdir "dist\yaxing-sales-system"
xcopy /E /I /Y "frontend\dist" "dist\yaxing-sales-system\frontend"
copy /Y "dist\yaxing-server.exe" "dist\yaxing-sales-system\"
copy /Y "scripts\start.bat" "dist\yaxing-sales-system\"
copy /Y ".env.example" "dist\yaxing-sales-system\.env"

echo.
echo ===================================
echo 打包完成！
echo 发布包位置: %PROJECT_ROOT%\dist\yaxing-sales-system
echo ===================================
pause