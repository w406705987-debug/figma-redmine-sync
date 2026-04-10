@echo off
chcp 65001 >nul
echo ============================================
echo   Figma-易协作同步工具 - 停止服务
echo ============================================
echo.

:: 查找并终止 node server.js 进程
echo 正在停止服务...
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo list ^| find "PID:"') do (
    wmic process where "ProcessId=%%i" get CommandLine 2>nul | find "server.js" >nul
    if not errorlevel 1 (
        taskkill /pid %%i /f >nul 2>&1
        echo ✅ 已停止进程 PID: %%i
    )
)

echo.
echo 服务已停止。
echo.
pause
