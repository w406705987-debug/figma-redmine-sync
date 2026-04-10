@echo off
chcp 65001 >nul
echo.
echo   Figma-易协作同步工具 启动脚本
echo   ================================
echo.

cd /d "%~dp0backend"

:: 检查 node_modules 是否存在
if not exist "node_modules" (
    echo [*] 首次运行，正在安装依赖...
    call npm install
    echo.
)

:: 检查并杀死占用 3000 端口的进程
echo [*] 检查端口 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    echo [*] 发现占用端口的进程 PID: %%a，正在终止...
    taskkill /F /PID %%a >nul 2>&1
)

echo [*] 启动本地服务...
echo.
node server.js

:: 如果出错，暂停显示错误
echo.
echo [!] 服务已停止，按任意键关闭窗口...
pause >nul