@echo off
chcp 65001 >nul
echo 正在启动亚星电子销售管理系统...
echo.

REM 启动后端服务
start "亚星电子销售管理系统 - 后端服务" yaxing-server.exe

REM 等待后端启动
timeout /t 3 /nobreak >nul

REM 打开浏览器
start http://127.0.0.1:8000

echo 系统已启动，请访问 http://127.0.0.1:8000
echo 按任意键关闭此窗口...
pause >nul